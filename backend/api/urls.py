from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import ClubViewSet, UserViewSet, LogoutView, RegisterView

# Initialize the router
router = DefaultRouter()
router.register(r'clubs', ClubViewSet, basename='club')  # Handles all club-related operations
router.register(r'users', UserViewSet, basename='user')  # Example: Handle user-related operations

# Define URL patterns
urlpatterns = [
    path('api/', include(router.urls)),  # Include all routes from the router
    path('api/token/', TokenObtainPairView.as_view(), name='token-obtain-pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('api/logout/', LogoutView.as_view(), name='auth-logout'),
    path('api/register/', RegisterView.as_view(), name='register'),
]