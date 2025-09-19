#!/bin/bash

# Script para corrigir o frontend na VPS
# Execute na VPS como root

echo "🔧 Corrigindo frontend na VPS..."

cd /opt/veramo/veramo_backend/frontend

# Verificar se o build existe
echo "📂 Verificando build atual:"
ls -la dist/

# Se não existe ou está vazio, fazer build
if [ ! -d "dist" ] || [ -z "$(ls -A dist/)" ]; then
    echo "⚛️ Fazendo build do frontend..."
    npm install
    npm run build
else
    echo "✅ Build já existe"
fi

# Verificar se o index.html está correto
echo "📄 Verificando index.html:"
head -20 dist/index.html

# Verificar se serve está instalado
echo "🌐 Verificando serve:"
which serve || npm install -g serve

# Parar serviços
echo "⏹️ Parando serviços..."
systemctl stop veramo-frontend

# Testar serve localmente
echo "🧪 Testando serve localmente..."
cd dist
timeout 5s serve -s . -l 3000 &
SERVE_PID=$!
sleep 2

# Testar se está funcionando
echo "🔍 Testando resposta:"
curl -s http://localhost:3000/ | head -10

# Parar teste
kill $SERVE_PID 2>/dev/null

# Reiniciar serviço
echo "🔄 Reiniciando serviço frontend..."
systemctl start veramo-frontend
systemctl status veramo-frontend --no-pager -l

# Testar endpoint final
echo "🌐 Testando endpoint final:"
sleep 3
curl -s http://localhost:3000/ | head -10

echo "✅ Frontend corrigido!"
echo "🌐 Acesse: https://veramo.com.br"
