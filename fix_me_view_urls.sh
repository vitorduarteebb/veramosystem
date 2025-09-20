#!/bin/bash

# Script para corrigir problema da view MeWithRoleView
# Execute na VPS como root

echo "🔧 Corrigindo problema da view MeWithRoleView..."

# 1. Ir para o diretório do backend
cd /opt/veramo/veramo_backend || { echo "Erro: Diretório não encontrado."; exit 1; }

# 2. Ativar ambiente virtual
source venv/bin/activate

# 3. Verificar URLs atuais
echo "🔍 Verificando URLs atuais..."
if [ -f "veramo_backend/urls/__init__.py" ]; then
    echo "Arquivo urls/__init__.py encontrado:"
    cat veramo_backend/urls/__init__.py
else
    echo "❌ Arquivo urls/__init__.py não encontrado"
fi

# 4. Corrigir URLs para usar MeWithRoleView
echo "🔧 Corrigindo URLs para usar MeWithRoleView..."
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
    # Auth - USAR NOSSA VIEW PERSONALIZADA
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

# 5. Verificar se o arquivo foi criado
echo "✅ Verificando arquivo urls/__init__.py..."
if [ -f "veramo_backend/urls/__init__.py" ]; then
    echo "Arquivo urls/__init__.py criado com sucesso!"
    echo "Primeiras linhas:"
    head -15 veramo_backend/urls/__init__.py
else
    echo "❌ Erro: Arquivo urls/__init__.py não foi criado"
    exit 1
fi

# 6. Verificar se MeWithRoleView existe
echo "✅ Verificando arquivo auth_me_view.py..."
if [ -f "veramo_backend/auth_me_view.py" ]; then
    echo "Arquivo auth_me_view.py existe!"
    echo "Primeiras linhas:"
    head -10 veramo_backend/auth_me_view.py
else
    echo "❌ Erro: Arquivo auth_me_view.py não existe"
    exit 1
fi

# 7. Reiniciar backend
echo "🔄 Reiniciando backend..."
systemctl restart veramo-backend

# 8. Aguardar inicialização
sleep 10

# 9. Testar endpoint /auth/users/me/ com nossa view
echo "🧪 Testando endpoint /auth/users/me/ com nossa view..."
# Primeiro fazer login para obter token
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@veramo.com", "password": "admin123"}')

echo "Resposta do login:"
echo $LOGIN_RESPONSE

# Extrair token de acesso
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ACCESS_TOKEN" ]; then
    echo "Token obtido: ${ACCESS_TOKEN:0:50}..."
    
    # Testar endpoint /auth/users/me/ com nossa view
    echo "Testando /auth/users/me/ com nossa view:"
    curl -s -X GET http://localhost:8000/auth/users/me/ \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json"
else
    echo "❌ Erro: Não foi possível obter token de acesso"
fi

echo -e "\n\n✅ View MeWithRoleView corrigida!"
echo "🌐 Teste o login em: https://veramo.com.br"
echo "👤 Credenciais: admin@veramo.com / admin123"
