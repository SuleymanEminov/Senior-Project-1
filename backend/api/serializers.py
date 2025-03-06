from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Club, Court, Booking

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class RegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'password2', 'email', 'first_name', 'last_name']
        extra_kwargs = {'password': {'write_only': True}}

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class CourtSerializer(serializers.ModelSerializer):
    club_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Court
        fields = ['id', 'club', 'club_name', 'court_type', 'court_number', 'is_active']
    
    def get_club_name(self, obj):
        return obj.club.name

class ClubSerializer(serializers.ModelSerializer):
    court_details = CourtSerializer(many=True, read_only=True)
    
    class Meta:
        model = Club
        fields = [
            "id",
            "name",
            "address",
            "city",
            "state",
            "zip_code",
            "manager",
            "phone_number",
            "email",
            "website",
            "courts_summary",
            "court_details",
            "opening_time",
            "closing_time",
            "created_at",
            "updated_at",
            "is_approved",
        ]
        read_only_fields = ['manager', 'is_approved']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['manager'] = request.user
        return super().create(validated_data)

class BookingSerializer(serializers.ModelSerializer):
    court_details = CourtSerializer(source='court', read_only=True)
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 
            'court', 
            'court_details',
            'user',
            'user_details',
            'booking_date', 
            'start_time', 
            'end_time', 
            'created_at',
            'updated_at',
            'status',
            'notes'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, data):
        # Additional validation logic
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError("End time must be after start time")
        
        # Check for booking conflicts
        court = data['court']
        booking_date = data['booking_date']
        start_time = data['start_time']
        end_time = data['end_time']
        booking_id = self.instance.id if self.instance else None
        
        overlapping_bookings = Booking.objects.filter(
            court=court,
            booking_date=booking_date,
            status__in=['pending', 'confirmed']
        )
        
        if booking_id:
            overlapping_bookings = overlapping_bookings.exclude(id=booking_id)
        
        for booking in overlapping_bookings:
            if (start_time < booking.end_time and end_time > booking.start_time):
                raise serializers.ValidationError(
                    f"Booking conflict: Court already booked from "
                    f"{booking.start_time} to {booking.end_time}"
                )
        
        # Check if booking is within club operating hours
        if start_time < court.club.opening_time or end_time > court.club.closing_time:
            raise serializers.ValidationError(
                f"Booking must be within club hours: "
                f"{court.club.opening_time} - {court.club.closing_time}"
            )
            
        return data