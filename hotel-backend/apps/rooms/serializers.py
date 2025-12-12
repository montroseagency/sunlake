from rest_framework import serializers
from apps.rooms.models import Room, RoomImage, Amenity, RoomAvailability


class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ['id', 'name', 'icon']


class RoomImageSerializer(serializers.ModelSerializer):
    image_display = serializers.SerializerMethodField()

    class Meta:
        model = RoomImage
        fields = ['id', 'image', 'image_url', 'image_display', 'alt_text', 'is_primary', 'order']

    def get_image_display(self, obj):
        """Return the full URL for the image"""
        request = self.context.get('request')
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.image_url


class RoomImageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating room images"""
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = RoomImage
        fields = ['id', 'room', 'image', 'image_url', 'alt_text', 'is_primary', 'order']

    def validate(self, data):
        """Ensure either image or image_url is provided"""
        image = data.get('image')
        image_url = data.get('image_url')

        # Check if at least one is provided and not empty
        if not image and not image_url:
            raise serializers.ValidationError('Either image file or image_url must be provided')

        return data


class RoomListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for room listings"""
    primary_image = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    amenities = AmenitySerializer(many=True, read_only=True)
    view_type_display = serializers.CharField(source='get_view_type_display', read_only=True)
    bed_configuration_display = serializers.CharField(source='get_bed_configuration_display', read_only=True)

    class Meta:
        model = Room
        fields = [
            'id', 'name', 'slug', 'room_type', 'capacity', 'max_occupancy',
            'bed_configuration', 'bed_configuration_display', 'number_of_beds',
            'size_sqm', 'view_type', 'view_type_display', 'has_balcony',
            'base_price_per_night', 'primary_image', 'images', 'amenities', 'wheelchair_accessible'
        ]

    def get_primary_image(self, obj):
        # Try to get primary image first
        image = obj.images.filter(is_primary=True).first()

        # If no primary image, get the first image
        if not image:
            image = obj.images.first()

        if not image:
            return None

        # Return the full URL - prefer uploaded image, fallback to image_url
        request = self.context.get('request')
        if image.image:
            if request:
                return request.build_absolute_uri(image.image.url)
            return image.image.url
        return image.image_url

    def get_images(self, obj):
        """Return first 5 images for list view (ordered by is_primary, then order)"""
        images = obj.images.all()[:5]  # Limit to first 5 images for performance
        return RoomImageSerializer(images, many=True, context=self.context).data


class RoomDetailSerializer(serializers.ModelSerializer):
    """Full room details"""
    images = RoomImageSerializer(many=True, read_only=True)
    amenities = AmenitySerializer(many=True, read_only=True)
    availability_periods = serializers.SerializerMethodField()
    is_currently_available = serializers.SerializerMethodField()

    # Display fields for choice fields
    room_type_display = serializers.CharField(source='get_room_type_display', read_only=True)
    view_type_display = serializers.CharField(source='get_view_type_display', read_only=True)
    bed_configuration_display = serializers.CharField(source='get_bed_configuration_display', read_only=True)
    smoking_policy_display = serializers.CharField(source='get_smoking_policy_display', read_only=True)
    pet_policy_display = serializers.CharField(source='get_pet_policy_display', read_only=True)

    class Meta:
        model = Room
        fields = [
            # Basic Info
            'id', 'name', 'slug', 'description', 'room_type', 'room_type_display',

            # Bed & Capacity
            'capacity', 'max_occupancy', 'bed_configuration', 'bed_configuration_display',
            'number_of_beds', 'size_sqm', 'base_price_per_night',

            # In-Room Features
            'wifi', 'air_conditioning', 'tv', 'telephone', 'work_desk',
            'storage', 'safe', 'minibar', 'coffee_maker', 'iron_board',

            # Bathroom
            'bathroom_features',

            # View & Perks
            'view_type', 'view_type_display', 'has_balcony', 'is_soundproof', 'special_perks',

            # Accessibility
            'wheelchair_accessible', 'accessible_bathroom',

            # Media
            'virtual_tour_url',

            # Policies
            'check_in_time', 'check_out_time', 'smoking_policy', 'smoking_policy_display',
            'pet_policy', 'pet_policy_display',

            # Optional Extras
            'has_kitchenette', 'has_seating_area',

            # Legacy & Metadata
            'images', 'amenities', 'is_active', 'created_at',
            'availability_periods', 'is_currently_available'
        ]

    def get_availability_periods(self, obj):
        """Get upcoming busy periods for this room"""
        from datetime import date
        upcoming_periods = obj.availability_periods.filter(
            end_date__gte=date.today()
        ).order_by('start_date')[:10]  # Next 10 periods
        return RoomAvailabilitySerializer(upcoming_periods, many=True).data

    def get_is_currently_available(self, obj):
        """Check if room is available today"""
        from datetime import date
        today = date.today()
        busy_today = obj.availability_periods.filter(
            start_date__lte=today,
            end_date__gte=today
        ).exists()
        return not busy_today


class RoomCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating rooms"""
    amenities = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Amenity.objects.all(),
        required=False
    )

    class Meta:
        model = Room
        fields = [
            # Basic Info
            'id', 'name', 'slug', 'description', 'room_type',

            # Bed & Capacity
            'capacity', 'max_occupancy', 'bed_configuration', 'number_of_beds',
            'size_sqm', 'base_price_per_night',

            # In-Room Features
            'wifi', 'air_conditioning', 'tv', 'telephone', 'work_desk',
            'storage', 'safe', 'minibar', 'coffee_maker', 'iron_board',

            # Bathroom
            'bathroom_features',

            # View & Perks
            'view_type', 'has_balcony', 'is_soundproof', 'special_perks',

            # Accessibility
            'wheelchair_accessible', 'accessible_bathroom',

            # Media
            'virtual_tour_url',

            # Policies
            'check_in_time', 'check_out_time', 'smoking_policy', 'pet_policy',

            # Optional Extras
            'has_kitchenette', 'has_seating_area',

            # Legacy & Metadata
            'amenities', 'is_active'
        ]
        read_only_fields = ['slug']

    def create(self, validated_data):
        amenities = validated_data.pop('amenities', [])
        room = Room.objects.create(**validated_data)
        room.amenities.set(amenities)
        return room

    def update(self, instance, validated_data):
        amenities = validated_data.pop('amenities', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if amenities is not None:
            instance.amenities.set(amenities)

        return instance


class RoomAvailabilitySerializer(serializers.ModelSerializer):
    room_name = serializers.CharField(source='room.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = RoomAvailability
        fields = [
            'id', 'room', 'room_name', 'start_date', 'end_date',
            'status', 'status_display', 'notes', 'booking',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'booking']

    def validate(self, data):
        """Validate date range and check for overlapping periods"""
        if data.get('start_date') and data.get('end_date'):
            if data['start_date'] > data['end_date']:
                raise serializers.ValidationError('End date must be after start date')

            # Check for overlapping periods for the same room
            room = data.get('room')
            if room:
                overlapping = RoomAvailability.objects.filter(
                    room=room,
                    start_date__lte=data['end_date'],
                    end_date__gte=data['start_date']
                )

                # Exclude current instance when updating
                if self.instance:
                    overlapping = overlapping.exclude(pk=self.instance.pk)

                if overlapping.exists():
                    raise serializers.ValidationError(
                        f'Room already has a busy period during this time range'
                    )

        return data
