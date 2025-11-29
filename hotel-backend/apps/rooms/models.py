from django.db import models
from django.utils.text import slugify


class Amenity(models.Model):
    """Hotel amenities (WiFi, Pool, etc.)"""
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True)  # Icon class name

    class Meta:
        db_table = 'amenities'
        verbose_name_plural = 'Amenities'

    def __str__(self):
        return self.name


class Room(models.Model):
    """Hotel room"""

    class RoomType(models.TextChoices):
        STANDARD = 'STANDARD', 'Standard Room'
        DELUXE = 'DELUXE', 'Deluxe Room'
        SUITE = 'SUITE', 'Suite'
        PENTHOUSE = 'PENTHOUSE', 'Penthouse'

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    description = models.TextField()
    room_type = models.CharField(
        max_length=20,
        choices=RoomType.choices,
        default=RoomType.STANDARD
    )
    capacity = models.PositiveIntegerField(default=2)
    size_sqm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    base_price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    amenities = models.ManyToManyField(Amenity, related_name='rooms', blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'rooms'
        ordering = ['room_type', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.get_room_type_display()})"


class RoomImage(models.Model):
    """Room images"""
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='room_images/', null=True, blank=True)
    image_url = models.URLField(max_length=500, blank=True)  # Optional URL fallback
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'room_images'
        ordering = ['-is_primary', 'order', '-created_at']

    def save(self, *args, **kwargs):
        # Ensure only one primary image per room
        if self.is_primary:
            RoomImage.objects.filter(room=self.room, is_primary=True).update(is_primary=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Image for {self.room.name}"

    @property
    def get_image(self):
        """Return image URL - prioritize uploaded file, fallback to URL"""
        if self.image:
            return self.image.url
        return self.image_url


class RoomAvailability(models.Model):
    """Track room busy/unavailable periods"""

    class Status(models.TextChoices):
        BUSY = 'BUSY', 'Busy (Booked)'
        MAINTENANCE = 'MAINTENANCE', 'Under Maintenance'
        BLOCKED = 'BLOCKED', 'Blocked by Admin'

    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='availability_periods')
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.BLOCKED
    )
    notes = models.TextField(blank=True)
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='availability_period'
    )
    created_by = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'room_availability'
        ordering = ['start_date']
        verbose_name_plural = 'Room Availability Periods'

    def __str__(self):
        return f"{self.room.name}: {self.status} ({self.start_date} to {self.end_date})"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValidationError('End date must be after start date')
