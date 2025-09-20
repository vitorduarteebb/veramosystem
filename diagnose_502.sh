#!/bin/bash

# Script para diagnosticar problema 502 Bad Gateway
# Execute na VPS como root

echo "🔍 Diagnosticando problema 502 Bad Gateway..."

# 1. Verificar status dos serviços
echo "📊 Status dos serviços:"
echo "Backend:"
systemctl status veramo-backend --no-pager -l
echo -e "\nFrontend:"
systemctl status veramo-frontend --no-pager -l
echo -e "\nNginx:"
systemctl status nginx --no-pager -l

# 2. Verificar portas
echo -e "\n🌐 Portas em uso:"
netstat -tlnp | grep -E ':(3000|8000|80|443)'

# 3. Testar conectividade local
echo -e "\n🧪 Testando conectividade local:"
echo "Backend (localhost:8000):"
curl -s http://localhost:8000/health/ || echo "❌ Backend não responde"
echo -e "\nFrontend (localhost:3000):"
curl -s http://localhost:3000/ | head -5 || echo "❌ Frontend não responde"

# 4. Verificar logs do Nginx
echo -e "\n📋 Logs recentes do Nginx:"
journalctl -u nginx -n 20 --no-pager

# 5. Verificar configuração do Nginx
echo -e "\n⚙️ Configuração do Nginx:"
cat /etc/nginx/sites-enabled/veramo

# 6. Testar configuração do Nginx
echo -e "\n🧪 Testando configuração do Nginx:"
nginx -t

# 7. Verificar se os serviços estão rodando nas portas corretas
echo -e "\n🔍 Verificando processos:"
ps aux | grep -E '(gunicorn|serve|nginx)' | grep -v grep

echo -e "\n✅ Diagnóstico concluído!"
