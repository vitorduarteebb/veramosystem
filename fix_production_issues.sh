#!/bin/bash

# Script para corrigir problemas de produção na VPS
# Execute na VPS como root

echo "🔧 CORREÇÃO COMPLETA DE PROBLEMAS DE PRODUÇÃO"
echo "=============================================="

# 1. Parar serviços para manutenção
echo "⏹️ 1. PARANDO SERVIÇOS"
echo "----------------------"
systemctl stop nginx
systemctl stop gunicorn
echo "✅ Serviços parados"
echo ""

# 2. Ir para o diretório do backend
cd /opt/veramo/veramo_backend || { echo "Erro: Diretório não encontrado."; exit 1; }
source venv/bin/activate

# 3. Corrigir configurações do Django
echo "⚙️ 2. CORRIGINDO CONFIGURAÇÕES DO DJANGO"
echo "---------------------------------------"

# Backup da configuração atual
cp veramo_backend/settings/production.py veramo_backend/settings/production.py.backup

# Criar configuração de produção corrigida
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

echo "✅ Configuração de produção atualizada"
echo ""

# 4. Aplicar migrações
echo "🗄️ 3. APLICANDO MIGRAÇÕES"
echo "-------------------------"
python manage.py migrate
echo "✅ Migrações aplicadas"
echo ""

# 5. Coletar arquivos estáticos
echo "📁 4. COLETANDO ARQUIVOS ESTÁTICOS"
echo "----------------------------------"
python manage.py collectstatic --noinput
echo "✅ Arquivos estáticos coletados"
echo ""

# 6. Corrigir configuração do Nginx
echo "🌐 5. CORRIGINDO CONFIGURAÇÃO DO NGINX"
echo "--------------------------------------"

# Backup da configuração atual
cp /etc/nginx/sites-available/veramo.conf /etc/nginx/sites-available/veramo.conf.backup 2>/dev/null || true

# Criar configuração corrigida do Nginx
cat > /etc/nginx/sites-available/veramo.conf << 'EOF'
server {
    listen 80;
    server_name veramo.com.br www.veramo.com.br;
    
    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name veramo.com.br www.veramo.com.br;
    
    # SSL Configuration (ajuste conforme seu certificado)
    ssl_certificate /etc/ssl/certs/veramo.com.br.crt;
    ssl_certificate_key /etc/ssl/private/veramo.com.br.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Frontend (React)
    location / {
        root /opt/veramo/veramo_backend/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_redirect off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Authorization $http_authorization;
        proxy_set_header X-CSRFToken $http_x_csrftoken;
        proxy_set_header X-Requested-With $http_x_requested_with;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://veramo.com.br" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-CSRFToken, X-Requested-With" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://veramo.com.br";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-CSRFToken, X-Requested-With";
            add_header Access-Control-Allow-Credentials "true";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type "text/plain; charset=utf-8";
            add_header Content-Length 0;
            return 204;
        }
    }
    
    # Auth endpoints
    location /auth/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_redirect off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Authorization $http_authorization;
        proxy_set_header X-CSRFToken $http_x_csrftoken;
        proxy_set_header X-Requested-With $http_x_requested_with;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://veramo.com.br" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-CSRFToken, X-Requested-With" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://veramo.com.br";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-CSRFToken, X-Requested-With";
            add_header Access-Control-Allow-Credentials "true";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type "text/plain; charset=utf-8";
            add_header Content-Length 0;
            return 204;
        }
    }
    
    # Static files
    location /static/ {
        alias /opt/veramo/veramo_backend/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files
    location /media/ {
        alias /opt/veramo/veramo_backend/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_redirect off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

echo "✅ Configuração do Nginx atualizada"
echo ""

# 7. Corrigir configuração do Gunicorn
echo "🚀 6. CORRIGINDO CONFIGURAÇÃO DO GUNICORN"
echo "----------------------------------------"

# Backup da configuração atual
cp gunicorn.conf.py gunicorn.conf.py.backup 2>/dev/null || true

# Criar configuração corrigida do Gunicorn
cat > gunicorn.conf.py << 'EOF'
import multiprocessing
import os

# Server socket
bind = "127.0.0.1:8000"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

# Restart workers after this many requests, to help prevent memory leaks
max_requests = 1000
max_requests_jitter = 50

# Logging
accesslog = "/var/log/gunicorn/access.log"
errorlog = "/var/log/gunicorn/error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "veramo_gunicorn"

# Server mechanics
daemon = False
pidfile = "/var/run/gunicorn/veramo.pid"
user = "www-data"
group = "www-data"
tmp_upload_dir = None

# SSL (if needed)
# keyfile = "/path/to/keyfile"
# certfile = "/path/to/certfile"

# Environment variables
raw_env = [
    'DJANGO_SETTINGS_MODULE=veramo_backend.settings.production',
]

# Preload app
preload_app = True

# Worker timeout
worker_tmp_dir = "/dev/shm"

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190
EOF

echo "✅ Configuração do Gunicorn atualizada"
echo ""

# 8. Criar diretórios necessários
echo "📁 7. CRIANDO DIRETÓRIOS NECESSÁRIOS"
echo "------------------------------------"
mkdir -p /var/log/gunicorn
mkdir -p /var/run/gunicorn
chown -R www-data:www-data /var/log/gunicorn
chown -R www-data:www-data /var/run/gunicorn
echo "✅ Diretórios criados"
echo ""

# 9. Corrigir permissões
echo "🔐 8. CORRIGINDO PERMISSÕES"
echo "----------------------------"
chown -R www-data:www-data /opt/veramo/
chmod -R 755 /opt/veramo/
chmod -R 644 /opt/veramo/veramo_backend/db.sqlite3
echo "✅ Permissões corrigidas"
echo ""

# 10. Sincronizar relógio
echo "⏰ 9. SINCRONIZANDO RELÓGIO"
echo "---------------------------"
timedatectl set-ntp true
systemctl restart systemd-timesyncd
echo "✅ Relógio sincronizado"
echo ""

# 11. Testar configuração do Nginx
echo "🧪 10. TESTANDO CONFIGURAÇÃO DO NGINX"
echo "--------------------------------------"
nginx -t
if [ $? -eq 0 ]; then
    echo "✅ Configuração do Nginx válida"
else
    echo "❌ Erro na configuração do Nginx"
    exit 1
fi
echo ""

# 12. Reiniciar serviços
echo "🔄 11. REINICIANDO SERVIÇOS"
echo "----------------------------"
systemctl restart gunicorn
systemctl restart nginx
systemctl enable gunicorn
systemctl enable nginx
echo "✅ Serviços reiniciados"
echo ""

# 13. Verificar status dos serviços
echo "📊 12. VERIFICANDO STATUS DOS SERVIÇOS"
echo "---------------------------------------"
systemctl status gunicorn --no-pager -l
echo ""
systemctl status nginx --no-pager -l
echo ""

# 14. Testar endpoints
echo "🧪 13. TESTANDO ENDPOINTS"
echo "-------------------------"
echo "🔍 Testando endpoint de login:"
curl -i -X POST http://127.0.0.1:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@veramo.com","password":"admin123"}' 2>/dev/null
echo ""

echo "🔍 Testando endpoint de empresas:"
curl -i http://127.0.0.1:8000/api/companies/ 2>/dev/null
echo ""

echo "🔍 Testando endpoint de demissão:"
curl -i http://127.0.0.1:8000/api/demissao-processes/ 2>/dev/null
echo ""

echo "✅ CORREÇÃO CONCLUÍDA!"
echo "🌐 Sistema deve estar funcionando em: https://veramo.com.br"
echo "👤 Login: admin@veramo.com / admin123"
echo "📊 Verifique se os problemas foram resolvidos!"
