from django.db.models import Q
from datetime import date, timedelta
from decimal import Decimal
from apps.rooms.models import Room, RoomAvailability
from apps.bookings.models import Booking, SeasonalPrice


class BookingService:
    """Business logic for bookings"""

    @staticmethod
    def check_availability(room_id: int, check_in: date, check_out: date) -> bool:
        """
        Check if a room is available for given dates.

        A room is unavailable if:
        1. There's ANY booking where dates overlap (not cancelled)
        2. There's ANY availability period blocking the dates

        Overlap conditions:
        - New check-in is before existing check-out/end-date AND
        - New check-out is after existing check-in/start-date
        """
        # Check for conflicting bookings
        conflicting_bookings = Booking.objects.filter(
            room_id=room_id,
            check_in_date__lt=check_out,  # Existing check-in before new check-out
            check_out_date__gt=check_in   # Existing check-out after new check-in
        ).exclude(status=Booking.Status.CANCELLED)

        if conflicting_bookings.exists():
            return False

        # Check for blocked/unavailable periods (maintenance, admin blocks, etc.)
        conflicting_availability = RoomAvailability.objects.filter(
            room_id=room_id,
            start_date__lt=check_out,  # Block starts before new check-out
            end_date__gt=check_in      # Block ends after new check-in
        )

        if conflicting_availability.exists():
            return False

        return True

    @staticmethod
    def get_available_rooms(check_in: date, check_out: date, capacity: int = None):
        """
        Get all available rooms for given dates.

        A room is available ONLY if it's completely free from check-in to check-out.
        This means NO overlapping:
        1. Bookings (except cancelled ones)
        2. RoomAvailability periods (maintenance, blocks, etc.)
        """
        # Get all active rooms
        rooms = Room.objects.filter(is_active=True)

        if capacity:
            rooms = rooms.filter(capacity__gte=capacity)

        # Filter out rooms with conflicting bookings
        # A booking conflicts if: booking_check_in < search_check_out AND booking_check_out > search_check_in
        conflicting_booking_ids = Booking.objects.filter(
            check_in_date__lt=check_out,   # Booking starts before our check-out
            check_out_date__gt=check_in    # Booking ends after our check-in
        ).exclude(status=Booking.Status.CANCELLED).values_list('room_id', flat=True)

        # Filter out rooms with conflicting availability periods (blocked, maintenance, etc.)
        # Same overlap logic applies
        conflicting_availability_ids = RoomAvailability.objects.filter(
            start_date__lt=check_out,      # Block starts before our check-out
            end_date__gt=check_in          # Block ends after our check-in
        ).values_list('room_id', flat=True)

        # Combine both exclusion lists
        all_unavailable_room_ids = set(conflicting_booking_ids) | set(conflicting_availability_ids)

        # Return only rooms that are NOT in the unavailable list
        available_rooms = rooms.exclude(id__in=all_unavailable_room_ids)

        return available_rooms

    @staticmethod
    def calculate_total_price(room_id: int, check_in: date, check_out: date) -> Decimal:
        """
        Calculate total price considering base price and seasonal pricing.

        Algorithm:
        1. Get number of nights
        2. For each night, check if there's a seasonal price
        3. If yes, use seasonal price; else use base price
        4. Sum all night prices
        """
        room = Room.objects.get(id=room_id)
        total = Decimal('0.00')
        current_date = check_in

        while current_date < check_out:
            # Check for seasonal price
            seasonal_price = SeasonalPrice.objects.filter(
                room=room,
                start_date__lte=current_date,
                end_date__gte=current_date
            ).first()

            if seasonal_price:
                total += seasonal_price.price_per_night
            else:
                total += room.base_price_per_night

            # Move to next day
            current_date += timedelta(days=1)

        return total
