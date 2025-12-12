from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from apps.rooms.models import Room, Amenity, RoomImage, RoomAvailability
from apps.rooms.serializers import (
    RoomListSerializer, RoomDetailSerializer, AmenitySerializer,
    RoomCreateUpdateSerializer, RoomImageSerializer, RoomImageCreateSerializer,
    RoomAvailabilitySerializer
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

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrStaff])
    def bulk_add_images(self, request, slug=None):
        """Add multiple images to a room at once"""
        room = self.get_object()
        images_data = []
        errors = []

        # Handle multiple file uploads
        files = request.FILES.getlist('images')  # For file uploads
        urls = request.data.getlist('image_urls')  # For URL uploads

        # Get starting order value (next highest order)
        max_order = room.images.aggregate(models.Max('order'))['order__max'] or 0
        current_order = max_order + 1

        # Process file uploads
        for idx, file in enumerate(files):
            data = {
                'room': room.id,
                'image': file,
                'order': current_order + idx
            }
            serializer = RoomImageCreateSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                images_data.append(serializer.data)
            else:
                errors.append({'file': file.name, 'errors': serializer.errors})

        # Process URL uploads
        for idx, url in enumerate(urls):
            if url:  # Skip empty URLs
                data = {
                    'room': room.id,
                    'image_url': url,
                    'order': current_order + len(files) + idx
                }
                serializer = RoomImageCreateSerializer(data=data, context={'request': request})
                if serializer.is_valid():
                    serializer.save()
                    images_data.append(serializer.data)
                else:
                    errors.append({'url': url, 'errors': serializer.errors})

        return Response({
            'success': images_data,
            'errors': errors,
            'total_uploaded': len(images_data),
            'total_errors': len(errors)
        }, status=status.HTTP_201_CREATED if images_data else status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'], permission_classes=[IsAdminOrStaff])
    def reorder_images(self, request, slug=None):
        """Reorder room images. Expects array of {id, order} objects"""
        room = self.get_object()
        image_orders = request.data.get('images', [])

        if not isinstance(image_orders, list):
            return Response(
                {'error': 'Expected "images" to be an array of {id, order} objects'},
                status=status.HTTP_400_BAD_REQUEST
            )

        updated_count = 0
        errors = []

        for item in image_orders:
            image_id = item.get('id')
            new_order = item.get('order')

            if image_id is None or new_order is None:
                errors.append({'error': 'Each item must have "id" and "order"', 'item': item})
                continue

            try:
                image = RoomImage.objects.get(id=image_id, room=room)
                image.order = new_order
                image.save(update_fields=['order'])
                updated_count += 1
            except RoomImage.DoesNotExist:
                errors.append({'error': 'Image not found', 'id': image_id})

        return Response({
            'updated': updated_count,
            'errors': errors
        }, status=status.HTTP_200_OK if updated_count > 0 else status.HTTP_400_BAD_REQUEST)


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


class RoomAvailabilityViewSet(viewsets.ModelViewSet):
    """
    Admin endpoints for managing room availability/busy periods:
    - GET /api/room-availability/ - List all availability periods
    - GET /api/room-availability/?room={room_id} - Filter by room
    - POST /api/room-availability/ - Create new busy period
    - PUT/PATCH /api/room-availability/{id}/ - Update busy period
    - DELETE /api/room-availability/{id}/ - Delete busy period
    """
    queryset = RoomAvailability.objects.select_related('room', 'booking')
    serializer_class = RoomAvailabilitySerializer
    permission_classes = [IsAdminOrStaff]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['room', 'status']

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by room
        room_id = self.request.query_params.get('room')
        if room_id:
            queryset = queryset.filter(room_id=room_id)

        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date:
            queryset = queryset.filter(end_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(start_date__lte=end_date)

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
