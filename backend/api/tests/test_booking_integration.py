from django.test import TestCase
from django.contrib.auth.models import User, Group
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import datetime, date, time, timedelta
import json
from api.models import Club, Court, Booking

class BookingIntegrationTests(TestCase):
    def setUp(self):
        # Create test users
        self.regular_user = User.objects.create_user(
            username='regular',
            email='regular@example.com',
            password='password123'
        )
        
        # Create manager user and group
        self.manager_group, created = Group.objects.get_or_create(name='Manager')
        self.manager_user = User.objects.create_user(
            username='manager',
            email='manager@example.com',
            password='password123'
        )
        self.manager_user.groups.add(self.manager_group)
        
        # Create test data - Club, Courts
        self.club = Club.objects.create(
            name="Test Tennis Club",
            address="123 Court St",
            city="Tennis City",
            state="TS",
            zip_code="12345",
            email="test@tennisclub.com",
            # Add opening and closing times
            opening_time=time(8, 0),  # 8 AM
            closing_time=time(20, 0)  # 8 PM
        )
        
        # Create different court types
        self.indoor_court = Court.objects.create(
            club=self.club,
            court_type="hard",
            court_number=1,
            is_active=True
        )
        
        self.outdoor_court = Court.objects.create(
            club=self.club,
            court_type="clay",
            court_number=2,
            is_active=True
        )
        
        # Inactive court
        self.inactive_court = Court.objects.create(
            club=self.club,
            court_type="grass",
            court_number=3,
            is_active=False
        )
        
        # Set up API clients
        self.anonymous_client = APIClient()
        
        # Get JWT tokens directly using the RefreshToken utility
        self.user_client = APIClient()
        user_refresh = RefreshToken.for_user(self.regular_user)
        user_access_token = str(user_refresh.access_token)
        self.user_client.credentials(HTTP_AUTHORIZATION=f"Bearer {user_access_token}")
        
        self.manager_client = APIClient()
        manager_refresh = RefreshToken.for_user(self.manager_user)
        manager_access_token = str(manager_refresh.access_token)
        self.manager_client.credentials(HTTP_AUTHORIZATION=f"Bearer {manager_access_token}")
        
        # Create some initial bookings
        # Tomorrow at 10:00 - 11:00
        tomorrow = timezone.now() + timedelta(days=1)
        tomorrow_date = tomorrow.date()
        booking_start = time(10, 0)
        booking_end = time(11, 0)
        
        self.existing_booking = Booking.objects.create(
            court=self.indoor_court,
            user=self.regular_user,
            booking_date=tomorrow_date,
            start_time=booking_start,
            end_time=booking_end,
            status="pending"  # Default is 'pending'
        )

    def test_booking_flow(self):
        """Test the complete booking flow"""
        # 1. Check for available times
        tomorrow = timezone.now() + timedelta(days=1)
        tomorrow_date = tomorrow.date()
        tomorrow_str = tomorrow_date.isoformat()
        
        # Check court availability - this endpoint returns existing bookings, not slots
        response = self.user_client.get(f'/api/courts/{self.outdoor_court.id}/availability/', 
                                      {'date': tomorrow_str})
        
        self.assertEqual(response.status_code, 200)
        
        # The API returns existing bookings, not available slots
        # Find an available time (e.g., 12:00-13:00 if no booking exists at that time)
        existing_bookings = response.json()
        
        # Check if 12:00-13:00 is available
        noon_start = time(12, 0)
        noon_end = time(13, 0)
        time_is_available = True
        
        for booking in existing_bookings:
            booking_date = booking.get('booking_date')
            if booking_date == tomorrow_str:
                booking_start = datetime.strptime(booking.get('start_time'), '%H:%M:%S').time()
                booking_end = datetime.strptime(booking.get('end_time'), '%H:%M:%S').time()
                
                # Check if the booking overlaps with our desired time
                if not (booking_end <= noon_start or booking_start >= noon_end):
                    time_is_available = False
                    break
        
        self.assertTrue(time_is_available, "12:00-13:00 should be available for booking")
        
        # 2. Create a booking at 12:00-13:00
        booking_data = {
            'court': self.outdoor_court.id,
            'booking_date': tomorrow_date.isoformat(),
            'start_time': noon_start.isoformat(),
            'end_time': noon_end.isoformat()
        }
        
        response = self.user_client.post('/api/bookings/', booking_data, format='json')
        self.assertEqual(response.status_code, 201)
        
        booking_id = response.json()['id']
        
        # 3. Verify booking was created
        response = self.user_client.get(f'/api/bookings/{booking_id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'pending')  # Default is 'pending'
        
        # 4. Try to double book the same time (should fail)
        response = self.user_client.post('/api/bookings/', booking_data, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('already booked', str(response.content))
        
        # 5. Update the booking time (move it 2 hours later)
        new_start_time = time(14, 0)  # 2:00 PM
        new_end_time = time(15, 0)    # 3:00 PM
        
        update_data = {
            'court': self.outdoor_court.id,
            'booking_date': tomorrow_date.isoformat(),
            'start_time': new_start_time.isoformat(),
            'end_time': new_end_time.isoformat()
        }
        
        response = self.user_client.put(f'/api/bookings/{booking_id}/', update_data, format='json')
        self.assertEqual(response.status_code, 200)
        
        # 6. Cancel the booking
        response = self.user_client.delete(f'/api/bookings/{booking_id}/')
        self.assertEqual(response.status_code, 204)
        
        # 7. Verify it's gone or marked as cancelled
        response = self.user_client.get(f'/api/bookings/{booking_id}/')
        if response.status_code == 200:
            self.assertEqual(response.json()['status'], 'canceled')
        else:
            self.assertEqual(response.status_code, 404)

    def test_court_availability_logic(self):
        """Test the logic for court availability calculations"""
        tomorrow = timezone.now() + timedelta(days=1)
        tomorrow_date = tomorrow.date()
        booking_start = time(12, 0)  # noon
        booking_end = time(13, 0)    # 1 PM
        
        # Create a booking for tomorrow at noon
        Booking.objects.create(
            court=self.outdoor_court,
            user=self.regular_user,
            booking_date=tomorrow_date,
            start_time=booking_start,
            end_time=booking_end,
            status="pending"
        )
        
        # Check availability for the court
        tomorrow_str = tomorrow_date.isoformat()
        response = self.user_client.get(f'/api/courts/{self.outdoor_court.id}/availability/', 
                                      {'date': tomorrow_str})
        
        self.assertEqual(response.status_code, 200)
        
        # API returns existing bookings, not availability slots
        # Confirm the noon booking is in the response
        bookings = response.json()
        found_noon_booking = False
        
        for booking in bookings:
            booking_date = booking.get('booking_date')
            if booking_date == tomorrow_str:
                booking_start_str = booking.get('start_time')
                booking_start_time = datetime.strptime(booking_start_str, '%H:%M:%S').time()
                
                if booking_start_time.hour == 12:
                    found_noon_booking = True
                    break
                    
        self.assertTrue(found_noon_booking, "Noon booking should be in the availability response")
        
        # Also check that we can create a booking for a different time slot
        available_time_slot_start = time(14, 0)  # 2:00 PM
        available_time_slot_end = time(15, 0)    # 3:00 PM
        
        booking_data = {
            'court': self.outdoor_court.id,
            'booking_date': tomorrow_date.isoformat(),
            'start_time': available_time_slot_start.isoformat(),
            'end_time': available_time_slot_end.isoformat()
        }
        
        response = self.user_client.post('/api/bookings/', booking_data, format='json')
        self.assertEqual(response.status_code, 201, "Should be able to book 2:00-3:00 PM")

    def test_booking_permissions(self):
        """Test permissions for booking operations"""
        tomorrow = timezone.now() + timedelta(days=1)
        tomorrow_date = tomorrow.date()
        
        booking_data = {
            'court': self.outdoor_court.id,
            'booking_date': tomorrow_date.isoformat(),
            'start_time': '14:00:00',  # 2:00 PM
            'end_time': '15:00:00'     # 3:00 PM
        }
        
        # Anonymous user should not be able to book
        response = self.anonymous_client.post('/api/bookings/', booking_data, format='json')
        self.assertEqual(response.status_code, 401)
        
        # Regular user should be able to book
        response = self.user_client.post('/api/bookings/', booking_data, format='json')
        self.assertEqual(response.status_code, 201)
        user_booking_id = response.json()['id']
        
        # User should not be able to modify another user's booking
        # First, create a booking for the manager
        manager_booking_data = {
            'court': self.indoor_court.id,
            'booking_date': tomorrow_date.isoformat(),
            'start_time': '16:00:00',  # 4:00 PM
            'end_time': '17:00:00'     # 5:00 PM
        }
        
        response = self.manager_client.post('/api/bookings/', manager_booking_data, format='json')
        self.assertEqual(response.status_code, 201)
        manager_booking_id = response.json()['id']
        
        # Try to update manager's booking as regular user
        update_data = {
            'court': self.indoor_court.id,
            'booking_date': tomorrow_date.isoformat(),
            'start_time': '17:00:00',  # 5:00 PM
            'end_time': '18:00:00'     # 6:00 PM
        }
        
        response = self.user_client.put(f'/api/bookings/{manager_booking_id}/', update_data, format='json')
        # Your API may return 403 (forbidden) or 404 (not found) for this case
        self.assertIn(response.status_code, [403, 404])
        
        # Manager should be able to modify any booking including user's
        update_data = {
            'court': self.outdoor_court.id,
            'booking_date': tomorrow_date.isoformat(),
            'start_time': '18:00:00',  # 6:00 PM
            'end_time': '19:00:00'     # 7:00 PM
        }
        
        response = self.manager_client.put(f'/api/bookings/{user_booking_id}/', update_data, format='json')
        self.assertEqual(response.status_code, 200)
        
        # Check that the user's booking was updated
        response = self.user_client.get(f'/api/bookings/{user_booking_id}/')
        booking_data = response.json()
        self.assertIn('18:00', booking_data['start_time'])  # Simplified time check 