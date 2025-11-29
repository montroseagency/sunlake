from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from apps.bookings.models import Booking
from apps.bookings.serializers import BookingCreateSerializer, BookingSerializer
from apps.bookings.services import BookingService
from apps.rooms.views import IsAdminOrStaff
from apps.rooms.models import RoomAvailability
from datetime import datetime


class BookingViewSet(viewsets.ModelViewSet):
    """
    Public endpoints:
    - POST /api/bookings/ - Create booking
    - GET /api/bookings/check-availability/ - Check availability

    Authenticated endpoints:
    - GET /api/bookings/ - List user's bookings

    Admin endpoints:
    - GET /api/bookings/ - List all bookings (for admin)
    - PATCH /api/bookings/{id}/ - Update booking (status, etc.)
    - DELETE /api/bookings/{id}/ - Delete booking
    - PATCH /api/bookings/{id}/update_status/ - Update booking status
    """
    queryset = Booking.objects.select_related('room').prefetch_related('room__images').order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return BookingCreateSerializer
        return BookingSerializer

    def get_permissions(self):
        if self.action == 'create' or self.action == 'check_availability':
            return [AllowAny()]
        elif self.action in ['update', 'partial_update', 'destroy', 'update_status']:
            return [IsAdminOrStaff()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user

        if not user or not user.is_authenticated:
            return Booking.objects.none()

        # Admin/Staff can see all bookings
        if hasattr(user, 'role') and user.role in ['ADMIN', 'STAFF']:
            queryset = super().get_queryset()

            # Filter by status if provided
            status_filter = self.request.query_params.get('status')
            if status_filter:
                queryset = queryset.filter(status=status_filter)

            # Filter by date range
            start_date = self.request.query_params.get('start_date')
            end_date = self.request.query_params.get('end_date')
            if start_date:
                queryset = queryset.filter(check_in_date__gte=start_date)
            if end_date:
                queryset = queryset.filter(check_out_date__lte=end_date)

            return queryset

        # Regular users see only their bookings
        return super().get_queryset().filter(guest=user)

    def perform_create(self, serializer):
        """Create booking and automatically create busy period"""
        booking = serializer.save()

        # Auto-create busy period for confirmed bookings
        if booking.status in ['CONFIRMED', 'PENDING']:
            RoomAvailability.objects.create(
                room=booking.room,
                start_date=booking.check_in_date,
                end_date=booking.check_out_date,
                status='BUSY',
                booking=booking,
                notes=f'Auto-created for booking #{booking.id}'
            )

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def check_availability(self, request):
        """Check if a room is available for given dates"""
        room_id = request.query_params.get('room_id')
        check_in = request.query_params.get('check_in')
        check_out = request.query_params.get('check_out')

        if not all([room_id, check_in, check_out]):
            return Response(
                {'error': 'room_id, check_in, and check_out are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
            check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()

            is_available = BookingService.check_availability(
                int(room_id),
                check_in_date,
                check_out_date
            )

            total_price = None
            if is_available:
                total_price = str(BookingService.calculate_total_price(
                    int(room_id),
                    check_in_date,
                    check_out_date
                ))

            return Response({
                'available': is_available,
                'total_price': total_price
            })
        except ValueError as e:
            return Response(
                {'error': 'Invalid date format or room_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['patch'], permission_classes=[IsAdminOrStaff])
    def update_status(self, request, pk=None):
        """Update booking status"""
        booking = self.get_object()
        old_status = booking.status
        new_status = request.data.get('status')

        if new_status not in dict(Booking.Status.choices):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking.status = new_status
        booking.save()

        # Handle room availability based on status changes
        if new_status == 'CANCELLED' and hasattr(booking, 'availability_period'):
            # Delete busy period if booking is cancelled
            booking.availability_period.all().delete()
        elif new_status in ['CONFIRMED', 'PENDING'] and old_status == 'CANCELLED':
            # Re-create busy period if booking is reactivated
            RoomAvailability.objects.get_or_create(
                room=booking.room,
                start_date=booking.check_in_date,
                end_date=booking.check_out_date,
                defaults={
                    'status': 'BUSY',
                    'booking': booking,
                    'notes': f'Auto-created for booking #{booking.id}'
                }
            )

        serializer = self.get_serializer(booking)
        return Response(serializer.data)
