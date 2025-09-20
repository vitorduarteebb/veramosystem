#!/bin/bash

# Script para corrigir usando as rotas reais do sistema
# Execute na VPS como root

echo "🛣️ CORREÇÃO USANDO ROTAS REAIS DO SISTEMA"
echo "=========================================="

# 1. Ir para o diretório do backend
cd /opt/veramo/veramo_backend || { echo "Erro: Diretório não encontrado."; exit 1; }
source venv/bin/activate

# 2. Parar serviço para manutenção
echo "⏹️ 1. PARANDO SERVIÇO"
echo "--------------------"
systemctl stop veramo-backend
echo "✅ Serviço parado"
echo ""

# 3. Verificar ViewSets existentes
echo "📋 2. VERIFICANDO VIEWSETS EXISTENTES"
echo "-------------------------------------"
echo "🔍 Verificando DemissaoProcessViewSet:"
grep -n "class DemissaoProcessViewSet" core/views.py || echo "❌ DemissaoProcessViewSet não encontrado"
echo ""

echo "🔍 Verificando CompanyViewSet:"
grep -n "class CompanyViewSet" core/views.py || echo "❌ CompanyViewSet não encontrado"
echo ""

echo "🔍 Verificando UnionViewSet:"
grep -n "class UnionViewSet" core/views.py || echo "❌ UnionViewSet não encontrado"
echo ""

# 4. Verificar se as ViewSets estão implementadas
echo "🔍 3. VERIFICANDO IMPLEMENTAÇÃO DAS VIEWSETS"
echo "---------------------------------------------"
echo "🔍 Verificando se DemissaoProcessViewSet tem métodos:"
grep -A 10 "class DemissaoProcessViewSet" core/views.py || echo "❌ DemissaoProcessViewSet não implementado"
echo ""

# 5. Corrigir arquivo de URLs para usar rotas reais
echo "🛣️ 4. CORRIGINDO ARQUIVO DE URLs PARA USAR ROTAS REAIS"
echo "------------------------------------------------------"

# Backup do arquivo atual
cp veramo_backend/urls.py veramo_backend/urls.py.backup6

# Criar arquivo de URLs que usa as rotas reais
cat > veramo_backend/urls.py << 'EOF'
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"status": "OK", "message": "Sistema funcionando", "version": "1.0.0"})

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # Authentication
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),
    
    # Health check endpoint
    path('api/health/', health_check, name='health_check'),
    
    # Apps (usando as rotas reais do sistema)
    path('api/', include('core.urls')),
    path('api/', include('signing.urls')),
    path('api/', include('app_google.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
EOF

echo "✅ Arquivo de URLs corrigido para usar rotas reais"
echo ""

# 6. Verificar se as rotas estão corretas
echo "🔍 5. VERIFICANDO ROTAS"
echo "-----------------------"
echo "🔍 Verificando se as rotas foram salvas corretamente:"
grep -n "api/health\|include.*core" veramo_backend/urls.py
echo ""

# 7. Testar configuração Django
echo "🧪 6. TESTANDO CONFIGURAÇÃO DJANGO"
echo "----------------------------------"
echo "🔍 Verificando configuração Django:"
python manage.py check
echo ""

# 8. Reiniciar serviço
echo "🔄 7. REINICIANDO SERVIÇO"
echo "-------------------------"
systemctl start veramo-backend
sleep 5
echo "✅ Serviço reiniciado"
echo ""

# 9. Verificar status
echo "📊 8. VERIFICANDO STATUS"
echo "------------------------"
systemctl status veramo-backend --no-pager -l
echo ""

# 10. Testar todas as rotas
echo "🧪 9. TESTANDO TODAS AS ROTAS"
echo "-----------------------------"

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

# 11. Testar rotas sem autenticação
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

# 12. Verificar logs
echo "📋 10. VERIFICANDO LOGS"
echo "-----------------------"
echo "🔍 Logs recentes do serviço:"
journalctl -u veramo-backend -n 10 --no-pager
echo ""

echo "✅ CORREÇÃO USANDO ROTAS REAIS CONCLUÍDA!"
echo "🌐 Sistema deve estar funcionando em: https://veramo.com.br"
echo "👤 Login: admin@veramo.com / admin123"
echo "🛣️ Agora usando as rotas reais do sistema!"
echo "📊 Verifique se todos os problemas 404 foram resolvidos!"
