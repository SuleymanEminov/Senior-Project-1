from rest_framework import viewsets, status, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from datetime import datetime, timedelta
from django_filters.rest_framework import DjangoFilterBackend
from ..models import Club, Court, Booking
from ..serializers import ClubSerializer, CourtSerializer, BookingSerializer

class IsManagerOrAdmin:
    """
    Custom permission to only allow managers or admins to access club management.
    """
    def has_permission(self, request, view):
        user = request.user
        return user.groups.filter(name__in=["Manager", "Admin"]).exists() or user.is_superuser

class IsClubManager:
    """
    Custom permission to only allow managers of a specific club to modify its data.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_superuser or user.groups.filter(name="Admin").exists():
            return True
        # Check if user is the manager of this club
        return obj.manager == user

class ClubViewSet(viewsets.ModelViewSet):
    serializer_class = ClubSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'city', 'state']
    filterset_fields = ['is_approved']
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.groups.filter(name="Admin").exists():
            # Admins and superusers can see all clubs including unapproved ones
            return Club.objects.all()
        # Managers can see their own clubs regardless of approval status
        if user.groups.filter(name="Manager").exists():
            return Club.objects.filter(Q(is_approved=True) | Q(manager=user))
        # Regular users can only see approved clubs
        return Club.objects.filter(is_approved=True)
    
    def perform_create(self, serializer):
        # Save the club with the current user as manager
        club = serializer.save(manager=self.request.user)
        
        # Extract courts data and create individual Court objects
        courts_data = self.request.data.get('courts', [])
        for court_type_data in courts_data:
            court_type = court_type_data.get('type')
            count = int(court_type_data.get('count', 0))
            
            # Create individual court objects
            for i in range(1, count + 1):
                Court.objects.create(
                    club=club,
                    court_type=court_type,
                    court_number=i
                )
                
        # Save court summary to the club for quick reference
        club.courts_summary = courts_data
        club.save()
        
    @action(detail=True, methods=['get'])
    def bookings(self, request, pk=None):
        """
        Get all bookings for a specific club.
        """
        club = self.get_object()
        start_date = request.query_params.get('start_date', datetime.now().date())
        end_date = request.query_params.get('end_date', datetime.now().date() + timedelta(days=7))
        
        bookings = Booking.objects.filter(
            court__club=club,
            booking_date__gte=start_date,
            booking_date__lte=end_date
        ).select_related('court', 'user')
        
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)

class CourtViewSet(viewsets.ModelViewSet):
    serializer_class = CourtSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Filter by club if provided
        club_id = self.request.query_params.get('club')
        queryset = Court.objects.all()
        
        if club_id:
            queryset = queryset.filter(club_id=club_id)
        
        # Further filter based on user permissions
        if user.is_superuser or user.groups.filter(name="Admin").exists():
            return queryset
        elif user.groups.filter(name="Manager").exists():
            # Managers can see courts from their clubs
            return queryset.filter(Q(club__is_approved=True) | Q(club__manager=user))
        # Regular users can only see courts from approved clubs
        return queryset.filter(club__is_approved=True)
    
    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        """
        Get availability for a specific court.
        """
        court = self.get_object()
        start_date = request.query_params.get('start_date', datetime.now().date())
        end_date = request.query_params.get('end_date', datetime.now().date() + timedelta(days=7))
        
        bookings = Booking.objects.filter(
            court=court,
            booking_date__gte=start_date,
            booking_date__lte=end_date,
            status__in=['pending', 'confirmed']
        )
        
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)

