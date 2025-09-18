from django.db import models
from .employee import Employee
from .demissao_process import DemissaoProcess
from ..validators import validate_document_file

DOCUMENT_TYPE_CHOICES = [
    ('RESCISAO', 'Rescisão'),
    ('HOMOLOGACAO', 'Homologação'),
    ('CTPS', 'CTPS'),
    ('RG', 'RG'),
    ('CPF', 'CPF'),
    ('COMPROVANTE_ENDERECO', 'Comprovante de Endereço'),
    ('CARTA_AVISO', 'Carta de Aviso'),
    ('EXAME_DEMISSAO', 'Exame Demissional'),
    ('FICHA_REGISTRO', 'Ficha de Registro'),
    ('EXTRATO_FGTS', 'Extrato FGTS'),
    ('GUIA_GRRF', 'Guia GRRF'),
    ('GUIA_MULTA_FGTS', 'Guia Multa FGTS'),
    ('GUIA_INSS', 'Guia INSS'),
    ('COMPROVANTE_PAGAMENTO', 'Comprovante de Pagamento'),
    ('TERMO_QUITAÇÃO', 'Termo de Quitação'),
    ('TERMO_HOMOLOGACAO', 'Termo de Homologação'),
    ('OUTROS', 'Outros'),
    ('ATESTADO_SINDICATO', 'Atestado Sindicato'),
]

DOCUMENT_STATUS_CHOICES = [
    ('PENDENTE', 'Pendente'),
    ('APROVADO', 'Aprovado'),
    ('RECUSADO', 'Recusado'),
]

class Document(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, null=True, blank=True)
    demissao_process = models.ForeignKey(DemissaoProcess, on_delete=models.CASCADE, null=True, blank=True, related_name='documents')
    type = models.CharField(max_length=32, choices=DOCUMENT_TYPE_CHOICES)
    file = models.FileField(
        upload_to='documents/%Y/%m/',
        validators=[validate_document_file]
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=DOCUMENT_STATUS_CHOICES, default='PENDENTE')
    motivo_recusa = models.TextField(blank=True, null=True)
    rejeitado_em = models.DateTimeField(null=True, blank=True)
    aprovado_em = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.type} - {self.uploaded_at}"

    class Meta:
        # Garantir que não há documentos duplicados do mesmo tipo para o mesmo processo
        unique_together = ['demissao_process', 'type']
