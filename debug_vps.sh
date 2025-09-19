#!/bin/bash

# Script para debugar o que está acontecendo na VPS
# Execute na VPS como root

echo "🔍 Debugando sistema na VPS..."

# Verificar se estamos no diretório correto
echo "📁 Diretório atual:"
pwd

# Verificar estrutura de arquivos
echo "📂 Estrutura do projeto:"
ls -la /opt/veramo/

# Verificar se o frontend foi buildado
echo "⚛️ Frontend build:"
ls -la /opt/veramo/veramo_backend/frontend/dist/

# Verificar se o backend está rodando
echo "🐍 Backend status:"
systemctl status veramo-backend --no-pager -l

# Verificar se o frontend está rodando
echo "⚛️ Frontend status:"
systemctl status veramo-frontend --no-pager -l

# Verificar Nginx
echo "🌐 Nginx status:"
systemctl status nginx --no-pager -l

# Testar endpoints diretamente
echo "🧪 Testando endpoints:"
echo "Backend health:"
curl -s http://localhost:8000/health/ || echo "Backend não responde"

echo "Frontend:"
curl -s http://localhost:3000/ | head -20 || echo "Frontend não responde"

# Verificar configuração do Nginx
echo "🔧 Configuração Nginx:"
cat /etc/nginx/sites-available/veramo

# Verificar logs recentes
echo "📋 Logs recentes do backend:"
journalctl -u veramo-backend --no-pager -n 10

echo "📋 Logs recentes do frontend:"
journalctl -u veramo-frontend --no-pager -n 10

echo "📋 Logs recentes do Nginx:"
journalctl -u nginx --no-pager -n 10
