from django.contrib import admin
from apps.bookings.models import Booking, SeasonalPrice


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'room', 'guest_name', 'check_in_date', 'check_out_date', 'status', 'total_price', 'created_at']
    list_filter = ['status', 'check_in_date', 'room']
    search_fields = ['guest_name', 'guest_email', 'room__name', 'id']
    readonly_fields = ['created_at', 'updated_at', 'total_price']
    date_hierarchy = 'check_in_date'
    list_editable = ['status']
    fieldsets = (
        ('Booking Info', {
            'fields': ('room', 'check_in_date', 'check_out_date', 'status')
        }),
        ('Guest Details', {
            'fields': ('guest', 'guest_name', 'guest_email', 'guest_phone', 'number_of_guests', 'special_requests')
        }),
        ('Pricing', {
            'fields': ('total_price',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(SeasonalPrice)
class SeasonalPriceAdmin(admin.ModelAdmin):
    list_display = ['room', 'name', 'start_date', 'end_date', 'price_per_night', 'created_at']
    list_filter = ['room', 'start_date']
    search_fields = ['name', 'room__name']
    date_hierarchy = 'start_date'
