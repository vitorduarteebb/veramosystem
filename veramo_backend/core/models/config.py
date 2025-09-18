from django.db import models
from .user import User

class ScheduleConfig(models.Model):
    union_user = models.ForeignKey(User, on_delete=models.CASCADE)
    weekday = models.IntegerField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    duration_minutes = models.IntegerField()
    break_minutes = models.IntegerField()
