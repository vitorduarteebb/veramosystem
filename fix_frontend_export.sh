#!/bin/bash

# Script para corrigir problema de export no frontend
# Execute na VPS como root

echo "🔧 Corrigindo problema de export no frontend..."

# 1. Ir para o diretório do frontend
cd /opt/veramo/veramo_backend/frontend || { echo "Erro: Diretório não encontrado."; exit 1; }

# 2. Corrigir arquivo api.js
echo "🔧 Corrigindo arquivo api.js..."
cat > src/config/api.js << 'EOF'
// Configuração de URLs da API
const getApiBaseUrl = () => {
  // Em qualquer ambiente, preferir same-origin via Nginx proxy
  // Assim evitamos CORS e problemas de http/https
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

// URLs específicas
export const API_ENDPOINTS = {
  // Base URL
  BASE_URL: API_BASE_URL,

  // Autenticação
  LOGIN: `${API_BASE_URL}/auth/jwt/create/`,
  REFRESH: `${API_BASE_URL}/auth/jwt/refresh/`,
  USER_INFO: `${API_BASE_URL}/auth/users/me/`,
  CHANGE_PASSWORD: `${API_BASE_URL}/auth/users/set_password/`,

  // Empresas
  COMPANIES: `${API_BASE_URL}/api/companies/`,
  COMPANY_UNIONS: `${API_BASE_URL}/api/company-unions/`,

  // Processos de demissão
  DEMISSAO_PROCESSES: `${API_BASE_URL}/api/demissao-processes/`,

  // Agendamentos
  SCHEDULES: `${API_BASE_URL}/api/schedules/`,
  SCHEDULE_CONFIG: `${API_BASE_URL}/api/schedule-configs/`,

  // Usuários
  USERS: `${API_BASE_URL}/api/users/`,

  // Sindicatos
  UNIONS: `${API_BASE_URL}/api/unions/`,

  // Documentos
  DOCUMENTS: `${API_BASE_URL}/api/documents/`,

  // Logs
  LOGS: `${API_BASE_URL}/api/logs/`,

  // Assinatura Eletrônica
  SIGNING: `${API_BASE_URL}/api/signing/`,
};

console.log('🔧 Configuração API carregada:', {
  hostname: window.location.hostname,
  apiBase: API_BASE_URL,
  isLocal: window.location.hostname === 'localhost',
  porta: window.location.hostname === 'localhost' ? '8000' : '443'
});
EOF

# 3. Verificar se o arquivo foi criado corretamente
echo "✅ Verificando arquivo api.js..."
if [ -f "src/config/api.js" ]; then
    echo "Arquivo api.js criado com sucesso!"
    echo "Primeiras linhas:"
    head -5 src/config/api.js
else
    echo "❌ Erro: Arquivo api.js não foi criado"
    exit 1
fi

# 4. Fazer build do frontend
echo "🛠️ Fazendo build do frontend..."
npm run build

# 5. Verificar se o build foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "✅ Build bem-sucedido!"
    
    # 6. Verificar se o diretório dist foi criado
    if [ -d "dist" ]; then
        echo "✅ Diretório dist criado!"
        echo "Conteúdo do dist:"
        ls -la dist/
    else
        echo "❌ Erro: Diretório dist não foi criado"
        exit 1
    fi
else
    echo "❌ Erro: Build falhou"
    exit 1
fi

# 7. Reiniciar serviço frontend
echo "🔄 Reiniciando serviço frontend..."
systemctl restart veramo-frontend

# 8. Aguardar inicialização
sleep 10

# 9. Testar frontend
echo "🧪 Testando frontend..."
curl -s http://localhost:3000/ | head -5

echo -e "\n\n✅ Frontend corrigido!"
echo "🌐 Teste o login em: https://veramo.com.br"
echo "👤 Credenciais: admin@veramo.com / admin123"
