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

    class ViewType(models.TextChoices):
        CITY = 'CITY', 'City View'
        SEA = 'SEA', 'Sea View'
        GARDEN = 'GARDEN', 'Garden View'
        MOUNTAIN = 'MOUNTAIN', 'Mountain View'
        POOL = 'POOL', 'Pool View'
        COURTYARD = 'COURTYARD', 'Courtyard View'
        NO_VIEW = 'NO_VIEW', 'No Specific View'

    class BedType(models.TextChoices):
        SINGLE = 'SINGLE', 'Single Bed'
        DOUBLE = 'DOUBLE', 'Double Bed'
        QUEEN = 'QUEEN', 'Queen Bed'
        KING = 'KING', 'King Bed'
        TWIN = 'TWIN', 'Twin Beds'
        BUNK = 'BUNK', 'Bunk Beds'

    class SmokingPolicy(models.TextChoices):
        NON_SMOKING = 'NON_SMOKING', 'Non-Smoking'
        SMOKING = 'SMOKING', 'Smoking Allowed'
        DESIGNATED_AREA = 'DESIGNATED_AREA', 'Designated Smoking Area'

    class PetPolicy(models.TextChoices):
        NOT_ALLOWED = 'NOT_ALLOWED', 'Pets Not Allowed'
        ALLOWED = 'ALLOWED', 'Pets Allowed'
        ON_REQUEST = 'ON_REQUEST', 'Pets Allowed on Request'

    # Basic Room Identity
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    description = models.TextField()
    room_type = models.CharField(
        max_length=20,
        choices=RoomType.choices,
        default=RoomType.STANDARD
    )
    max_occupancy = models.PositiveIntegerField(default=2, help_text="Maximum number of guests")
    capacity = models.PositiveIntegerField(default=2)  # Keep for backward compatibility
    bed_configuration = models.CharField(
        max_length=20,
        choices=BedType.choices,
        default=BedType.QUEEN,
        help_text="Type of bed(s) in the room"
    )
    number_of_beds = models.PositiveIntegerField(default=1, help_text="Number of beds")
    size_sqm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    base_price_per_night = models.DecimalField(max_digits=10, decimal_places=2)

    # In-Room Features & Amenities (Boolean Fields)
    wifi = models.BooleanField(default=True, verbose_name="Free Wi-Fi")
    air_conditioning = models.BooleanField(default=True, verbose_name="Air Conditioning/Heating")
    tv = models.BooleanField(default=True, verbose_name="TV/Entertainment System")
    telephone = models.BooleanField(default=True, verbose_name="Telephone")
    work_desk = models.BooleanField(default=True, verbose_name="Work Desk/Workspace")
    storage = models.BooleanField(default=True, verbose_name="Wardrobe/Closet")
    safe = models.BooleanField(default=True, verbose_name="In-Room Safe")
    minibar = models.BooleanField(default=False, verbose_name="Mini-bar/Fridge")
    coffee_maker = models.BooleanField(default=True, verbose_name="Coffee & Tea Maker")
    iron_board = models.BooleanField(default=True, verbose_name="Iron & Ironing Board")

    # Bathroom Features
    bathroom_features = models.TextField(
        blank=True,
        help_text="Comma-separated list: e.g., 'Toiletries, Hairdryer, Towels, Bathrobe, Slippers'"
    )

    # View & Special Perks
    view_type = models.CharField(
        max_length=20,
        choices=ViewType.choices,
        default=ViewType.NO_VIEW,
        verbose_name="View Type"
    )
    has_balcony = models.BooleanField(default=False, verbose_name="Balcony/Terrace")
    is_soundproof = models.BooleanField(default=False, verbose_name="Soundproofing")
    special_perks = models.TextField(
        blank=True,
        help_text="Special perks like welcome gifts, luxury toiletries, etc."
    )

    # Accessibility Features
    wheelchair_accessible = models.BooleanField(default=False, verbose_name="Wheelchair Accessible")
    accessible_bathroom = models.BooleanField(default=False, verbose_name="Accessible Bathroom Features")

    # Media
    virtual_tour_url = models.URLField(max_length=500, blank=True, verbose_name="Virtual Tour/Video URL")

    # Policies & Practical Info
    check_in_time = models.TimeField(null=True, blank=True, help_text="Standard check-in time")
    check_out_time = models.TimeField(null=True, blank=True, help_text="Standard check-out time")
    smoking_policy = models.CharField(
        max_length=20,
        choices=SmokingPolicy.choices,
        default=SmokingPolicy.NON_SMOKING,
        verbose_name="Smoking Policy"
    )
    pet_policy = models.CharField(
        max_length=20,
        choices=PetPolicy.choices,
        default=PetPolicy.NOT_ALLOWED,
        verbose_name="Pet Policy"
    )

    # Optional Extras
    has_kitchenette = models.BooleanField(default=False, verbose_name="Kitchenette/Full Kitchen")
    has_seating_area = models.BooleanField(default=False, verbose_name="In-Room Seating Area")

    # Legacy fields
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
        else:
            # If this is the first image for the room, make it primary
            if not self.pk and not RoomImage.objects.filter(room=self.room).exists():
                self.is_primary = True
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
