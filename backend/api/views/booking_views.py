from rest_framework import viewsets, status, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from datetime import datetime, timedelta, time
from django_filters.rest_framework import DjangoFilterBackend
from ..models import Club, Court, Booking
from ..serializers import ClubSerializer, CourtSerializer, BookingSerializer


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['court', 'booking_date', 'status']
    search_fields = ['court__club__name', 'notes']
    
    def get_queryset(self):
        user = self.request.user
        
        # For managers: show all bookings for their clubs
        if user.groups.filter(name="Manager").exists():
            return Booking.objects.filter(court__club__manager=user)
        
        # For admins: show all bookings
        if user.is_superuser or user.groups.filter(name="Admin").exists():
            return Booking.objects.all()
        
        # For regular users: show only their own bookings
        return Booking.objects.filter(user=user)
    
    def perform_create(self, serializer):
        # Set the user to the current user unless specified and has permission
        user = self.request.user
        if 'user' not in self.request.data or not (user.is_superuser or user.groups.filter(name__in=["Admin", "Manager"]).exists()):
            serializer.save(user=user)
        else:
            serializer.save()
    
    @action(detail=False, methods=['get'])
    def calendar(self, request):
        """
        Get bookings for the calendar view with filtering options.
        For managers: All bookings for their club(s)
        For users: Their own bookings
        """
        user = self.request.user
        start_date = request.query_params.get('start_date', datetime.now().date())
        end_date = request.query_params.get('end_date', datetime.now().date() + timedelta(days=30))
        club_id = request.query_params.get('club')
        
        # Base queryset
        queryset = self.get_queryset()
        
        # Apply date filtering
        queryset = queryset.filter(
            booking_date__gte=start_date,
            booking_date__lte=end_date
        )
        
        # Apply club filtering if provided
        if club_id:
            queryset = queryset.filter(court__club_id=club_id)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    # Update api/views/booking_views.py - BookingViewSet.available_slots method

@action(detail=False, methods=['GET'])
def available_slots(self, request):
    """Get available time slots for courts based on filters"""
    club_id = request.query_params.get('club_id')
    court_type = request.query_params.get('court_type')
    date_str = request.query_params.get('date')
    
    if not club_id:
        return Response({"error": "Club ID is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get the club to access its settings
    try:
        club = Club.objects.get(id=club_id)
    except Club.DoesNotExist:
        return Response({"error": "Club not found"}, status=status.HTTP_404_NOT_FOUND)
    
    # Parse date
    try:
        if date_str:
            selected_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        else:
            selected_date = datetime.now().date()
    except ValueError:
        return Response({"error": "Invalid date format"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if bookings are allowed for this date
    today = datetime.now().date()
    max_date = today + timedelta(days=club.max_advance_booking_days)
    if selected_date > max_date:
        return Response({
            "error": f"Bookings are only allowed up to {club.max_advance_booking_days} days in advance"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check for special hours
    special_hours = ClubSpecialHours.objects.filter(club=club, date=selected_date).first()
    
    if special_hours and special_hours.is_closed:
        return Response({
            "message": f"The club is closed on {selected_date}",
            "reason": special_hours.reason
        }, status=status.HTTP_200_OK)
    
    # Get opening and closing times for this date
    if special_hours:
        opening_time = special_hours.opening_time
        closing_time = special_hours.closing_time
    else:
        opening_time = club.opening_time
        closing_time = club.closing_time
    
    # Convert club hours to datetime objects for easy manipulation
    opening_dt = datetime.combine(selected_date, opening_time)
    closing_dt = datetime.combine(selected_date, closing_time)
    
    # Calculate time slots based on club's booking increment
    increment_minutes = club.booking_increment
    
    # Query courts based on filters
    courts_query = Court.objects.filter(club_id=club_id, is_active=True)
    if court_type and court_type != 'all':
        courts_query = courts_query.filter(court_type=court_type)
    
    # Get all active courts
    courts = courts_query.all()
    
    # Prepare response data structure
    available_slots = []
    
    # Check if selected date is today, for same-day booking cutoff
    is_today = selected_date == today
    now = datetime.now()
    
    # Get weekday for recurring restrictions
    weekday = selected_date.weekday()
    
    for court in courts:
        # Get recurring restrictions for this court and weekday
        recurring_restrictions = court.availability_restrictions.filter(weekday=weekday)
        
        # Get existing bookings for this court on the selected date
        existing_bookings = Booking.objects.filter(
            court=court,
            booking_date=selected_date,
            status__in=['pending', 'confirmed']
        )
        
        # Create a list of available time slots for this court
        court_slots = []
        
        # Generate slots from opening to closing time
        current_time = opening_dt
        while current_time + timedelta(minutes=increment_minutes) <= closing_dt:
            slot_start = current_time
            slot_end = current_time + timedelta(minutes=increment_minutes)
            
            # Check if slot is available (not already booked)
            is_available = True
            
            # Check for booking conflicts
            for booking in existing_bookings:
                booking_start = datetime.combine(selected_date, booking.start_time)
                booking_end = datetime.combine(selected_date, booking.end_time)
                
                if (slot_start < booking_end and slot_end > booking_start):
                    is_available = False
                    break
            
            # Check for recurring restrictions
            for restriction in recurring_restrictions:
                restriction_start = datetime.combine(selected_date, restriction.start_time)
                restriction_end = datetime.combine(selected_date, restriction.end_time)
                
                if (slot_start < restriction_end and slot_end > restriction_start):
                    is_available = False
                    break
            
            # Check same-day booking cutoff
            if is_today and club.same_day_booking_cutoff > 0:
                cutoff_time = slot_start - timedelta(hours=club.same_day_booking_cutoff)
                if now > cutoff_time:
                    is_available = False
            
            # Add available slot to the list
            if is_available:
                court_slots.append({
                    "start_time": slot_start.time().strftime('%H:%M:%S'),
                    "end_time": slot_end.time().strftime('%H:%M:%S'),
                    "formatted_time": f"{slot_start.strftime('%I:%M %p')} - {slot_end.strftime('%I:%M %p')}"
                })
            
            # Move to next time slot
            current_time += timedelta(minutes=increment_minutes)
        
        # Add court to available slots if it has any available slots
        if court_slots:
            available_slots.append({
                "court_id": court.id,
                "court_number": court.court_number,
                "court_type": court.court_type,
                "available_slots": court_slots
            })
    
    return Response(available_slots)