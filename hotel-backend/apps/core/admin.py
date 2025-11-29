from django.contrib import admin
from apps.core.models import GalleryImage


@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'order', 'is_active', 'created_at']
    list_filter = ['category', 'is_active']
    search_fields = ['title', 'description']
    ordering = ['order', '-created_at']
