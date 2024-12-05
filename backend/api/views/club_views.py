from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from ..models import Club
from ..serializers import ClubSerializer

class ClubViewSet(viewsets.ModelViewSet):
    queryset = Club.objects.filter(is_approved = True)
    serializer_class = ClubSerializer
    permission_classes = [IsAuthenticated]

    
    def perform_create(self, serializer):
        serializer.save(manager=self.request.user)
