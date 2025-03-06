# api/admin.py
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.auth.admin import UserAdmin, GroupAdmin
from .models import Club, Court, Booking


@admin.register(Club)
class ClubAdmin(admin.ModelAdmin):
    list_display = ('name', 'manager', 'is_approved', 'created_at')
    list_filter = ('is_approved', 'created_at', 'city', 'state')
    search_fields = ('name', 'city', 'state')
    actions = ['approve_clubs']

    @admin.action(description='Approve selected clubs')
    def approve_clubs(self, request, queryset):
        queryset.update(is_approved=True)


@admin.register(Court)
class CourtAdmin(admin.ModelAdmin):
    list_display = ('club', 'court_type', 'court_number')
    list_filter = ('court_type', 'club')
    search_fields = ('club__name', 'court_type', 'court_number')

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('court', 'user', 'booking_date', 'start_time', 'end_time')
