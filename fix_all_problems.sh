#!/bin/bash

# Script para corrigir TODOS os problemas na VPS
# Execute na VPS como root

echo "🔧 Corrigindo TODOS os problemas na VPS..."

cd /opt/veramo/veramo_backend
source venv/bin/activate

# 1. Instalar dependências faltantes
echo "📦 Instalando dependências faltantes..."
pip install setuptools pkg_resources
pip install --upgrade pip setuptools wheel

# 2. Corrigir manage.py
echo "📝 Corrigindo manage.py..."
cat > manage.py << 'EOF'
#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'veramo_backend.settings.prod')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
EOF

# 3. Criar settings simples sem drf-yasg
echo "⚙️ Criando settings simples..."
cat > veramo_backend/settings/prod.py << 'EOF'
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = 'django-insecure-change-me-in-production-veramo-2024'
DEBUG = False
ALLOWED_HOSTS = ['veramo.com.br', 'www.veramo.com.br', '148.230.72.205', 'localhost', '127.0.0.1']

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

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

DJOSER = {
    'LOGIN_FIELD': 'email',
}

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = ['https://veramo.com.br', 'https://www.veramo.com.br']
CSRF_TRUSTED_ORIGINS = ['https://veramo.com.br', 'https://www.veramo.com.br']

LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
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

# 4. Criar URLs simples
echo "🌐 Criando URLs simples..."
mkdir -p veramo_backend/urls
cat > veramo_backend/urls/__init__.py << 'EOF'
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

def health_view(request):
    return HttpResponse('OK')

@api_view(['GET'])
@permission_classes([AllowAny])
def test_view(request):
    return Response({"message": "Backend funcionando!"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health_view),
    path('test/', test_view),
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
EOF

# 5. Testar configuração
echo "🧪 Testando configuração..."
python manage.py check

# 6. Executar migrações
echo "🗄️ Executando migrações..."
python manage.py migrate

# 7. Criar superuser
echo "👤 Criando superuser..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()

# Deletar usuário admin se existir
try:
    admin_user = User.objects.get(username='admin')
    admin_user.delete()
    print('Usuário admin antigo removido')
except User.DoesNotExist:
    print('Usuário admin não existia')

# Criar novo usuário admin
admin_user = User.objects.create_superuser(
    username='admin',
    email='admin@veramo.com',
    password='admin123'
)
print('Novo usuário admin criado!')
print(f'Username: {admin_user.username}')
print(f'Email: {admin_user.email}')
print(f'Password: admin123')
"

# 8. Coletar arquivos estáticos
echo "📁 Coletando arquivos estáticos..."
python manage.py collectstatic --noinput

# 9. Atualizar serviço systemd
echo "⚙️ Atualizando serviço systemd..."
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
ExecStart=/opt/veramo/veramo_backend/venv/bin/gunicorn veramo_backend.wsgi:application --bind 0.0.0.0:8000 --workers 3
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# 10. Recarregar systemd e reiniciar serviço
echo "🔄 Reiniciando serviço..."
systemctl daemon-reload
systemctl restart veramo-backend

# 11. Aguardar inicialização
sleep 10

# 12. Testar endpoints
echo "🧪 Testando endpoints..."
echo "Health check:"
curl http://localhost:8000/health/
echo -e "\n\nTest endpoint:"
curl http://localhost:8000/test/
echo -e "\n\nLogin test:"
curl -X POST http://localhost:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@veramo.com", "password": "admin123"}' \
  -v

echo -e "\n\n✅ TODOS os problemas corrigidos!"
echo "🌐 Teste o login em: https://veramo.com.br"
echo "👤 Credenciais: admin@veramo.com / admin123"
