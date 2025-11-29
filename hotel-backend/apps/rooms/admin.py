from django.contrib import admin
from apps.rooms.models import Room, RoomImage, Amenity


class RoomImageInline(admin.TabularInline):
    model = RoomImage
    extra = 1
    fields = ['image_url', 'alt_text', 'is_primary', 'order']


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'room_type', 'capacity', 'base_price_per_night', 'is_active', 'created_at']
    list_filter = ['room_type', 'is_active', 'capacity']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [RoomImageInline]
    filter_horizontal = ['amenities']
    list_editable = ['is_active']


@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon']
    search_fields = ['name']


@admin.register(RoomImage)
class RoomImageAdmin(admin.ModelAdmin):
    list_display = ['room', 'is_primary', 'order', 'created_at']
    list_filter = ['is_primary', 'room']
    list_editable = ['is_primary', 'order']
