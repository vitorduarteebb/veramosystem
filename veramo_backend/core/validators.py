"""
Validadores para o sistema Veramo
Validação de arquivos, senhas e dados
"""
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
import os

# Configurações de arquivo
ALLOWED_EXTS = {"pdf", "png", "jpg", "jpeg"}
MAX_MB = 20

def validate_file_extension(value):
    """Valida extensão do arquivo"""
    FileExtensionValidator(ALLOWED_EXTS)(value)

def validate_file_size(value):
    """Valida tamanho do arquivo"""
    if value.size > MAX_MB * 1024 * 1024:
        raise ValidationError(f"Arquivo acima de {MAX_MB}MB.")

# Verificar se python-magic está disponível
try:
    import magic  # type: ignore
    HAS_MAGIC = True
except Exception:
    HAS_MAGIC = False

def validate_mime(value):
    """Valida tipo MIME do arquivo (com fallback para extensão)"""
    if not HAS_MAGIC:
        return  # dev/Windows: confie em extensão+tamanho
    
    head = value.read(2048)
    value.seek(0)
    mime = magic.from_buffer(head, mime=True)
    if mime not in {"application/pdf", "image/png", "image/jpeg"}:
        raise ValidationError("Tipo de arquivo não permitido.")

def validate_document_file(value):
    """Validação completa para documentos"""
    validate_file_extension(value)
    validate_file_size(value)
    validate_mime(value)

def validate_image_file(value):
    """Validação específica para imagens"""
    validate_file_extension(value)
    validate_file_size(value)
    validate_mime(value)

def validate_pdf_file(value):
    """Validação específica para PDFs"""
    validate_file_extension(value)
    validate_file_size(value)
    validate_mime(value)

class CustomPasswordValidator:
    """
    Validador customizado de senhas
    """
    def __init__(self, min_length=8):
        self.min_length = min_length

    def validate(self, password, user=None):
        if len(password) < self.min_length:
            raise ValidationError(
                f'Sua senha deve conter pelo menos {self.min_length} caracteres.'
            )
        
        if password.isdigit():
            raise ValidationError('Sua senha não pode ser composta apenas por números.')
        
        if password.isalpha():
            raise ValidationError('Sua senha deve conter pelo menos um número.')
        
        if password.islower():
            raise ValidationError('Sua senha deve conter pelo menos uma letra maiúscula.')
        
        if password.isupper():
            raise ValidationError('Sua senha deve conter pelo menos uma letra minúscula.')

    def get_help_text(self):
        return f'Sua senha deve conter pelo menos {self.min_length} caracteres, incluindo letras maiúsculas, minúsculas e números.'
