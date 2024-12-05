from rest_framework import viewsets
from ..models import UserProfile
from ..serializers import UserSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserSerializer