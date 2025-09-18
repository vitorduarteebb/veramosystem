from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class SystemLog(models.Model):
    """Modelo para armazenar logs do sistema"""
    
    LEVEL_CHOICES = [
        ('DEBUG', 'Debug'),
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('SUCCESS', 'Success'),
    ]
    
    ACTION_CHOICES = [
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('LOGIN_FAILED', 'Login Failed'),
        ('USER_CREATED', 'User Created'),
        ('USER_UPDATED', 'User Updated'),
        ('USER_DELETED', 'User Deleted'),
        ('COMPANY_CREATED', 'Company Created'),
        ('COMPANY_UPDATED', 'Company Updated'),
        ('COMPANY_DELETED', 'Company Deleted'),
        ('UNION_CREATED', 'Union Created'),
        ('UNION_UPDATED', 'Union Updated'),
        ('UNION_DELETED', 'Union Deleted'),
        ('SCHEDULE_CREATED', 'Schedule Created'),
        ('SCHEDULE_UPDATED', 'Schedule Updated'),
        ('SCHEDULE_DELETED', 'Schedule Deleted'),
        ('DOCUMENT_UPLOADED', 'Document Uploaded'),
        ('DOCUMENT_APPROVED', 'Document Approved'),
        ('DOCUMENT_REJECTED', 'Document Rejected'),
        ('HOMOLOGATION_COMPLETED', 'Homologation Completed'),
        ('SYSTEM_ERROR', 'System Error'),
        ('API_CALL', 'API Call'),
        ('SECURITY_EVENT', 'Security Event'),
    ]
    
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES, default='INFO')
    message = models.TextField()
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='logs')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    company = models.ForeignKey('Company', on_delete=models.SET_NULL, null=True, blank=True, related_name='logs')
    union = models.ForeignKey('Union', on_delete=models.SET_NULL, null=True, blank=True, related_name='logs')
    schedule = models.ForeignKey('Schedule', on_delete=models.SET_NULL, null=True, blank=True, related_name='logs')
    metadata = models.JSONField(null=True, blank=True, help_text="Dados adicionais em formato JSON")
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['level']),
            models.Index(fields=['action']),
            models.Index(fields=['user']),
        ]
    
    def __str__(self):
        return f"{self.timestamp.strftime('%Y-%m-%d %H:%M:%S')} - {self.level} - {self.message[:50]}"
    
    @property
    def user_email(self):
        """Retorna o email do usuário ou 'Sistema' se não houver usuário"""
        return self.user.email if self.user else 'Sistema'
    
    @property
    def user_name(self):
        """Retorna o nome do usuário ou 'Sistema' se não houver usuário"""
        if self.user:
            return f"{self.user.first_name} {self.user.last_name}".strip() or self.user.username
        return 'Sistema'
