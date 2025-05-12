from django.test import TestCase, Client
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

# Create your tests here.
class UserRegistrationTest(TestCase):
    def setUp(self):
        self.client = Client()

    def test_valid_user_registration(self):
        response = self.client.post('/api/register/', {
            'username': 'testuser',
            'email': 'testuser@example.com',
            'password': 'securepassword123',
            'password2': 'securepassword123',
            

        })
        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(username='testuser').exists())

    def test_registration_with_missing_fields(self):
        response = self.client.post('/api/register/', {
            'username': 'testuser'
        })
        self.assertEqual(response.status_code, 400)


class TokenObtainTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='securepassword123'
        )

    def test_valid_token_obtain(self):
        response = self.client.post('/api/token/', {
            'username': 'testuser',
            'password': 'securepassword123'
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.json())
        self.assertIn('refresh', response.json())

    def test_invalid_token_obtain(self):
        response = self.client.post('/api/token/', {
            'username': 'testuser',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, 401)


class TokenRefreshTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='securepassword123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.refresh_token = str(refresh)

    def test_valid_token_refresh(self):
        response = self.client.post('/api/token/refresh/', {
            'refresh': self.refresh_token
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.json())

    def test_invalid_token_refresh(self):
        response = self.client.post('/api/token/refresh/', {
            'refresh': 'invalid_refresh_token'
        })
        self.assertEqual(response.status_code, 401)


class LogoutTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='securepassword123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)

    def test_logout(self):
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {self.access_token}'
        response = self.client.post('/api/logout/')
        self.assertEqual(response.status_code, 200)