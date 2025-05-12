from django.test import TestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from api.models import Club, Court, Booking
from datetime import date, time, timedelta
from django.utils import timezone

class ClubModelTest(TestCase):
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='securepassword123'
        )

        # Create a club
        self.club = Club.objects.create(
            name='Test Tennis Club',
            address='123 Test St',
            city='Testville',
            state='TS',
            zip_code='12345',
            email='test@tennisclub.com'
        )

    def test_club_creation(self):
        """Test club creation and field values"""
        self.assertEqual(self.club.name, 'Test Tennis Club')
        self.assertEqual(self.club.address, '123 Test St')
        self.assertEqual(self.club.city, 'Testville')
        self.assertEqual(self.club.state, 'TS')
        self.assertEqual(self.club.zip_code, '12345')
        self.assertEqual(self.club.email, 'test@tennisclub.com')

    def test_club_str_representation(self):
        """Test the string representation of the club"""
        self.assertEqual(str(self.club), 'Test Tennis Club')


class CourtModelTest(TestCase):
    def setUp(self):
        # Create test club
        self.club = Club.objects.create(
            name='Test Tennis Club',
            address='123 Test St',
            city='Testville',
            state='TS',
            zip_code='12345',
            email='test@tennisclub.com'
        )

        # Create a court
        self.court = Court.objects.create(
            club=self.club,
            court_type='hard',
            court_number=1,
            is_active=True
        )

    def test_court_creation(self):
        """Test court creation and field values"""
        self.assertEqual(self.court.club, self.club)
        self.assertEqual(self.court.court_type, 'hard')
        self.assertEqual(self.court.court_number, 1)
        self.assertTrue(self.court.is_active)

    def test_court_str_representation(self):
        """Test the string representation of the court"""
        expected_str = f"{self.club.name} - Hard Court #{self.court.court_number}"
        self.assertEqual(str(self.court), expected_str)

    def test_inactive_court(self):
        """Test creating an inactive court"""
        inactive_court = Court.objects.create(
            club=self.club,
            court_type='clay',
            court_number=2,
            is_active=False
        )
        self.assertFalse(inactive_court.is_active)


class BookingModelTest(TestCase):
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='securepassword123'
        )

        # Create a club
        self.club = Club.objects.create(
            name='Test Tennis Club',
            address='123 Test St',
            city='Testville',
            state='TS',
            zip_code='12345',
            email='test@tennisclub.com'
        )

        # Create a court
        self.court = Court.objects.create(
            club=self.club,
            court_type='hard',
            court_number=1,
            is_active=True
        )

    def test_booking_creation(self):
        """Test booking creation and field values"""
        # Create booking for tomorrow
        tomorrow = timezone.now() + timedelta(days=1)
        tomorrow_date = tomorrow.date()
        booking_start = time(10, 0)
        booking_end = time(11, 0)
        
        booking = Booking.objects.create(
            court=self.court,
            user=self.user,
            booking_date=tomorrow_date,
            start_time=booking_start,
            end_time=booking_end,
            status='confirmed'
        )

        self.assertEqual(booking.court, self.court)
        self.assertEqual(booking.user, self.user)
        self.assertEqual(booking.status, 'confirmed')
        self.assertEqual(booking.booking_date, tomorrow_date)
        self.assertEqual(booking.start_time, booking_start)
        self.assertEqual(booking.end_time, booking_end)

    def test_booking_overlap_validation(self):
        """Test validation that prevents overlapping bookings"""
        # Create initial booking
        tomorrow = timezone.now() + timedelta(days=1)
        tomorrow_date = tomorrow.date()
        
        Booking.objects.create(
            court=self.court,
            user=self.user,
            booking_date=tomorrow_date,
            start_time=time(10, 0),
            end_time=time(11, 0),
            status='confirmed'
        )

        # Try to create overlapping booking
        overlapping_booking = Booking(
            court=self.court,
            user=self.user,
            booking_date=tomorrow_date,
            start_time=time(10, 30),  # 10:30 AM (overlaps with existing booking)
            end_time=time(11, 30),  # 11:30 AM
            status='confirmed'
        )

        # This should raise a validation error when saved
        with self.assertRaises(ValidationError):
            overlapping_booking.full_clean()
            overlapping_booking.save()

    def test_booking_cancellation(self):
        """Test booking cancellation process"""
        # Create a booking
        tomorrow = timezone.now() + timedelta(days=1)
        tomorrow_date = tomorrow.date()
        
        booking = Booking.objects.create(
            court=self.court,
            user=self.user,
            booking_date=tomorrow_date,
            start_time=time(10, 0),
            end_time=time(11, 0),
            status='confirmed'
        )

        # Cancel the booking
        booking.status = 'canceled'
        booking.save()

        # Check if the booking is actually cancelled
        updated_booking = Booking.objects.get(id=booking.id)
        self.assertEqual(updated_booking.status, 'canceled')

    def test_multiple_bookings_same_time_different_courts(self):
        """Test creating multiple bookings at the same time on different courts"""
        # Create a second court
        second_court = Court.objects.create(
            club=self.club,
            court_type='clay',
            court_number=2,
            is_active=True
        )

        # Create booking time
        tomorrow = timezone.now() + timedelta(days=1)
        tomorrow_date = tomorrow.date()
        booking_start = time(10, 0)
        booking_end = time(11, 0)
        
        # Create booking for first court
        booking1 = Booking.objects.create(
            court=self.court,
            user=self.user,
            booking_date=tomorrow_date,
            start_time=booking_start,
            end_time=booking_end,
            status='confirmed'
        )

        # Create booking for second court at same time
        booking2 = Booking.objects.create(
            court=second_court,
            user=self.user,
            booking_date=tomorrow_date,
            start_time=booking_start,
            end_time=booking_end,
            status='confirmed'
        )

        # Both bookings should exist
        self.assertEqual(Booking.objects.count(), 2)
        self.assertEqual(booking1.start_time, booking2.start_time)
        self.assertEqual(booking1.end_time, booking2.end_time)
        self.assertNotEqual(booking1.court, booking2.court) 