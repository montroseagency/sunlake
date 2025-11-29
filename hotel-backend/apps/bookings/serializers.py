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
