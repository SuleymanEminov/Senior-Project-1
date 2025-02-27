from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..models import Club, Court
from ..serializers import ClubSerializer

class ClubViewSet(viewsets.ModelViewSet):
    serializer_class = ClubSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.groups.filter(name="Admin").exists():
            # Admins and superusers can see all clubs including unapproved ones
            return Club.objects.all()
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