#!/bin/bash

# Script para corrigir problema do frontend
# Execute na VPS como root

echo "🔧 Corrigindo problema do frontend..."

# 1. Verificar diretório do frontend
echo "📁 Verificando diretório do frontend..."
cd /opt/veramo/veramo_backend/frontend || { echo "❌ Diretório não encontrado"; exit 1; }

# 2. Verificar se existe build
echo "🔍 Verificando build do frontend..."
if [ ! -d "dist" ]; then
    echo "❌ Diretório 'dist' não encontrado. Fazendo build..."
    
    # Instalar dependências
    echo "📦 Instalando dependências Node.js..."
    npm install
    
    # Fazer build
    echo "🛠️ Fazendo build do frontend..."
    npm run build
    
    if [ ! -d "dist" ]; then
        echo "❌ Erro: Build falhou!"
        exit 1
    fi
else
    echo "✅ Build encontrado!"
    ls -la dist/
fi

# 3. Verificar se serve está instalado
echo "🔍 Verificando se 'serve' está instalado..."
if ! command -v serve &> /dev/null; then
    echo "📦 Instalando 'serve' globalmente..."
    npm install -g serve
fi

# 4. Parar serviço frontend se estiver rodando
echo "⏹️ Parando serviço frontend..."
systemctl stop veramo-frontend || true

# 5. Atualizar serviço systemd do frontend
echo "⚙️ Atualizando serviço systemd do frontend..."
cat > /etc/systemd/system/veramo-frontend.service << 'EOF'
[Unit]
Description=Veramo Frontend React
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/opt/veramo/veramo_backend/frontend
ExecStart=/usr/bin/serve -s dist -l 3000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# 6. Recarregar systemd e iniciar serviço
echo "🔄 Iniciando serviço frontend..."
systemctl daemon-reload
systemctl enable veramo-frontend
systemctl start veramo-frontend

# 7. Aguardar inicialização
sleep 10

# 8. Verificar status
echo "📊 Status do serviço frontend:"
systemctl status veramo-frontend --no-pager -l

# 9. Testar conectividade
echo "🧪 Testando conectividade do frontend..."
curl -s http://localhost:3000/ | head -5

# 10. Verificar portas
echo "🌐 Portas em uso:"
netstat -tlnp | grep -E ':(3000|8000|80|443)'

echo -e "\n✅ Frontend corrigido!"
echo "🌐 Teste o site: https://veramo.com.br"
