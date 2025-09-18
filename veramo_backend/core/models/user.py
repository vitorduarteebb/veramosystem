from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('superadmin', 'Superadmin'),
        ('union_master', 'Union Master'),
        ('union_common', 'Union Common'),
        ('company_master', 'Company Master'),
        ('company_common', 'Company Common'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    union = models.ForeignKey('Union', null=True, blank=True, on_delete=models.SET_NULL)
    company = models.ForeignKey('Company', null=True, blank=True, on_delete=models.SET_NULL)
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
