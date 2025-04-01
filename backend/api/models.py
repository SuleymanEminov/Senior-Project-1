from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from datetime import datetime, time

UserProfile = get_user_model()

class Club(models.Model):
    name = models.CharField(max_length=100)
    address = models.TextField()
    city = models.CharField(max_length=50)
    state = models.CharField(max_length=50)
    zip_code = models.CharField(max_length=10)
    manager = models.ForeignKey(
        UserProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_clubs",
        limit_choices_to={"groups__name": "Manager"},
    )
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    website = models.URLField(null=True, blank=True)
    courts_summary = models.JSONField(
        default=list,
        help_text="Store a summary of courts, e.g., [{'type': 'hard', 'count': 3}]"
    )
    # Add new fields for booking settings
    opening_time = models.TimeField(default=time(8, 0))  # Default: 8:00 AM
    closing_time = models.TimeField(default=time(20, 0))  # Default: 8:00 PM
    min_booking_duration = models.IntegerField(default=60, help_text="Minimum booking duration in minutes")
    max_booking_duration = models.IntegerField(default=120, help_text="Maximum booking duration in minutes")
    booking_increment = models.IntegerField(default=30, help_text="Booking time increment in minutes")
    max_advance_booking_days = models.IntegerField(default=14, help_text="Maximum days in advance for booking")
    same_day_booking_cutoff = models.IntegerField(default=0, help_text="Hours before start time that same-day booking is cut off")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_approved = models.BooleanField(default=False)

    def __str__(self):
        return self.name
    
# Add to api/models.py

class ClubSpecialHours(models.Model):
    """Special operating hours for a club on specific dates (holidays, events, etc.)"""
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='special_hours')
    date = models.DateField()
    is_closed = models.BooleanField(default=False)
    opening_time = models.TimeField(null=True, blank=True)
    closing_time = models.TimeField(null=True, blank=True)
    reason = models.CharField(max_length=255, blank=True)
    
    class Meta:
        unique_together = ['club', 'date']
        verbose_name = 'Special hours'
        verbose_name_plural = 'Special hours'
        
    def __str__(self):
        if self.is_closed:
            return f"{self.club.name} - {self.date} - CLOSED"
        return f"{self.club.name} - {self.date} - {self.opening_time}-{self.closing_time}"

class Court(models.Model):
    COURT_TYPES = [
        ('hard', 'Hard'),
        ('clay', 'Clay'),
        ('grass', 'Grass'),
    ]
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='court_details')
    court_type = models.CharField(max_length=20, choices=COURT_TYPES)
    court_number = models.IntegerField()
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['club', 'court_number']
    
    def __str__(self):
        return f"{self.club.name} - {self.get_court_type_display()} Court #{self.court_number}"

class CourtAvailabilityRestriction(models.Model):
    """For recurring restrictions, e.g., court maintenance every Monday 8-10am"""
    WEEKDAYS = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]
    
    court = models.ForeignKey(Court, on_delete=models.CASCADE, related_name='availability_restrictions')
    weekday = models.IntegerField(choices=WEEKDAYS)
    start_time = models.TimeField()
    end_time = models.TimeField()
    reason = models.CharField(max_length=255, blank=True)
    
    class Meta:
        verbose_name = 'Court restriction'
        verbose_name_plural = 'Court restrictions'
    
    def __str__(self):
        return f"{self.court} - {self.get_weekday_display()} {self.start_time}-{self.end_time}"

class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('canceled', 'Canceled'),
        ('completed', 'Completed'),
    ]
    
    court = models.ForeignKey(Court, on_delete=models.CASCADE, related_name='bookings')
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='bookings')
    booking_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['booking_date', 'start_time']
        # Ensure no overlapping bookings for the same court
        constraints = [
            models.UniqueConstraint(
                fields=['court', 'booking_date', 'start_time'],
                name='unique_booking'
            ),
        ]
    
    def clean(self):
        # Check if end time is after start time
        if self.end_time <= self.start_time:
            raise ValidationError("End time must be after start time")
        
        # Check if court is available during requested time
        overlapping_bookings = Booking.objects.filter(
            court=self.court,
            booking_date=self.booking_date,
            status__in=['pending', 'confirmed'],
        ).exclude(id=self.id)
        
        for booking in overlapping_bookings:
            # Check for time overlap
            if (self.start_time < booking.end_time and 
                self.end_time > booking.start_time):
                raise ValidationError(f"This court is already booked from {booking.start_time} to {booking.end_time}")
        
        # Check if booking is within club operating hours
        club_opening = self.court.club.opening_time
        club_closing = self.court.club.closing_time
        
        if self.start_time < club_opening or self.end_time > club_closing:
            raise ValidationError(f"Booking must be within club hours: {club_opening} - {club_closing}")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.court} - {self.booking_date} ({self.start_time}-{self.end_time})"


