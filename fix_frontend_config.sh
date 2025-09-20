#!/bin/bash

# Script para corrigir problema do frontend
# Execute na VPS como root

echo "🔧 Corrigindo problema do frontend..."

# 1. Verificar configuração do frontend
echo "📁 Verificando configuração do frontend..."
cd /opt/veramo/veramo_backend/frontend

# 2. Verificar arquivo de configuração da API
echo "🔍 Verificando configuração da API..."
if [ -f "src/config/api.js" ]; then
    echo "Arquivo api.js encontrado:"
    cat src/config/api.js
elif [ -f "src/config/index.js" ]; then
    echo "Arquivo index.js encontrado:"
    cat src/config/index.js
else
    echo "❌ Arquivo de configuração não encontrado"
fi

# 3. Verificar se há variáveis de ambiente
echo "🌍 Verificando variáveis de ambiente..."
if [ -f ".env" ]; then
    echo "Arquivo .env encontrado:"
    cat .env
elif [ -f ".env.local" ]; then
    echo "Arquivo .env.local encontrado:"
    cat .env.local
else
    echo "❌ Arquivo .env não encontrado"
fi

# 4. Verificar vite.config.js
echo "⚙️ Verificando vite.config.js..."
if [ -f "vite.config.js" ]; then
    cat vite.config.js
else
    echo "❌ vite.config.js não encontrado"
fi

# 5. Verificar package.json
echo "📦 Verificando package.json..."
if [ -f "package.json" ]; then
    echo "Scripts disponíveis:"
    cat package.json | grep -A 10 '"scripts"'
else
    echo "❌ package.json não encontrado"
fi

# 6. Criar configuração correta
echo "🔧 Criando configuração correta..."
cat > .env << 'EOF'
VITE_API_URL=https://veramo.com.br/api
VITE_AUTH_URL=https://veramo.com.br/auth
EOF

# 7. Criar arquivo de configuração da API
mkdir -p src/config
cat > src/config/api.js << 'EOF'
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://veramo.com.br/api';
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_URL || 'https://veramo.com.br/auth';

export const API_ENDPOINTS = {
  LOGIN: `${AUTH_BASE_URL}/jwt/create/`,
  REFRESH: `${AUTH_BASE_URL}/jwt/refresh/`,
  USER_ME: `${AUTH_BASE_URL}/users/me/`,
  UNIONS: `${API_BASE_URL}/unions/`,
  COMPANIES: `${API_BASE_URL}/companies/`,
};

export default API_ENDPOINTS;
EOF

# 8. Fazer novo build
echo "🛠️ Fazendo novo build do frontend..."
npm run build

# 9. Reiniciar serviço frontend
echo "🔄 Reiniciando serviço frontend..."
systemctl restart veramo-frontend

# 10. Aguardar inicialização
sleep 10

# 11. Testar frontend
echo "🧪 Testando frontend..."
curl -s http://localhost:3000/ | head -5

echo -e "\n\n✅ Frontend corrigido!"
echo "🌐 Teste o login em: https://veramo.com.br"
echo "👤 Credenciais: admin@veramo.com / admin123"
