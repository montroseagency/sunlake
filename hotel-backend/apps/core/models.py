from django.db import models
from django.utils.text import slugify


class GalleryCategory(models.Model):
    """Dynamic categories for gallery images"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'gallery_categories'
        ordering = ['order', 'name']
        verbose_name_plural = 'Gallery Categories'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class ContactMessage(models.Model):
    """Contact form submissions"""
    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'contact_messages'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.subject}"


class GalleryImage(models.Model):
    """Gallery images for the hotel"""
    category = models.ForeignKey(
        GalleryCategory,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(upload_to='gallery_images/', null=True, blank=True)
    image_url = models.URLField(max_length=500, blank=True)  # Optional URL fallback
    alt_text = models.CharField(max_length=200, blank=True, help_text="Alternative text for accessibility")
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'gallery_images'
        ordering = ['category', 'order', '-created_at']

    def __str__(self):
        return f"{self.category.name} - Image {self.id}"

    @property
    def get_image(self):
        """Return image URL - prioritize uploaded file, fallback to URL"""
        if self.image:
            return self.image.url
        return self.image_url
