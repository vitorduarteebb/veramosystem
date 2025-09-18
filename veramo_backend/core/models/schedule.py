from django.db import models
from .employee import Employee
from .company import Company
from .union import Union
from .user import User
from datetime import datetime

class Schedule(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    union = models.ForeignKey(Union, on_delete=models.CASCADE)
    union_user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, help_text="Usuário do sindicato responsável pelo agendamento")
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=30, choices=[
        ('aguardando_aprovacao', 'Aguardando aprovação'),
        ('documentos_aprovados', 'Documentos aprovados'),
        ('documentos_recusados', 'Documentos recusados'),
        ('agendado', 'Agendado'),
        ('concluido', 'Concluído'),
        ('cancelado', 'Cancelado'),
    ], default='aguardando_aprovacao')
    motivo_recusa_documentos = models.TextField(blank=True, null=True)
    # ETAPA 3
    ressalvas = models.TextField(blank=True, null=True)
    # ETAPA 4
    aceite = models.BooleanField(default=False)
    cpf_assinatura = models.CharField(max_length=14, blank=True, null=True)
    ip_assinatura = models.GenericIPAddressField(blank=True, null=True)
    data_aceite = models.DateTimeField(blank=True, null=True)
    video_link = models.URLField(blank=True, null=True, help_text="Link da videoconferência (Google Meet)")
    
    # Campos para integração com Google Meet
    google_calendar_event_id = models.CharField(max_length=255, blank=True, null=True, help_text="ID do evento no Google Calendar")
    google_meet_conference_id = models.CharField(max_length=255, blank=True, null=True, help_text="ID da conferência no Google Meet")
    google_meet_link = models.URLField(blank=True, null=True, help_text="Link direto para o Google Meet")
    google_calendar_link = models.URLField(blank=True, null=True, help_text="Link para o evento no Google Calendar")
    meeting_created_at = models.DateTimeField(blank=True, null=True, help_text="Data/hora de criação da reunião no Google Meet")
    
    class Meta:
        db_table = 'core_schedule'
        verbose_name = 'Agendamento'
        verbose_name_plural = 'Agendamentos'
    
    def __str__(self):
        return f"Agendamento {self.employee} - {self.date} {self.start_time}"
    
    @property
    def has_google_meeting(self):
        """Verifica se já foi criada uma reunião no Google Meet"""
        return bool(self.google_meet_link and self.google_calendar_event_id)
    
    @property
    def meeting_duration_minutes(self):
        """Calcula a duração da reunião em minutos"""
        if self.start_time and self.end_time:
            start = datetime.combine(self.date, self.start_time)
            end = datetime.combine(self.date, self.end_time)
            duration = end - start
            return int(duration.total_seconds() / 60)
        return 0
