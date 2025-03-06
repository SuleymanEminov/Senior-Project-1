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
    
    @action(detail=False, methods=['GET'])
    def available_slots(self, request):
        """Get available time slots for courts based on filters"""
        club_id = request.query_params.get('club_id')
        court_type = request.query_params.get('court_type')
        date_str = request.query_params.get('date')
        
        if not club_id:
            return Response({"error": "Club ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Query courts based on filters
        courts_query = Court.objects.filter(club_id=club_id)
        if court_type and court_type != 'all':
            courts_query = courts_query.filter(court_type=court_type)
            
        # Convert date string to date object
        try:
            if date_str:
                selected_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            else:
                selected_date = datetime.now().date()
        except ValueError:
            return Response({"error": "Invalid date format"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get all courts and their reservations
        courts = courts_query.all()
        
        # Get time slots with 1-hour increments (default operating hours: 8AM - 8PM)
        opening_hour = 8  # 8 AM
        closing_hour = 20  # 8 PM
        slot_duration = 1  # 1 hour
        
        # Prepare response data structure
        available_slots = []
        
        for court in courts:
            # Get existing reservations for this court on the selected date
            existing_reservations = Booking.objects.filter(
                court=court,
                date=selected_date
            )
            
            # Create a list of hourly slots
            court_slots = []
            for hour in range(opening_hour, closing_hour):
                start_time = time(hour, 0)
                end_time = time(hour + slot_duration, 0)
                
                # Check if this slot is already booked
                is_available = not existing_reservations.filter(
                    Q(start_time__lte=start_time, end_time__gt=start_time) |
                    Q(start_time__lt=end_time, end_time__gte=end_time) |
                    Q(start_time__gte=start_time, end_time__lte=end_time)
                ).exists()
                
                if is_available:
                    court_slots.append({
                        "start_time": start_time.strftime('%H:%M:%S'),
                        "end_time": end_time.strftime('%H:%M:%S'),
                        "formatted_time": f"{hour}:00 - {hour + slot_duration}:00"
                    })
            
            available_slots.append({
                "court_id": court.id,
                "court_number": court.court_number,
                "court_type": court.court_type,
                "available_slots": court_slots
            })
        
        return Response(available_slots)