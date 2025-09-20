#!/bin/bash

# Script para diagnosticar e corrigir problemas finais na VPS
# Execute na VPS como root

echo "🔍 DIAGNÓSTICO E CORREÇÃO FINAL"
echo "==============================="

# 1. Ir para o diretório do backend
cd /opt/veramo/veramo_backend || { echo "Erro: Diretório não encontrado."; exit 1; }
source venv/bin/activate

# 2. Verificar configuração atual
echo "⚙️ 1. VERIFICANDO CONFIGURAÇÃO ATUAL"
echo "------------------------------------"
echo "🔍 Verificando arquivo de URLs:"
cat veramo_backend/urls.py
echo ""

echo "🔍 Verificando configuração Django:"
python manage.py check --deploy
echo ""

# 3. Verificar se o serviço está funcionando
echo "📊 2. VERIFICANDO SERVIÇO"
echo "------------------------"
systemctl status veramo-backend --no-pager -l
echo ""

# 4. Testar conexão direta
echo "🧪 3. TESTANDO CONEXÃO DIRETA"
echo "-----------------------------"
echo "🔍 Testando se o serviço responde:"
curl -i http://127.0.0.1:8000/ 2>/dev/null || echo "❌ Serviço não responde"
echo ""

echo "🔍 Testando health check:"
curl -i http://127.0.0.1:8000/health/ 2>/dev/null || echo "❌ Health check não responde"
echo ""

echo "🔍 Testando login:"
curl -i -X POST http://127.0.0.1:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@veramo.com","password":"admin123"}' 2>/dev/null || echo "❌ Login não responde"
echo ""

# 5. Verificar logs de erro
echo "📋 4. VERIFICANDO LOGS DE ERRO"
echo "------------------------------"
echo "🔍 Logs do serviço:"
journalctl -u veramo-backend -n 20 --no-pager
echo ""

echo "🔍 Logs do Gunicorn:"
tail -20 /var/log/gunicorn/error.log 2>/dev/null || echo "Log do Gunicorn não encontrado"
echo ""

# 6. Verificar configuração do Gunicorn
echo "🚀 5. VERIFICANDO CONFIGURAÇÃO DO GUNICORN"
echo "------------------------------------------"
echo "🔍 Configuração atual:"
cat gunicorn.conf.py
echo ""

# 7. Parar serviço e testar manualmente
echo "⏹️ 6. PARANDO SERVIÇO PARA TESTE MANUAL"
echo "---------------------------------------"
systemctl stop veramo-backend
echo "✅ Serviço parado"
echo ""

# 8. Testar Django diretamente
echo "🧪 7. TESTANDO DJANGO DIRETAMENTE"
echo "--------------------------------"
echo "🔍 Testando configuração Django:"
python manage.py check
echo ""

echo "🔍 Testando migrações:"
python manage.py migrate
echo ""

echo "🔍 Testando servidor de desenvolvimento:"
timeout 10s python manage.py runserver 127.0.0.1:8001 &
SERVER_PID=$!
sleep 3

echo "🔍 Testando no servidor de desenvolvimento:"
curl -i http://127.0.0.1:8001/health/ 2>/dev/null || echo "❌ Servidor de desenvolvimento não responde"
echo ""

curl -i -X POST http://127.0.0.1:8001/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@veramo.com","password":"admin123"}' 2>/dev/null || echo "❌ Login no servidor de desenvolvimento não responde"
echo ""

# Parar servidor de desenvolvimento
kill $SERVER_PID 2>/dev/null
echo "✅ Servidor de desenvolvimento parado"
echo ""

# 9. Corrigir configuração do Gunicorn
echo "🔧 8. CORRIGINDO CONFIGURAÇÃO DO GUNICORN"
echo "------------------------------------------"

# Backup da configuração atual
cp gunicorn.conf.py gunicorn.conf.py.backup2

# Criar configuração simplificada
cat > gunicorn.conf.py << 'EOF'
import multiprocessing
import os

# Server socket
bind = "127.0.0.1:8000"
backlog = 2048

# Worker processes
workers = 2
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

# Restart workers after this many requests
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

# Environment variables
raw_env = [
    'DJANGO_SETTINGS_MODULE=veramo_backend.settings.production',
]

# Preload app
preload_app = True

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190
EOF

echo "✅ Configuração do Gunicorn simplificada"
echo ""

# 10. Criar diretórios de log
echo "📁 9. CRIANDO DIRETÓRIOS DE LOG"
echo "-------------------------------"
mkdir -p /var/log/gunicorn
mkdir -p /var/run/gunicorn
chown -R www-data:www-data /var/log/gunicorn
chown -R www-data:www-data /var/run/gunicorn
echo "✅ Diretórios de log criados"
echo ""

# 11. Reiniciar serviço
echo "🔄 10. REINICIANDO SERVIÇO"
echo "--------------------------"
systemctl start veramo-backend
sleep 5
echo "✅ Serviço reiniciado"
echo ""

# 12. Verificar status
echo "📊 11. VERIFICANDO STATUS"
echo "------------------------"
systemctl status veramo-backend --no-pager -l
echo ""

# 13. Testar endpoints finais
echo "🧪 12. TESTANDO ENDPOINTS FINAIS"
echo "--------------------------------"
echo "🔍 Testando health check:"
curl -i http://127.0.0.1:8000/health/ 2>/dev/null
echo ""

echo "🔍 Testando login:"
LOGIN_RESPONSE=$(curl -s -X POST http://127.0.0.1:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@veramo.com","password":"admin123"}')

echo "Resposta do login:"
echo "$LOGIN_RESPONSE"
echo ""

# Extrair token se disponível
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access":"[^"]*"' | cut -d'"' -f4)

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
else
    echo "❌ Erro ao obter token de acesso"
fi

# 14. Verificar logs finais
echo "📋 13. VERIFICANDO LOGS FINAIS"
echo "-------------------------------"
echo "🔍 Logs do serviço:"
journalctl -u veramo-backend -n 10 --no-pager
echo ""

echo "🔍 Logs do Gunicorn:"
tail -10 /var/log/gunicorn/error.log 2>/dev/null || echo "Log do Gunicorn não encontrado"
echo ""

echo "✅ DIAGNÓSTICO E CORREÇÃO CONCLUÍDOS!"
echo "🌐 Sistema deve estar funcionando em: https://veramo.com.br"
echo "👤 Login: admin@veramo.com / admin123"
echo "📊 Verifique se todos os problemas foram resolvidos!"
echo "🔍 Se ainda houver problemas, verifique os logs acima"
