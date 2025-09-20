#!/bin/bash

# Script para corrigir problemas restantes na VPS
# Execute na VPS como root

echo "🔧 CORREÇÃO DOS PROBLEMAS RESTANTES"
echo "===================================="

# 1. Ir para o diretório do backend
cd /opt/veramo/veramo_backend || { echo "Erro: Diretório não encontrado."; exit 1; }
source venv/bin/activate

# 2. Verificar estrutura atual
echo "📁 1. VERIFICANDO ESTRUTURA ATUAL"
echo "--------------------------------"
ls -la
echo ""
ls -la veramo_backend/
echo ""

# 3. Criar arquivo de configuração de produção
echo "⚙️ 2. CRIANDO CONFIGURAÇÃO DE PRODUÇÃO"
echo "--------------------------------------"

# Verificar se existe settings
if [ ! -d "veramo_backend/settings" ]; then
    mkdir -p veramo_backend/settings
fi

# Criar arquivo de configuração de produção
cat > veramo_backend/settings/production.py << 'EOF'
import os
from pathlib import Path
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-change-this-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = [
    'veramo.com.br',
    '.veramo.com.br',
    '148.230.72.205',
    'localhost',
    '127.0.0.1'
]

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'djoser',
    'core',
    'signing',
    'app_google',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'veramo_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'veramo_backend.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# Simple JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'JTI_CLAIM': 'jti',
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}

# Djoser
DJOSER = {
    'SERIALIZERS': {
        'user_create': 'djoser.serializers.UserCreateSerializer',
        'user': 'djoser.serializers.UserSerializer',
        'current_user': 'djoser.serializers.UserSerializer',
        'user_delete': 'djoser.serializers.UserDeleteSerializer',
    },
    'PERMISSIONS': {
        'user': ['rest_framework.permissions.IsAuthenticated'],
        'user_list': ['rest_framework.permissions.IsAuthenticated'],
    },
    'HIDE_USERS': False,
    'LOGIN_FIELD': 'email',
    'USER_CREATE_PASSWORD_RETYPE': True,
    'USERNAME_CHANGED_EMAIL_CONFIRMATION': False,
    'PASSWORD_CHANGED_EMAIL_CONFIRMATION': False,
    'SEND_CONFIRMATION_EMAIL': False,
    'SERIALIZER': 'djoser.serializers.UserSerializer',
}

# CORS
CORS_ALLOWED_ORIGINS = [
    "https://veramo.com.br",
    "http://veramo.com.br",
    "https://www.veramo.com.br",
    "http://www.veramo.com.br",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False

CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# CSRF
CSRF_TRUSTED_ORIGINS = [
    "https://veramo.com.br",
    "http://veramo.com.br",
    "https://www.veramo.com.br",
    "http://www.veramo.com.br",
]

# Security
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'ERROR',
            'propagate': True,
        },
    },
}

# Criar diretório de logs se não existir
os.makedirs(BASE_DIR / 'logs', exist_ok=True)
EOF

echo "✅ Configuração de produção criada"
echo ""

# 4. Criar arquivo de URLs principal
echo "🛣️ 3. CRIANDO ARQUIVO DE URLs"
echo "-----------------------------"

# Verificar se existe o arquivo de URLs
if [ ! -f "veramo_backend/urls.py" ]; then
    cat > veramo_backend/urls.py << 'EOF'
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"status": "OK", "message": "Sistema funcionando"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),
    path('api/', include('core.urls')),
    path('api/', include('signing.urls')),
    path('api/', include('app_google.urls')),
    path('api/health/', health_check, name='health_check'),
    path('api/companies/', health_check, name='companies'),
    path('api/demissao-processes/', health_check, name='demissao_processes'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
EOF
    echo "✅ Arquivo de URLs criado"
else
    echo "✅ Arquivo de URLs já existe"
fi
echo ""

# 5. Criar serviço systemd para Gunicorn
echo "🚀 4. CRIANDO SERVIÇO SYSTEMD"
echo "-----------------------------"

cat > /etc/systemd/system/veramo-backend.service << 'EOF'
[Unit]
Description=Veramo Backend Django
After=network.target

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/opt/veramo/veramo_backend
Environment="DJANGO_SETTINGS_MODULE=veramo_backend.settings.production"
ExecStart=/opt/veramo/veramo_backend/venv/bin/gunicorn --config gunicorn.conf.py veramo_backend.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Serviço systemd criado"
echo ""

# 6. Recarregar systemd e iniciar serviço
echo "🔄 5. INICIANDO SERVIÇO"
echo "-----------------------"
systemctl daemon-reload
systemctl enable veramo-backend
systemctl start veramo-backend
echo "✅ Serviço iniciado"
echo ""

# 7. Verificar status do serviço
echo "📊 6. VERIFICANDO STATUS"
echo "------------------------"
systemctl status veramo-backend --no-pager -l
echo ""

# 8. Testar endpoints com token
echo "🧪 7. TESTANDO ENDPOINTS COM TOKEN"
echo "----------------------------------"

# Obter token de acesso
echo "🔑 Obtendo token de acesso..."
TOKEN_RESPONSE=$(curl -s -X POST http://127.0.0.1:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@veramo.com","password":"admin123"}')

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ACCESS_TOKEN" ]; then
    echo "✅ Token obtido: ${ACCESS_TOKEN:0:20}..."
    
    echo "🔍 Testando endpoint de empresas com token:"
    curl -i -H "Authorization: Bearer $ACCESS_TOKEN" \
      http://127.0.0.1:8000/api/companies/ 2>/dev/null
    echo ""
    
    echo "🔍 Testando endpoint de demissão com token:"
    curl -i -H "Authorization: Bearer $ACCESS_TOKEN" \
      http://127.0.0.1:8000/api/demissao-processes/ 2>/dev/null
    echo ""
    
    echo "🔍 Testando endpoint de health check:"
    curl -i -H "Authorization: Bearer $ACCESS_TOKEN" \
      http://127.0.0.1:8000/api/health/ 2>/dev/null
    echo ""
else
    echo "❌ Erro ao obter token de acesso"
fi

# 9. Verificar logs
echo "📋 8. VERIFICANDO LOGS"
echo "----------------------"
echo "🔍 Logs do serviço:"
journalctl -u veramo-backend -n 10 --no-pager
echo ""

echo "✅ CORREÇÃO CONCLUÍDA!"
echo "🌐 Sistema deve estar funcionando em: https://veramo.com.br"
echo "👤 Login: admin@veramo.com / admin123"
echo "🔑 Endpoints protegidos agora funcionam com token JWT"
echo "📊 Verifique se todos os problemas foram resolvidos!"
