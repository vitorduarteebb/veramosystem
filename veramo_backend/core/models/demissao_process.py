from django.db import models
from .company import Company
from .union import Union
from ..validators import validate_pdf_file

class DemissaoProcess(models.Model):
    nome_funcionario = models.CharField(max_length=255)
    email_funcionario = models.EmailField(blank=True, null=True, help_text="Email do funcionário")
    telefone_funcionario = models.CharField(max_length=20, blank=True, null=True, help_text="Telefone do funcionário")
    motivo = models.CharField(max_length=255)
    exame = models.CharField(max_length=50)
    empresa = models.ForeignKey(Company, on_delete=models.CASCADE)
    sindicato = models.ForeignKey(Union, on_delete=models.CASCADE)
    status = models.CharField(max_length=50, default='aguardando_aprovacao')
    data_inicio = models.DateTimeField(auto_now_add=True)
    data_termino = models.DateTimeField(null=True, blank=True)
    ressalvas = models.TextField(blank=True, null=True)
    motivo_recusa_documentos = models.TextField(blank=True, null=True)
    # Campos para rejeição do processo
    motivo_rejeicao = models.TextField(blank=True, null=True)
    data_rejeicao = models.DateTimeField(null=True, blank=True)
    # Campo para link da videoconferência
    video_link = models.URLField(blank=True, null=True, help_text="Link da videoconferência (Google Meet)")
    # Campos para controle de assinaturas
    documento_assinado_empresa = models.FileField(
        upload_to='assinaturas/empresa/%Y/%m/',
        validators=[validate_pdf_file],
        blank=True, 
        null=True, 
        help_text="Documento assinado pela empresa"
    )
    documento_assinado_sindicato = models.FileField(
        upload_to='assinaturas/sindicato/%Y/%m/',
        validators=[validate_pdf_file],
        blank=True, 
        null=True, 
        help_text="Documento assinado pelo sindicato"
    )
    # Documento assinado pelo trabalhador (upload público)
    documento_assinado_trabalhador = models.FileField(
        upload_to='assinaturas/trabalhador/%Y/%m/',
        validators=[validate_pdf_file],
        blank=True,
        null=True,
        help_text="Documento assinado pelo trabalhador"
    )
    assinado_empresa = models.BooleanField(default=False, help_text="Empresa confirmou assinatura")
    assinado_sindicato = models.BooleanField(default=False, help_text="Sindicato confirmou assinatura")
    assinado_trabalhador = models.BooleanField(default=False, help_text="Trabalhador confirmou assinatura")
    data_assinatura_empresa = models.DateTimeField(blank=True, null=True, help_text="Data da assinatura pela empresa")
    data_assinatura_sindicato = models.DateTimeField(blank=True, null=True, help_text="Data da assinatura pelo sindicato")
    data_assinatura_trabalhador = models.DateTimeField(blank=True, null=True, help_text="Data da assinatura pelo trabalhador")

    # Token público para upload do trabalhador
    employee_upload_token = models.CharField(max_length=64, blank=True, null=True, help_text="Token público para upload do trabalhador")
    employee_upload_expires = models.DateTimeField(blank=True, null=True, help_text="Validade do token de upload do trabalhador")

    def __str__(self):
        return f"{self.nome_funcionario} - {self.empresa} ({self.status})" 