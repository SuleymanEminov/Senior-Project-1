from rest_framework import viewsets, status
from ..models import UserProfile
from ..serializers import UserSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class UserViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["GET"], permission_classes=[IsAuthenticated])
    def current_user(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        return Response(
            {"detail": "user creation is not allowed via API."},
                status=status.HTTP_403_FORBIDDEN
        )