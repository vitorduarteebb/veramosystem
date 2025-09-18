from django.db import models
from .employee import Employee
from .company import Company

class Payment(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    status = models.CharField(max_length=50)
