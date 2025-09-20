#!/bin/bash

# Script ULTRA SIMPLES para corrigir Django na VPS
# Execute na VPS como root

echo "🔧 Correção ULTRA SIMPLES do Django..."

# 1. Parar todos os serviços
systemctl stop veramo-backend || true
systemctl stop veramo-frontend || true

# 2. Remover diretório completamente
echo "🗑️ Removendo diretório completamente..."
rm -rf /opt/veramo

# 3. Criar diretório novo
echo "📁 Criando diretório novo..."
mkdir -p /opt/veramo
cd /opt/veramo

# 4. Clonar repositório limpo
echo "📥 Clonando repositório limpo..."
git clone https://github.com/vitorduarteebb/veramosystem.git .

# 5. Ir para o backend
cd veramo_backend

# 6. Criar ambiente virtual
echo "🐍 Criando ambiente virtual..."
python3 -m venv venv
source venv/bin/activate

# 7. Instalar dependências
echo "📦 Instalando dependências..."
pip install --upgrade pip
pip install -r requirements.txt

# 8. Criar estrutura Django básica
echo "📁 Criando estrutura Django básica..."
mkdir -p veramo_backend/settings
mkdir -p veramo_backend/urls

# 9. Criar settings ULTRA SIMPLES
echo "📝 Criando settings ULTRA SIMPLES..."
cat > veramo_backend/settings/__init__.py << 'EOF'
# Settings package
EOF

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
    'drf_yasg',
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

# 10. Criar URLs ULTRA SIMPLES
echo "🌐 Criando URLs ULTRA SIMPLES..."
cat > veramo_backend/urls/__init__.py << 'EOF'
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from veramo_backend.auth_simple import SimpleLoginView
from veramo_backend.auth_me_view import MeWithRoleView
from veramo_backend.api_views import UnionsView, CompaniesView
from veramo_backend.api_detail_views import UnionDetailView, CompanyDetailView
from veramo_backend.api_extra_views import SchedulesView, UsersByUnionView, CompanyUnionsView
from veramo_backend.api_users_view import UsersView

def health_view(request):
    return HttpResponse('OK')

urlpatterns = [
    # Auth simples
    path('auth/jwt/create/', SimpleLoginView.as_view(), name='jwt-create'),
    path('auth/users/me/', MeWithRoleView.as_view(), name='auth-me'),

    # Admin e health
    path('admin/', admin.site.urls),
    path('health/', health_view),

    # API unions/companies (lista/cria e detalhe)
    path('api/unions/', UnionsView.as_view()),
    path('api/unions/<int:pk>/', UnionDetailView.as_view()),
    path('api/companies/', CompaniesView.as_view()),
    path('api/companies/<int:pk>/', CompanyDetailView.as_view()),

    # API auxiliares
    path('api/schedules/', SchedulesView.as_view()),
    path('api/users/', UsersView.as_view()),
    path('api/company-unions/', CompanyUnionsView.as_view()),

    # Djoser (mantido como fallback)
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
EOF

# 11. Testar configuração
echo "🧪 Testando configuração..."
python manage.py check

# 12. Executar migrações
echo "🗄️ Executando migrações..."
python manage.py migrate

# 13. Criar superuser
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

# 14. Coletar arquivos estáticos
echo "📁 Coletando arquivos estáticos..."
python manage.py collectstatic --noinput

# 15. Criar serviço systemd
echo "⚙️ Criando serviço systemd..."
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

# 16. Recarregar systemd e iniciar serviço
echo "🔄 Iniciando serviço..."
systemctl daemon-reload
systemctl enable veramo-backend
systemctl start veramo-backend

# 17. Aguardar inicialização
sleep 10

# 18. Testar endpoint
echo "🧪 Testando endpoint..."
curl -X POST http://localhost:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@veramo.com", "password": "admin123"}' \
  -v

echo -e "\n\n✅ Django ULTRA SIMPLES corrigido!"
echo "🌐 Teste o login em: https://veramo.com.br"
echo "👤 Credenciais: admin@veramo.com / admin123"
