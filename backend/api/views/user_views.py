from rest_framework import viewsets, status, filters
from django.contrib.auth.models import User, Group
from ..serializers import UserSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend

class IsManagerOrAdmin:
    """
    Custom permission to allow managers to view users.
    """
    def has_permission(self, request, view):
        if request.method == 'GET':  # Only allow GET requests
            return request.user.groups.filter(name__in=["Manager", "Admin"]).exists() or request.user.is_superuser
        return False

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    def get_queryset(self):
        """
        Only managers, admins and superusers can see all users.
        Regular users can only see themselves.
        """
        user = self.request.user
        if user.is_superuser or user.groups.filter(name__in=["Manager", "Admin"]).exists():
            return User.objects.all().order_by('username')
        return User.objects.filter(id=user.id)
    
    def get_permissions(self):
        """
        Override permissions based on action.
        """
        if self.action in ['list', 'retrieve']:
            return [IsManagerOrAdmin()]
        return super().get_permissions()
    
    @action(detail=False, methods=["GET"], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Alias for current_user - modern API convention"""
        serializer = self.get_serializer(request.user)
        data = serializer.data
        
        # Add groups to the response
        data['groups'] = list(request.user.groups.values_list('name', flat=True))
        
        return Response(data)
    
    def create(self, request, *args, **kwargs):
        """Disable user creation through API - use register endpoint instead"""
        return Response(
            {"detail": "User creation is not allowed via this endpoint. Use /api/register/ instead."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    def update(self, request, *args, **kwargs):
        """Only allow users to update their own profiles, unless admin/manager"""
        user = self.get_object()
        current_user = request.user
        
        # Regular users can only update their own profiles
        if user.id != current_user.id and not (
            current_user.is_superuser or 
            current_user.groups.filter(name__in=["Admin"]).exists()
        ):
            return Response(
                {"detail": "You do not have permission to update this user."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Only allow admins to delete users"""
        if not (request.user.is_superuser or request.user.groups.filter(name="Admin").exists()):
            return Response(
                {"detail": "You do not have permission to delete users."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=["GET", "PUT"], permission_classes=[IsAuthenticated])
    def profile(self, request):
        """Get or update current user profile"""
        user = request.user
        
        if request.method == "GET":
            serializer = self.get_serializer(user)
            data = serializer.data
            
            # Add groups to the response
            data['groups'] = list(user.groups.values_list('name', flat=True))
            
            # Add bookings count
            data['bookings_count'] = user.bookings.count() if hasattr(user, 'bookings') else 0
            
            return Response(data)
        
        elif request.method == "PUT":
            serializer = self.get_serializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                # Don't allow username changes
                if 'username' in serializer.validated_data:
                    del serializer.validated_data['username']
                
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)