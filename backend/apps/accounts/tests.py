from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from .models import User
from .serializers import UserRegisterSerializer


class RegistrationSerializerTests(TestCase):
    def test_public_registration_always_creates_citizen(self):
        serializer = UserRegisterSerializer(data={
            'username': 'public_user',
            'email': 'public@example.test',
            'full_name': 'Public User',
            'role': User.Role.ADMIN,
            'password': 'Strong-Civic-Password-2026!',
            'password_confirm': 'Strong-Civic-Password-2026!',
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()

        self.assertEqual(user.role, User.Role.CITIZEN)
        self.assertFalse(user.is_staff)
        self.assertTrue(user.check_password('Strong-Civic-Password-2026!'))

    def test_superuser_creation_grants_admin_role(self):
        admin = User.objects.create_superuser(
            username='platform_admin',
            email='admin@example.test',
            password='Strong-Admin-Password-2026!',
        )

        self.assertEqual(admin.role, User.Role.ADMIN)


class HealthCheckTests(TestCase):
    def test_health_check_reports_database_availability(self):
        response = APIClient().get(reverse('health_check'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'status': 'ok'})
