#!/bin/bash

# Script para diagnosticar problemas de produção na VPS
# Execute na VPS como root

echo "🔍 DIAGNÓSTICO COMPLETO DE PROBLEMAS DE PRODUÇÃO"
echo "=================================================="

# 1. Verificar status dos serviços
echo "📊 1. STATUS DOS SERVIÇOS"
echo "------------------------"
systemctl status nginx --no-pager -l
echo ""
systemctl status gunicorn --no-pager -l
echo ""

# 2. Verificar logs de erro
echo "📋 2. LOGS DE ERRO RECENTES"
echo "--------------------------"
echo "🔴 Nginx Error Log:"
tail -20 /var/log/nginx/error.log
echo ""
echo "🔴 Gunicorn Error Log:"
journalctl -u gunicorn -n 20 --no-pager
echo ""

# 3. Verificar configuração do Django
echo "⚙️ 3. VERIFICAÇÃO DO DJANGO"
echo "---------------------------"
cd /opt/veramo/veramo_backend || { echo "Erro: Diretório não encontrado."; exit 1; }
source venv/bin/activate

echo "🔍 Verificando configuração Django:"
python manage.py check --deploy
echo ""

echo "📊 Verificando migrações:"
python manage.py showmigrations
echo ""

echo "🗄️ Aplicando migrações pendentes:"
python manage.py migrate
echo ""

# 4. Verificar variáveis de ambiente
echo "🌍 4. VARIÁVEIS DE AMBIENTE"
echo "---------------------------"
echo "🔍 Verificando configurações críticas:"
python manage.py shell -c "
import os
from django.conf import settings

print('ALLOWED_HOSTS:', settings.ALLOWED_HOSTS)
print('DEBUG:', settings.DEBUG)
print('SECRET_KEY definida:', bool(settings.SECRET_KEY))
print('DATABASE configurada:', bool(settings.DATABASES.get('default')))
print('CORS_ALLOWED_ORIGINS:', getattr(settings, 'CORS_ALLOWED_ORIGINS', 'Não definido'))
print('CSRF_TRUSTED_ORIGINS:', getattr(settings, 'CSRF_TRUSTED_ORIGINS', 'Não definido'))
"
echo ""

# 5. Verificar sincronização de relógio
echo "⏰ 5. SINCRONIZAÇÃO DE RELÓGIO"
echo "------------------------------"
echo "🕐 Status do relógio:"
timedatectl
echo ""

echo "🌐 Verificando NTP:"
systemctl status ntp --no-pager -l || systemctl status systemd-timesyncd --no-pager -l
echo ""

# 6. Testar endpoints diretamente
echo "🧪 6. TESTE DE ENDPOINTS"
echo "------------------------"
echo "🔍 Testando endpoint de login:"
curl -i -X POST http://127.0.0.1:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@veramo.com","password":"admin123"}' 2>/dev/null || echo "Erro no teste de login"
echo ""

echo "🔍 Testando endpoint de empresas:"
curl -i http://127.0.0.1:8000/api/companies/ 2>/dev/null || echo "Erro no teste de empresas"
echo ""

echo "🔍 Testando endpoint de demissão:"
curl -i http://127.0.0.1:8000/api/demissao-processes/ 2>/dev/null || echo "Erro no teste de demissão"
echo ""

# 7. Verificar configuração do Nginx
echo "🌐 7. CONFIGURAÇÃO DO NGINX"
echo "----------------------------"
echo "📄 Configuração atual:"
cat /etc/nginx/sites-available/veramo.conf 2>/dev/null || cat /etc/nginx/conf.d/veramo.conf 2>/dev/null || echo "Arquivo de configuração não encontrado"
echo ""

# 8. Verificar rotas disponíveis
echo "🛣️ 8. ROTAS DISPONÍVEIS"
echo "------------------------"
echo "📋 Listando todas as rotas:"
python manage.py show_urls | grep -E "(auth|api|demissao)" || echo "Erro ao listar rotas"
echo ""

# 9. Verificar permissões de arquivos
echo "🔐 9. PERMISSÕES DE ARQUIVOS"
echo "----------------------------"
echo "📁 Verificando permissões do projeto:"
ls -la /opt/veramo/
echo ""
ls -la /opt/veramo/veramo_backend/
echo ""

# 10. Verificar configuração do Gunicorn
echo "🚀 10. CONFIGURAÇÃO DO GUNICORN"
echo "-------------------------------"
echo "📄 Configuração do Gunicorn:"
cat /opt/veramo/veramo_backend/gunicorn.conf.py 2>/dev/null || echo "Arquivo de configuração não encontrado"
echo ""

echo "✅ DIAGNÓSTICO CONCLUÍDO!"
echo "📋 Verifique os logs acima para identificar problemas específicos."
echo "🔧 Execute os scripts de correção conforme necessário."
