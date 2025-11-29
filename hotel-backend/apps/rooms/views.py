from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from apps.rooms.models import Room, Amenity, RoomImage
from apps.rooms.serializers import (
    RoomListSerializer, RoomDetailSerializer, AmenitySerializer,
    RoomCreateUpdateSerializer, RoomImageSerializer, RoomImageCreateSerializer
)
from apps.bookings.services import BookingService
from datetime import datetime


class IsAdminOrStaff(IsAuthenticated):
    """Custom permission for admin and staff users"""
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role in ['ADMIN', 'STAFF']


class RoomViewSet(viewsets.ModelViewSet):
    """
    Public endpoints:
    - GET /api/rooms/ - List rooms (with filters)
    - GET /api/rooms/{slug}/ - Get room details

    Admin endpoints (requires authentication):
    - POST /api/rooms/ - Create room
    - PUT/PATCH /api/rooms/{id}/ - Update room
    - DELETE /api/rooms/{id}/ - Delete room
    - POST /api/rooms/{id}/add_image/ - Add image to room
    - DELETE /api/rooms/{id}/remove_image/ - Remove image from room
    """
    queryset = Room.objects.all().prefetch_related('images', 'amenities')
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['room_type', 'capacity', 'is_active']
    ordering_fields = ['base_price_per_night', 'created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticatedOrReadOnly()]
        return [IsAdminOrStaff()]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RoomDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return RoomCreateUpdateSerializer
        return RoomListSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # For public, only show active rooms
        if not (self.request.user and self.request.user.is_authenticated
                and self.request.user.role in ['ADMIN', 'STAFF']):
            queryset = queryset.filter(is_active=True)

        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')

        if min_price:
            queryset = queryset.filter(base_price_per_night__gte=min_price)
        if max_price:
            queryset = queryset.filter(base_price_per_night__lte=max_price)

        # Filter by availability
        check_in = self.request.query_params.get('check_in')
        check_out = self.request.query_params.get('check_out')

        if check_in and check_out:
            try:
                check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
                check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()

                available_rooms = BookingService.get_available_rooms(
                    check_in_date,
                    check_out_date
                )
                queryset = queryset.filter(id__in=available_rooms.values_list('id', flat=True))
            except ValueError:
                pass

        return queryset

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrStaff])
    def add_image(self, request, slug=None):
        """Add an image to a room - supports both file upload and URL"""
        room = self.get_object()

        # Create a mutable copy of request data
        data = request.data.copy()
        data['room'] = room.id

        serializer = RoomImageCreateSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['delete'], permission_classes=[IsAdminOrStaff], url_path='remove_image/(?P<image_id>[^/.]+)')
    def remove_image(self, request, slug=None, image_id=None):
        """Remove an image from a room"""
        room = self.get_object()
        try:
            image = RoomImage.objects.get(id=image_id, room=room)
            image.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except RoomImage.DoesNotExist:
            return Response(
                {'error': 'Image not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class RoomImageViewSet(viewsets.ModelViewSet):
    """Admin endpoints for managing room images"""
    queryset = RoomImage.objects.all()
    serializer_class = RoomImageCreateSerializer
    permission_classes = [IsAdminOrStaff]


class AmenityViewSet(viewsets.ModelViewSet):
    """Amenity management endpoints"""
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticatedOrReadOnly()]
        return [IsAdminOrStaff()]
