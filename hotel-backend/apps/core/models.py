from django.db import models


class GalleryImage(models.Model):
    """Gallery images for the hotel"""
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='gallery_images/', null=True, blank=True)
    image_url = models.URLField(max_length=500, blank=True)  # Optional URL fallback
    category = models.CharField(
        max_length=50,
        choices=[
            ('HOTEL', 'Hotel'),
            ('ROOM', 'Room'),
            ('DINING', 'Dining'),
            ('FACILITIES', 'Facilities'),
            ('EVENTS', 'Events'),
            ('OTHER', 'Other'),
        ],
        default='OTHER'
    )
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'gallery_images'
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.title

    @property
    def get_image(self):
        """Return image URL - prioritize uploaded file, fallback to URL"""
        if self.image:
            return self.image.url
        return self.image_url
