#!/bin/bash

# Script para corrigir o arquivo core/urls.py diretamente
# Execute na VPS como root

echo "🛣️ CORREÇÃO DIRETA DO CORE/URLS.PY"
echo "===================================="

# 1. Ir para o diretório do backend
cd /opt/veramo/veramo_backend || { echo "Erro: Diretório não encontrado."; exit 1; }
source venv/bin/activate

# 2. Parar serviço para manutenção
echo "⏹️ 1. PARANDO SERVIÇO"
echo "--------------------"
systemctl stop veramo-backend
echo "✅ Serviço parado"
echo ""

# 3. Verificar arquivo core/urls.py atual
echo "📋 2. VERIFICANDO ARQUIVO CORE/URLS.PY ATUAL"
echo "---------------------------------------------"
echo "🔍 Conteúdo atual do core/urls.py:"
cat core/urls.py
echo ""

# 4. Verificar se há problemas no router
echo "🔍 3. VERIFICANDO PROBLEMAS NO ROUTER"
echo "-------------------------------------"
echo "🔍 Verificando se o router está registrando corretamente:"
grep -A 5 -B 5 "demissao-processes" core/urls.py
echo ""

# 5. Verificar se a ViewSet está sendo importada
echo "🔍 4. VERIFICANDO IMPORTAÇÕES"
echo "-----------------------------"
echo "🔍 Verificando se DemissaoProcessViewSet está sendo importada:"
grep -n "DemissaoProcessViewSet" core/urls.py
echo ""

# 6. Verificar se há conflitos de URLs
echo "🔍 5. VERIFICANDO CONFLITOS DE URLs"
echo "-----------------------------------"
echo "🔍 Verificando se há URLs duplicadas:"
grep -n "path.*demissao" core/urls.py
echo ""

# 7. Corrigir arquivo core/urls.py
echo "🛣️ 6. CORRIGINDO ARQUIVO CORE/URLS.PY"
echo "--------------------------------------"

# Backup do arquivo atual
cp core/urls.py core/urls.py.backup7

# Criar arquivo core/urls.py corrigido
cat > core/urls.py << 'EOF'
from django.urls import path, include
from django.views.generic import TemplateView
from . import views
from rest_framework.routers import DefaultRouter

from .views import (
    UserViewSet,
    CompanyViewSet,
    UnionViewSet,
    ScheduleViewSet,
    DemissaoProcessViewSet,
    DocumentViewSet,
    CompanyUnionViewSet,
    DashboardView,
    ScheduleConfigViewSet,
    AgendaBlockViewSet,
    CustomLoginView,
    dashboard_view,
    SystemLogViewSet,
    GoogleOAuthCallbackView,
    DiagnosticoRedirectUriView,
    TestRealGoogleMeetView,
)
from .views_secure_media import secure_document, secure_assinatura, secure_media_info
from .views_cleanup import limpar_homologacoes
from . import health

app_name = 'core'

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'companies', CompanyViewSet)
router.register(r'unions', UnionViewSet)
router.register(r'schedules', ScheduleViewSet)
router.register(r'demissao-processes', DemissaoProcessViewSet)
router.register(r'documents', DocumentViewSet)
router.register(r'company-unions', CompanyUnionViewSet)
router.register(r'schedule-configs', ScheduleConfigViewSet)
router.register(r'agenda-blocks', AgendaBlockViewSet)
router.register(r'logs', SystemLogViewSet)

urlpatterns = [
    # API router - DEVE VIR PRIMEIRO para evitar conflitos
    path('', include(router.urls)),

    # Dashboard e login
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('login/', CustomLoginView.as_view(), name='custom-login'),
    path('dashboard-view/', dashboard_view, name='dashboard-view'),

    # OAuth Callback - ROTA EXATA DO REDIRECT
    path('oauth2callback', GoogleOAuthCallbackView.as_view(), name='google_oauth_callback'),

    # Diagnóstico cirúrgico
    path('diagnostico-redirect-uri/', DiagnosticoRedirectUriView.as_view(), name='diagnostico-redirect-uri'),

    # Teste Google Meet REAL
    path('test-real-google-meet/', TestRealGoogleMeetView.as_view(), name='test-real-google-meet'),

    # Health endpoints
    path('health/live', health.live, name='health_live'),
    path('health/ready', health.ready, name='health_ready'),
    path('health/detailed', health.detailed, name='health_detailed'),

    # Mídia segura
    path('secure-media/document/<int:pk>/', secure_document, name='secure-document'),
    path('secure-media/assinatura/<int:pk>/<str:tipo>/', secure_assinatura, name='secure-assinatura'),
    path('secure-media/info/<int:pk>/', secure_media_info, name='secure-media-info'),
    # Upload público do trabalhador
    path('public/upload/<int:pk>/<str:token>/', views.PublicUploadView.as_view(), name='public-upload'),

    # Limpeza de dados
    path('cleanup/homologacoes/', limpar_homologacoes, name='limpar-homologacoes'),
]
EOF

echo "✅ Arquivo core/urls.py corrigido"
echo ""

# 8. Verificar se as rotas estão corretas
echo "🔍 7. VERIFICANDO ROTAS CORRIGIDAS"
echo "----------------------------------"
echo "🔍 Verificando se as rotas foram salvas corretamente:"
grep -n "demissao-processes\|router.urls" core/urls.py
echo ""

# 9. Testar configuração Django
echo "🧪 8. TESTANDO CONFIGURAÇÃO DJANGO"
echo "----------------------------------"
echo "🔍 Verificando configuração Django:"
python manage.py check
echo ""

# 10. Reiniciar serviço
echo "🔄 9. REINICIANDO SERVIÇO"
echo "-------------------------"
systemctl start veramo-backend
sleep 5
echo "✅ Serviço reiniciado"
echo ""

# 11. Verificar status
echo "📊 10. VERIFICANDO STATUS"
echo "-------------------------"
systemctl status veramo-backend --no-pager -l
echo ""

# 12. Testar todas as rotas
echo "🧪 11. TESTANDO TODAS AS ROTAS"
echo "------------------------------"

# Obter token de acesso
echo "🔑 Obtendo token de acesso..."
TOKEN_RESPONSE=$(curl -s -X POST http://127.0.0.1:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@veramo.com","password":"admin123"}')

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ACCESS_TOKEN" ]; then
    echo "✅ Token obtido: ${ACCESS_TOKEN:0:20}..."
    
    echo "🔍 Testando endpoint de health check:"
    curl -i http://127.0.0.1:8000/api/health/ 2>/dev/null
    echo ""
    
    echo "🔍 Testando endpoint de empresas com token:"
    curl -i -H "Authorization: Bearer $ACCESS_TOKEN" \
      http://127.0.0.1:8000/api/companies/ 2>/dev/null
    echo ""
    
    echo "🔍 Testando endpoint de demissão com token:"
    curl -i -H "Authorization: Bearer $ACCESS_TOKEN" \
      http://127.0.0.1:8000/api/demissao-processes/ 2>/dev/null
    echo ""
    
    echo "🔍 Testando endpoint de sindicatos com token:"
    curl -i -H "Authorization: Bearer $ACCESS_TOKEN" \
      http://127.0.0.1:8000/api/unions/ 2>/dev/null
    echo ""
    
    echo "🔍 Testando endpoint de usuários com token:"
    curl -i -H "Authorization: Bearer $ACCESS_TOKEN" \
      http://127.0.0.1:8000/api/users/ 2>/dev/null
    echo ""
    
else
    echo "❌ Erro ao obter token de acesso"
fi

# 13. Testar rotas sem autenticação
echo "🔍 Testando rotas sem autenticação:"
echo "🔍 Health check (sem token):"
curl -i http://127.0.0.1:8000/api/health/ 2>/dev/null
echo ""

echo "🔍 Companies (sem token - deve retornar 401):"
curl -i http://127.0.0.1:8000/api/companies/ 2>/dev/null
echo ""

echo "🔍 Demissão (sem token - deve retornar 401):"
curl -i http://127.0.0.1:8000/api/demissao-processes/ 2>/dev/null
echo ""

# 14. Verificar logs
echo "📋 12. VERIFICANDO LOGS"
echo "-----------------------"
echo "🔍 Logs recentes do serviço:"
journalctl -u veramo-backend -n 10 --no-pager
echo ""

echo "✅ CORREÇÃO DIRETA DO CORE/URLS.PY CONCLUÍDA!"
echo "🌐 Sistema deve estar funcionando em: https://veramo.com.br"
echo "👤 Login: admin@veramo.com / admin123"
echo "🛣️ Router do DRF agora está na posição correta!"
echo "📊 Verifique se todos os problemas 404 foram resolvidos!"
