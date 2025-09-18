from django.db import models
from .company import Company
from .union import Union

class Employee(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True, help_text="Email do funcionário")
    phone = models.CharField(max_length=20, blank=True, null=True, help_text="Telefone do funcionário")
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    union = models.ForeignKey(Union, on_delete=models.CASCADE)
    status = models.CharField(max_length=50)
