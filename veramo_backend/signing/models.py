from django.db import models
from django.utils import timezone
import uuid

class SigningSession(models.Model):
    """Sessão de assinatura eletrônica"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_by = models.ForeignKey('core.User', on_delete=models.PROTECT, related_name='created_sign_sessions')
    pdf_original = models.FileField(upload_to='signing/original/')
    pdf_final = models.FileField(upload_to='signing/signed/', null=True, blank=True)
    hash_original = models.CharField(max_length=128, blank=True)
    hash_final = models.CharField(max_length=128, blank=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Relacionamento com Schedule
    schedule = models.ForeignKey('core.Schedule', on_delete=models.CASCADE, null=True, blank=True, related_name='signing_sessions')
    
    class Meta:
        verbose_name = 'Sessão de Assinatura'
        verbose_name_plural = 'Sessões de Assinatura'
        ordering = ['-created_at']

class Party(models.Model):
    """Parte envolvida na assinatura"""
    ROLE_CHOICES = (
        ('COMPANY', 'Empresa'),
        ('UNION', 'Sindicato'),
        ('EMPLOYEE', 'Funcionário')
    )
    
    session = models.ForeignKey(SigningSession, on_delete=models.CASCADE, related_name='parties')
    role = models.CharField(max_length=16, choices=ROLE_CHOICES)
    name = models.CharField(max_length=120)
    cpf = models.CharField(max_length=14)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    signed_at = models.DateTimeField(null=True, blank=True)
    signed_ip = models.GenericIPAddressField(null=True, blank=True)
    signed_user_agent = models.TextField(blank=True)
    magic_link_token = models.CharField(max_length=512, blank=True)  # somente EMPLOYEE
    magic_link_expires_at = models.DateTimeField(null=True, blank=True)
    otp_hash = models.CharField(max_length=128, blank=True)  # armazene hash do OTP
    otp_expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Parte da Assinatura'
        verbose_name_plural = 'Partes da Assinatura'
        unique_together = ['session', 'role']

class EvidenceEvent(models.Model):
    """Evento de auditoria da assinatura"""
    EVENT_TYPES = (
        ('SESSION_CREATED', 'Sessão Criada'),
        ('PDF_UPLOADED', 'PDF Enviado'),
        ('PARTIES_DEFINED', 'Partes Definidas'),
        ('EMPLOYEE_LINK_GENERATED', 'Link do Funcionário Gerado'),
        ('OTP_SENT', 'OTP Enviado'),
        ('OTP_VERIFIED', 'OTP Verificado'),
        ('CONSENT_GIVEN', 'Consentimento Dado'),
        ('SIGNED', 'Assinado'),
        ('FINAL_SEAL', 'Selo Final Criado'),
        ('FINALIZED', 'Finalizado')
    )
    
    session = models.ForeignKey(SigningSession, on_delete=models.CASCADE, related_name='events')
    party = models.ForeignKey(Party, on_delete=models.SET_NULL, null=True, blank=True)
    type = models.CharField(max_length=64, choices=EVENT_TYPES)
    timestamp_utc = models.DateTimeField(default=timezone.now)
    timestamp_local = models.DateTimeField(default=timezone.now)
    ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    payload = models.JSONField(default=dict, blank=True)
    
    class Meta:
        verbose_name = 'Evento de Evidência'
        verbose_name_plural = 'Eventos de Evidência'
        ordering = ['timestamp_utc']
