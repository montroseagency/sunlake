# Sunlake Hotel - Complete Implementation Guide

## Current Status

✅ **COMPLETED:**
1. Backend Django project initialized
2. Database models created (User, Room, RoomImage, Amenity, Booking, SeasonalPrice)
3. Migrations applied
4. Booking service with availability logic created
5. Django settings configured with CORS, DRF, JWT

## Next Steps to Complete

### BACKEND - Remaining Files

You need to create the following files to complete the backend API. I'm providing the complete code for each:

---

## 1. SERIALIZERS

### File: `hotel-backend/apps/rooms/serializers.py`

```python
from rest_framework import serializers
from apps.rooms.models import Room, RoomImage, Amenity


class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ['id', 'name', 'icon']


class RoomImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = RoomImage
        fields = ['id', 'image', 'alt_text', 'is_primary', 'order']

    def get_image(self, obj):
        return obj.image_url


class RoomListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for room listings"""
    primary_image = serializers.SerializerMethodField()
    amenities = AmenitySerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = [
            'id', 'name', 'slug', 'room_type', 'capacity',
            'base_price_per_night', 'primary_image', 'amenities'
        ]

    def get_primary_image(self, obj):
        image = obj.images.filter(is_primary=True).first()
        return image.image_url if image else None


class RoomDetailSerializer(serializers.ModelSerializer):
    """Full room details"""
    images = RoomImageSerializer(many=True, read_only=True)
    amenities = AmenitySerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = [
            'id', 'name', 'slug', 'description', 'room_type',
            'capacity', 'size_sqm', 'base_price_per_night',
            'images', 'amenities', 'is_active', 'created_at'
        ]
```

### File: `hotel-backend/apps/bookings/serializers.py`

```python
from rest_framework import serializers
from apps.bookings.models import Booking, SeasonalPrice
from apps.bookings.services import BookingService
from apps.rooms.serializers import RoomListSerializer


class BookingCreateSerializer(serializers.ModelSerializer):
    """Create booking with validation"""

    class Meta:
        model = Booking
        fields = [
            'room', 'check_in_date', 'check_out_date',
            'guest_name', 'guest_email', 'guest_phone',
            'number_of_guests', 'special_requests'
        ]

    def validate(self, data):
        # Check availability
        available = BookingService.check_availability(
            data['room'].id,
            data['check_in_date'],
            data['check_out_date']
        )

        if not available:
            raise serializers.ValidationError({
                'room': 'This room is not available for the selected dates'
            })

        return data

    def create(self, validated_data):
        # Calculate total price
        total_price = BookingService.calculate_total_price(
            validated_data['room'].id,
            validated_data['check_in_date'],
            validated_data['check_out_date']
        )

        validated_data['total_price'] = total_price

        # Set guest from request user if authenticated
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['guest'] = request.user

        return super().create(validated_data)


class BookingSerializer(serializers.ModelSerializer):
    """Read booking details"""
    room = RoomListSerializer(read_only=True)
    nights = serializers.IntegerField(read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'room', 'check_in_date', 'check_out_date',
            'guest_name', 'guest_email', 'guest_phone',
            'number_of_guests', 'special_requests',
            'total_price', 'status', 'nights',
            'created_at', 'updated_at'
        ]


class SeasonalPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeasonalPrice
        fields = ['id', 'room', 'name', 'start_date', 'end_date', 'price_per_night']
```

### File: `hotel-backend/apps/users/serializers.py`

```python
from rest_framework import serializers
from apps.users.models import CustomUser


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'role', 'is_staff']
        read_only_fields = ['is_staff']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'phone']

    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user
```

---

## 2. API VIEWS

### File: `hotel-backend/apps/rooms/views.py`

```python
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from apps.rooms.models import Room, Amenity
from apps.rooms.serializers import RoomListSerializer, RoomDetailSerializer, AmenitySerializer
from apps.bookings.services import BookingService
from datetime import datetime


class RoomViewSet(viewsets.ModelViewSet):
    """
    Public endpoints:
    - GET /api/rooms/ - List rooms (with filters)
    - GET /api/rooms/{slug}/ - Get room details

    Admin endpoints:
    - POST /api/rooms/ - Create room
    - PUT/PATCH /api/rooms/{id}/ - Update room
    - DELETE /api/rooms/{id}/ - Delete room
    """
    queryset = Room.objects.filter(is_active=True).prefetch_related('images', 'amenities')
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['room_type', 'capacity']
    ordering_fields = ['base_price_per_night', 'created_at']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RoomDetailSerializer
        return RoomListSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

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
                pass  # Invalid date format, skip filtering

        return queryset


class AmenityViewSet(viewsets.ReadOnlyModelViewSet):
    """List all amenities"""
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer
```

### File: `hotel-backend/apps/bookings/views.py`

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from apps.bookings.models import Booking
from apps.bookings.serializers import BookingCreateSerializer, BookingSerializer
from apps.bookings.services import BookingService
from datetime import datetime


class BookingViewSet(viewsets.ModelViewSet):
    """
    Public endpoints:
    - POST /api/bookings/ - Create booking
    - GET /api/bookings/check-availability/ - Check availability

    Authenticated endpoints:
    - GET /api/bookings/ - List user's bookings

    Admin endpoints:
    - GET /api/bookings/?all=true - List all bookings
    - PATCH /api/bookings/{id}/ - Update booking status
    """
    queryset = Booking.objects.select_related('room').prefetch_related('room__images')

    def get_serializer_class(self):
        if self.action == 'create':
            return BookingCreateSerializer
        return BookingSerializer

    def get_permissions(self):
        if self.action == 'create' or self.action == 'check_availability':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user

        # Admin can see all bookings
        if user.is_staff or (hasattr(user, 'role') and user.role == 'ADMIN'):
            return super().get_queryset()

        # Regular users see only their bookings
        return super().get_queryset().filter(guest=user)

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
```

### File: `hotel-backend/apps/users/views.py`

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from apps.users.models import CustomUser
from apps.users.serializers import UserSerializer, UserRegistrationSerializer


class UserViewSet(viewsets.GenericViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action == 'register':
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """Register a new user"""
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                UserSerializer(user).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user info"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
```

---

## 3. URL CONFIGURATION

### File: `hotel-backend/hotel_project/urls.py`

```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('apps.rooms.urls')),
    path('api/', include('apps.bookings.urls')),
    path('api/', include('apps.users.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### File: `hotel-backend/apps/rooms/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.rooms.views import RoomViewSet, AmenityViewSet

router = DefaultRouter()
router.register(r'rooms', RoomViewSet)
router.register(r'amenities', AmenityViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
```

### File: `hotel-backend/apps/bookings/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.bookings.views import BookingViewSet

router = DefaultRouter()
router.register(r'bookings', BookingViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
```

### File: `hotel-backend/apps/users/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.users.views import UserViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
```

---

## 4. DJANGO ADMIN

### File: `hotel-backend/apps/rooms/admin.py`

```python
from django.contrib import admin
from apps.rooms.models import Room, RoomImage, Amenity


class RoomImageInline(admin.TabularInline):
    model = RoomImage
    extra = 1


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'room_type', 'capacity', 'base_price_per_night', 'is_active']
    list_filter = ['room_type', 'is_active']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [RoomImageInline]
    filter_horizontal = ['amenities']


@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon']
    search_fields = ['name']
```

### File: `hotel-backend/apps/bookings/admin.py`

```python
from django.contrib import admin
from apps.bookings.models import Booking, SeasonalPrice


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'room', 'guest_name', 'check_in_date', 'check_out_date', 'status', 'total_price']
    list_filter = ['status', 'check_in_date']
    search_fields = ['guest_name', 'guest_email', 'room__name']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'check_in_date'


@admin.register(SeasonalPrice)
class SeasonalPriceAdmin(admin.ModelAdmin):
    list_display = ['room', 'name', 'start_date', 'end_date', 'price_per_night']
    list_filter = ['room']
    date_hierarchy = 'start_date'
```

### File: `hotel-backend/apps/users/admin.py`

```python
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from apps.users.models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_staff']
    list_filter = ['role', 'is_staff', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone')}),
    )
```

---

## 5. TESTING THE BACKEND

### Create Superuser

```bash
cd hotel-backend
python manage.py createsuperuser
```

### Run Server

```bash
python manage.py runserver
```

### Test API Endpoints

1. Admin: http://localhost:8000/admin
2. API Root: http://localhost:8000/api/
3. Rooms: http://localhost:8000/api/rooms/
4. Bookings: http://localhost:8000/api/bookings/

### Create Sample Data via Django Admin

1. Go to http://localhost:8000/admin
2. Create some Amenities (WiFi, Pool, etc.)
3. Create Rooms with images (use image URLs like from Unsplash)
4. Create test bookings

---

## FRONTEND - Next Steps

See FRONTEND_IMPLEMENTATION.md for complete frontend code.

## Quick Command Summary

```bash
# Backend
cd hotel-backend
python manage.py runserver  # Start backend on port 8000

# Frontend (after setup)
cd hotel-frontend
npm run dev  # Start frontend on port 3000
```
