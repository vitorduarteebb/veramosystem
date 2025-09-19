#!/bin/bash

# Script para debugar logs do serviço na VPS
# Execute na VPS como root

echo "🔍 Debugando logs do serviço..."

# 1. Ver logs detalhados do serviço
echo "📋 Logs detalhados do veramo-backend:"
journalctl -u veramo-backend -n 50 --no-pager

echo -e "\n\n🔍 Logs do sistema (últimas 20 linhas):"
journalctl -n 20 --no-pager

# 2. Verificar se há processos Python rodando
echo -e "\n\n🐍 Processos Python:"
ps aux | grep python

# 3. Verificar se há processos na porta 8000
echo -e "\n\n🌐 Processos na porta 8000:"
netstat -tlnp | grep :8000

# 4. Tentar executar Django manualmente para ver erro
echo -e "\n\n🧪 Testando Django manualmente:"
cd /opt/veramo/veramo_backend
source venv/bin/activate
python manage.py check --verbosity=2

# 5. Tentar executar Gunicorn manualmente
echo -e "\n\n🚀 Testando Gunicorn manualmente:"
cd /opt/veramo/veramo_backend
source venv/bin/activate
timeout 10 /opt/veramo/veramo_backend/venv/bin/gunicorn veramo_backend.wsgi:application --bind 0.0.0.0:8000 --workers 1 --timeout 30 || echo "Gunicorn falhou ou timeout"

echo -e "\n\n✅ Debug concluído!"
