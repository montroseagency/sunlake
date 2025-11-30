from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    """Extended user model with roles"""

    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrator'
        STAFF = 'STAFF', 'Staff'
        GUEST = 'GUEST', 'Guest'
        CUSTOMER = 'CUSTOMER', 'Customer'

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.CUSTOMER
    )
    phone = models.CharField(max_length=20, blank=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
