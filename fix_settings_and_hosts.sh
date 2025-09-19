#!/bin/bash

# Script para corrigir settings e ALLOWED_HOSTS na VPS
# Execute na VPS como root

echo "🔧 Corrigindo settings e ALLOWED_HOSTS..."

cd /opt/veramo/veramo_backend
source venv/bin/activate

# 1. Parar serviço
systemctl stop veramo-backend

# 2. Criar diretório settings se não existir
echo "📁 Criando diretório settings..."
mkdir -p veramo_backend/settings

# 3. Criar settings/prod.py
echo "📝 Criando settings/prod.py..."
cat > veramo_backend/settings/prod.py << 'EOF'
import os
from pathlib import Path
import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(
    DEBUG=(bool, False),
    SECRET_KEY=(str, 'change-me'),
    ALLOWED_HOSTS=(list, []),
    CORS_ALLOWED_ORIGINS=(list, []),
    CSRF_TRUSTED_ORIGINS=(list, []),
)
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

SECRET_KEY = env('SECRET_KEY', default='django-insecure-change-me-in-production')
DEBUG = env('DEBUG', default=False)
ALLOWED_HOSTS = env('ALLOWED_HOSTS', default=['veramo.com.br', 'www.veramo.com.br', '148.230.72.205', 'localhost', '127.0.0.1'])

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'djoser',
    'drf_yasg',
    'core',
    'signing',
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
WSGI_APPLICATION = 'veramo_backend.wsgi.application'
ASGI_APPLICATION = 'veramo_backend.asgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': str(BASE_DIR / 'db.sqlite3'),
    }
}

AUTH_USER_MODEL = 'core.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

DJOSER = {
    'LOGIN_FIELD': 'email',
}

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env('CORS_ALLOWED_ORIGINS', default=['https://veramo.com.br', 'https://www.veramo.com.br'])
CSRF_TRUSTED_ORIGINS = env('CSRF_TRUSTED_ORIGINS', default=['https://veramo.com.br', 'https://www.veramo.com.br'])

LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = env('STATIC_ROOT', default=str(BASE_DIR / 'staticfiles'))
MEDIA_URL = '/media/'
MEDIA_ROOT = env('MEDIA_ROOT', default=str(BASE_DIR / 'media'))

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [str(BASE_DIR / 'templates')],
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
EOF

# 4. Criar settings/__init__.py
echo "📝 Criando settings/__init__.py..."
cat > veramo_backend/settings/__init__.py << 'EOF'
# Settings package
EOF

# 5. Atualizar .env com configurações corretas
echo "📝 Atualizando .env..."
cat > .env << 'EOF'
DEBUG=False
SECRET_KEY=django-insecure-change-me-in-production-veramo-2024
ALLOWED_HOSTS=veramo.com.br,www.veramo.com.br,148.230.72.205,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://veramo.com.br,https://www.veramo.com.br
CSRF_TRUSTED_ORIGINS=https://veramo.com.br,https://www.veramo.com.br
DATABASE_URL=sqlite:///opt/veramo/veramo_backend/db.sqlite3
STATIC_ROOT=/opt/veramo/veramo_backend/staticfiles
MEDIA_ROOT=/opt/veramo/veramo_backend/media
EOF

# 6. Testar Django
echo "🧪 Testando Django..."
python manage.py check

# 7. Corrigir serviço systemd
echo "⚙️ Corrigindo serviço systemd..."
cat > /etc/systemd/system/veramo-backend.service << 'EOF'
[Unit]
Description=Veramo Backend Django
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/opt/veramo/veramo_backend
Environment=PYTHONPATH=/opt/veramo/veramo_backend
Environment=DJANGO_SETTINGS_MODULE=veramo_backend.settings.prod
ExecStart=/opt/veramo/veramo_backend/venv/bin/gunicorn veramo_backend.wsgi:application --bind 0.0.0.0:8000 --workers 1 --timeout 30
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# 8. Recarregar systemd
systemctl daemon-reload

# 9. Iniciar serviço
systemctl start veramo-backend

# 10. Aguardar inicialização
sleep 10

# 11. Verificar status
echo "📋 Status do serviço:"
systemctl status veramo-backend

# 12. Testar endpoint
echo "🧪 Testando endpoint..."
curl -X POST http://localhost:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@veramo.com", "password": "admin123"}' \
  -v

echo -e "\n\n✅ Settings e ALLOWED_HOSTS corrigidos!"
echo "🌐 Teste o login em: https://veramo.com.br"
echo "👤 Credenciais: admin@veramo.com / admin123"
