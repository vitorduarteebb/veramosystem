from django.db import models

class Union(models.Model):
    name = models.CharField(max_length=255)
    cnpj = models.CharField(max_length=20)

class CompanyUnion(models.Model):
    company = models.ForeignKey('core.Company', on_delete=models.CASCADE)
    union = models.ForeignKey(Union, on_delete=models.CASCADE)
