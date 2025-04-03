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
        court_type = request.query_params.get('court_type', 'all')
        date_str = request.query_params.get('date')
        
        if not club_id:
            return Response({"error": "Club ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Parse date
        try:
            if date_str:
                selected_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            else:
                selected_date = datetime.now().date()
        except ValueError:
            return Response({"error": "Invalid date format"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get the club to access its settings
        try:
            club = Club.objects.get(id=club_id)
        except Club.DoesNotExist:
            return Response({"error": "Club not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Query courts based on filters
        courts_query = Court.objects.filter(club_id=club_id, is_active=True)
        if court_type and court_type != 'all':
            courts_query = courts_query.filter(court_type=court_type)
        
        # Get all active courts
        courts = courts_query.all()
        
        # Prepare response data structure
        available_slots = []
        
        # Get existing bookings for these courts on the selected date
        existing_bookings = Booking.objects.filter(
            court__in=courts,
            booking_date=selected_date,
            status__in=['pending', 'confirmed']
        )
        
        # Generate time slots based on club's operating hours
        opening_time = club.opening_time
        closing_time = club.closing_time
        increment_minutes = club.booking_increment or 60  # Default to 60 minutes if not set
        
        for court in courts:
            # Get existing bookings for this court
            court_bookings = existing_bookings.filter(court=court).order_by('start_time')
            booking_ranges = [
                {
                    "start": booking.start_time.strftime('%H:%M:%S'),
                    "end": booking.end_time.strftime('%H:%M:%S')
                } for booking in court_bookings
            ]
            
            # Add to response
            available_slots.append({
                "court_id": court.id,
                "court_number": court.court_number,
                "court_type": court.court_type,
                "operating_hours": {
                    "open": opening_time.strftime('%H:%M:%S'),
                    "close": closing_time.strftime('%H:%M:%S')
                },
                "booked_ranges": booking_ranges,
                "booking_increment": increment_minutes,
                "min_duration": club.min_booking_duration,
                "max_duration": club.max_booking_duration
            })
        
        return Response(available_slots) 