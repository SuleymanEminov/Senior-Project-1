from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import UserViewSet, LogoutView, RegisterView
from .views.club_views import ClubViewSet, CourtViewSet
from .views.booking_views import BookingViewSet

# Initialize the router
router = DefaultRouter()
router.register(r'clubs', ClubViewSet, basename='club')  # Handles all club-related operations
router.register(r'courts', CourtViewSet, basename='court')  # Handles all court-related operations
router.register(r'bookings', BookingViewSet, basename='booking')  # Handles all booking-related operations
router.register(r'users', UserViewSet, basename='user')  # Handle user-related operations

# Define URL patterns
urlpatterns = [
    path('api/', include(router.urls)),  # Include all routes from the router
    path('api/token/', TokenObtainPairView.as_view(), name='token-obtain-pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('api/logout/', LogoutView.as_view(), name='auth-logout'),
    path('api/register/', RegisterView.as_view(), name='register'),
]