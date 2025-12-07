from rest_framework import serializers
from apps.bookings.models import Booking, SeasonalPrice
from apps.bookings.services import BookingService
from apps.rooms.serializers import RoomListSerializer
from datetime import date


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
        check_in = data['check_in_date']
        check_out = data['check_out_date']
        room = data['room']
        number_of_guests = data.get('number_of_guests', 1)

        # Validate dates are in the future
        if check_in < date.today():
            raise serializers.ValidationError({
                'check_in_date': 'Check-in date cannot be in the past'
            })

        # Validate check-out is after check-in
        if check_out <= check_in:
            raise serializers.ValidationError({
                'check_out_date': 'Check-out date must be after check-in date'
            })

        # Validate room capacity
        if number_of_guests > room.capacity:
            raise serializers.ValidationError({
                'number_of_guests': f'This room can only accommodate {room.capacity} guest(s). You selected {number_of_guests}.'
            })

        # Check if room is available (no conflicting bookings or blocked periods)
        available = BookingService.check_availability(
            room.id,
            check_in,
            check_out
        )

        if not available:
            raise serializers.ValidationError({
                'room': 'This room is not available for the selected dates. It may already be booked or blocked for maintenance.'
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
