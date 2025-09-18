"""
Exception handlers customizados para o Veramo3
Logging e tratamento de erros globais
"""
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('core.security')

def custom_exception_handler(exc, context):
    """
    Exception handler customizado para logging de erros
    """
    # Chamar o handler padrão do DRF
    response = exception_handler(exc, context)
    
    if response is not None:
        # Log de erros 5xx (erros do servidor)
        if response.status_code >= 500:
            logger.error(
                f"Erro interno do servidor: {exc} | "
                f"View: {context.get('view', 'Unknown')} | "
                f"User: {context.get('request').user if context.get('request') else 'Anonymous'}"
            )
        
        # Log de erros 4xx (erros do cliente)
        elif response.status_code >= 400:
            logger.warning(
                f"Erro do cliente: {exc} | "
                f"Status: {response.status_code} | "
                f"View: {context.get('view', 'Unknown')} | "
                f"User: {context.get('request').user if context.get('request') else 'Anonymous'}"
            )
        
        # Log de tentativas de acesso não autorizado
        if response.status_code == 401:
            logger.warning(
                f"Tentativa de acesso não autorizado | "
                f"View: {context.get('view', 'Unknown')} | "
                f"IP: {context.get('request').META.get('REMOTE_ADDR', 'Unknown') if context.get('request') else 'Unknown'}"
            )
        
        # Log de tentativas de acesso proibido
        elif response.status_code == 403:
            logger.warning(
                f"Tentativa de acesso proibido | "
                f"View: {context.get('view', 'Unknown')} | "
                f"User: {context.get('request').user if context.get('request') else 'Anonymous'} | "
                f"IP: {context.get('request').META.get('REMOTE_ADDR', 'Unknown') if context.get('request') else 'Unknown'}"
            )
    
    return response

class VeramoValidationError(Exception):
    """
    Exceção customizada para validações do Veramo3
    """
    def __init__(self, message, field=None, code=None):
        self.message = message
        self.field = field
        self.code = code
        super().__init__(self.message)

class VeramoPermissionError(Exception):
    """
    Exceção customizada para erros de permissão do Veramo3
    """
    def __init__(self, message, user=None, resource=None):
        self.message = message
        self.user = user
        self.resource = resource
        super().__init__(self.message)

class VeramoFileValidationError(Exception):
    """
    Exceção customizada para erros de validação de arquivos
    """
    def __init__(self, message, file_info=None):
        self.message = message
        self.file_info = file_info
        super().__init__(self.message)
