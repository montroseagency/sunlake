from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.rooms.models import Room
from apps.users.models import CustomUser


class SeasonalPrice(models.Model):
    """Seasonal pricing for rooms"""
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='seasonal_prices')
    name = models.CharField(max_length=100)  # e.g., "Summer Season", "Holiday Week"
    start_date = models.DateField()
    end_date = models.DateField()
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'seasonal_prices'
        ordering = ['start_date']

    def clean(self):
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValidationError('End date must be after start date')

    def __str__(self):
        return f"{self.room.name} - {self.name}"


class Booking(models.Model):
    """Room booking"""

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        CHECKED_IN = 'CHECKED_IN', 'Checked In'
        CHECKED_OUT = 'CHECKED_OUT', 'Checked Out'

    # Room & dates
    room = models.ForeignKey(Room, on_delete=models.PROTECT, related_name='bookings')
    check_in_date = models.DateField()
    check_out_date = models.DateField()

    # Guest info
    guest = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bookings'
    )
    guest_name = models.CharField(max_length=200)
    guest_email = models.EmailField()
    guest_phone = models.CharField(max_length=20)
    number_of_guests = models.PositiveIntegerField(default=1)
    special_requests = models.TextField(blank=True)

    # Pricing
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bookings'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['check_in_date', 'check_out_date']),
            models.Index(fields=['status']),
        ]

    def clean(self):
        # Validate dates
        if self.check_in_date and self.check_out_date:
            if self.check_in_date >= self.check_out_date:
                raise ValidationError('Check-out date must be after check-in date')

            if self.check_in_date < timezone.now().date():
                raise ValidationError('Check-in date cannot be in the past')

        # Validate capacity
        if self.room and self.number_of_guests > self.room.capacity:
            raise ValidationError(f'Room capacity is {self.room.capacity} guests')

    def __str__(self):
        return f"Booking #{self.id} - {self.room.name} ({self.check_in_date} to {self.check_out_date})"

    @property
    def nights(self):
        """Calculate number of nights"""
        return (self.check_out_date - self.check_in_date).days
