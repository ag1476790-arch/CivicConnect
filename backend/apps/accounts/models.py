from django.contrib.auth.models import AbstractUser, UserManager as DjangoUserManager
from django.db import models


class UserManager(DjangoUserManager):
    use_in_migrations = True

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('role', self.model.Role.ADMIN)
        return super().create_superuser(username, email, password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        CITIZEN = 'CITIZEN', 'Citizen'
        ADMIN = 'ADMIN', 'Admin'
        WORKER = 'WORKER', 'Field worker'

    full_name = models.CharField(max_length=150, blank=True, default='')
    phone_number = models.CharField(max_length=20, blank=True, default='')
    department = models.CharField(max_length=100, blank=True, default='')
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CITIZEN)
    objects = UserManager()

    def __str__(self):
        return self.full_name or self.get_full_name() or self.username
