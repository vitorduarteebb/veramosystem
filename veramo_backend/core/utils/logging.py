"""
Utilitários para logging do sistema
"""
import logging
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.http import HttpRequest
from core.models.log import SystemLog

User = get_user_model()

def get_client_ip(request):
    """Extrai o IP do cliente da requisição"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def get_user_agent(request):
    """Extrai o User-Agent da requisição"""
    return request.META.get('HTTP_USER_AGENT', '')

def create_log(level, message, user=None, action=None, request=None, 
               company=None, union=None, schedule=None, metadata=None):
    """
    Cria um log no sistema
    
    Args:
        level: Nível do log (DEBUG, INFO, WARNING, ERROR, SUCCESS)
        message: Mensagem do log
        user: Usuário relacionado (opcional)
        action: Ação realizada (opcional)
        request: Objeto HttpRequest (opcional)
        company: Empresa relacionada (opcional)
        union: Sindicato relacionado (opcional)
        schedule: Agendamento relacionado (opcional)
        metadata: Dados adicionais em JSON (opcional)
    """
    ip_address = None
    user_agent = None
    
    if request:
        ip_address = get_client_ip(request)
        user_agent = get_user_agent(request)
    
    log = SystemLog.objects.create(
        level=level,
        message=message,
        user=user,
        action=action,
        ip_address=ip_address,
        user_agent=user_agent,
        company=company,
        union=union,
        schedule=schedule,
        metadata=metadata
    )
    
    return log

def log_user_action(user, action, message, request=None, **kwargs):
    """Log específico para ações de usuário"""
    return create_log(
        level='INFO',
        message=message,
        user=user,
        action=action,
        request=request,
        **kwargs
    )

def log_security_event(message, request=None, user=None, **kwargs):
    """Log específico para eventos de segurança"""
    return create_log(
        level='WARNING',
        message=message,
        user=user,
        action='SECURITY_EVENT',
        request=request,
        **kwargs
    )

def log_system_error(message, request=None, **kwargs):
    """Log específico para erros do sistema"""
    return create_log(
        level='ERROR',
        message=message,
        request=request,
        action='SYSTEM_ERROR',
        **kwargs
    )

def log_success(message, user=None, action=None, request=None, **kwargs):
    """Log específico para sucessos"""
    return create_log(
        level='SUCCESS',
        message=message,
        user=user,
        action=action,
        request=request,
        **kwargs
    )

def populate_sample_logs():
    """Popula o banco com logs de exemplo"""
    from django.contrib.auth import get_user_model
    from core.models.company import Company
    from core.models.union import Union
    
    User = get_user_model()
    
    # Buscar usuários, empresas e sindicatos existentes
    users = User.objects.all()[:3]
    companies = Company.objects.all()[:2]
    unions = Union.objects.all()[:2]
    
    sample_logs = [
        {
            'level': 'INFO',
            'message': 'Usuário admin fez login no sistema',
            'action': 'LOGIN',
            'user': users[0] if users else None,
        },
        {
            'level': 'WARNING',
            'message': 'Tentativa de login falhada para usuário inexistente',
            'action': 'LOGIN_FAILED',
            'user': None,
        },
        {
            'level': 'ERROR',
            'message': 'Erro ao processar documento de homologação',
            'action': 'DOCUMENT_PROCESSING',
            'user': users[1] if len(users) > 1 else None,
            'company': companies[0] if companies else None,
        },
        {
            'level': 'SUCCESS',
            'message': 'Homologação agendada com sucesso',
            'action': 'SCHEDULE_CREATED',
            'user': users[2] if len(users) > 2 else users[0] if users else None,
            'union': unions[0] if unions else None,
        },
        {
            'level': 'INFO',
            'message': 'Nova empresa cadastrada no sistema',
            'action': 'COMPANY_CREATED',
            'user': users[0] if users else None,
            'company': companies[1] if len(companies) > 1 else companies[0] if companies else None,
        },
        {
            'level': 'DEBUG',
            'message': 'Cache atualizado com sucesso',
            'action': 'CACHE_UPDATE',
            'user': None,
        },
        {
            'level': 'INFO',
            'message': 'Usuário atualizou perfil',
            'action': 'USER_UPDATED',
            'user': users[1] if len(users) > 1 else users[0] if users else None,
        },
        {
            'level': 'SUCCESS',
            'message': 'Documento aprovado pelo sindicato',
            'action': 'DOCUMENT_APPROVED',
            'user': users[2] if len(users) > 2 else users[0] if users else None,
            'union': unions[1] if len(unions) > 1 else unions[0] if unions else None,
        },
        {
            'level': 'WARNING',
            'message': 'Documento rejeitado - informações incompletas',
            'action': 'DOCUMENT_REJECTED',
            'user': users[0] if users else None,
            'company': companies[0] if companies else None,
        },
        {
            'level': 'SUCCESS',
            'message': 'Homologação concluída com sucesso',
            'action': 'HOMOLOGATION_COMPLETED',
            'user': users[1] if len(users) > 1 else users[0] if users else None,
            'union': unions[0] if unions else None,
        }
    ]
    
    created_logs = []
    for log_data in sample_logs:
        log = SystemLog.objects.create(**log_data)
        created_logs.append(log)
    
    return created_logs
