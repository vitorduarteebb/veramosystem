"""
Configurações para integração com Google Meet
"""

# Configurações da API do Google Workspace
GOOGLE_WORKSPACE_CONFIG = {
    # Escopos necessários para a API do Google Meet
    'SCOPES': [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/meet.recordings.readonly'
    ],
    
    # Configurações de autenticação
    'AUTH_CONFIG': {
        # Caminho para o arquivo de credenciais de serviço (opcional)
        'CREDENTIALS_FILE': None,  # 'path/to/service-account-key.json'
        
        # Informações da conta de serviço em formato JSON (opcional)
        'SERVICE_ACCOUNT_INFO': None,  # Variável de ambiente GOOGLE_SERVICE_ACCOUNT_INFO
        
        # ID do projeto no Google Cloud
        'PROJECT_ID': None,  # Variável de ambiente GOOGLE_CLOUD_PROJECT_ID
        
        # ID da conta de serviço
        'SERVICE_ACCOUNT_EMAIL': None,  # Variável de ambiente GOOGLE_SERVICE_ACCOUNT_EMAIL
    },
    
    # Configurações do Google Meet
    'MEET_CONFIG': {
        # Fuso horário padrão para as reuniões
        'DEFAULT_TIMEZONE': 'America/Sao_Paulo',
        
        # Duração padrão da reunião em minutos (se não especificada)
        'DEFAULT_DURATION_MINUTES': 60,
        
        # Configurações de lembretes
        'REMINDERS': {
            'EMAIL_24H': True,      # Email 24h antes
            'POPUP_15MIN': True,    # Popup 15 min antes
            'EMAIL_1H': False,      # Email 1h antes
        },
        
        # Configurações de conferência
        'CONFERENCE': {
            'AUTO_JOIN': True,      # Entrada automática
            'RECORDING': False,     # Gravação automática
            'TRANSCRIPTION': False, # Transcrição automática
        }
    },
    
    # Configurações de cache
    'CACHE_CONFIG': {
        'CREDENTIALS_TTL': 3600,   # Cache das credenciais por 1 hora
        'MEETING_INFO_TTL': 1800,  # Cache das informações da reunião por 30 min
    },
    
    # Configurações de logging
    'LOGGING': {
        'LEVEL': 'INFO',           # Nível de log (DEBUG, INFO, WARNING, ERROR)
        'ENABLE_AUDIT': True,      # Habilitar logs de auditoria
        'LOG_SENSITIVE_DATA': False, # Log de dados sensíveis (não recomendado)
    }
}

# Configurações de fallback para quando o Google Meet não estiver disponível
GOOGLE_MEET_FALLBACK = {
    # URL padrão para videoconferência quando não há Google Meet
    'DEFAULT_VIDEO_URL': 'https://meet.google.com/new',
    
    # Mensagem de erro quando o serviço não está disponível
    'SERVICE_UNAVAILABLE_MESSAGE': 'Serviço de videoconferência temporariamente indisponível',
    
    # Habilitar criação de links manuais
    'ENABLE_MANUAL_LINKS': True,
}

# Configurações de segurança
GOOGLE_MEET_SECURITY = {
    # Validar domínios permitidos para participantes
    'ALLOWED_DOMAINS': [],  # Lista de domínios permitidos (vazio = todos)
    
    # Restringir criação de reuniões por usuário
    'RESTRICT_BY_ROLE': False,  # Restringir por papel do usuário
    
    # Logs de segurança
    'SECURITY_LOGGING': True,
    
    # Rate limiting para criação de reuniões
    'RATE_LIMIT': {
        'MAX_MEETINGS_PER_HOUR': 10,
        'MAX_MEETINGS_PER_DAY': 50,
    }
}
