from django.db import models
from .user import User
from .union import Union

class AgendaBlock(models.Model):
    union = models.ForeignKey(Union, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    start = models.DateTimeField()
    end = models.DateTimeField()
    reason = models.CharField(max_length=255, blank=True)
    is_holiday = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.union} - {self.user or 'Todos'}: {self.start} a {self.end} ({self.reason})" 