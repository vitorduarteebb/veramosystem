#!/bin/bash

# Script para corrigir problema de porta do backend
# Execute na VPS como root

echo "🔧 Corrigindo problema de porta do backend..."

cd /opt/veramo/veramo_backend
source venv/bin/activate

# 1. Parar o serviço atual
systemctl stop veramo-backend

# 2. Verificar se há processos na porta 8000
echo "🔍 Verificando processos na porta 8000..."
lsof -i :8000 || echo "Nenhum processo na porta 8000"

# 3. Testar se o Django funciona diretamente
echo "🧪 Testando Django diretamente..."
python manage.py check

# 4. Testar se o Gunicorn funciona
echo "🧪 Testando Gunicorn..."
/opt/veramo/veramo_backend/venv/bin/gunicorn veramo_backend.wsgi:application --bind 0.0.0.0:8000 --workers 1 --timeout 30 &
GUNICORN_PID=$!

# Aguardar um pouco
sleep 5

# Testar se está funcionando
echo "🧪 Testando endpoint..."
curl -X POST http://localhost:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@veramo.com", "password": "admin123"}' \
  -v

# Parar o Gunicorn de teste
kill $GUNICORN_PID

# 5. Corrigir o serviço systemd com configuração mais simples
echo "⚙️ Corrigindo serviço systemd..."
cat > /etc/systemd/system/veramo-backend.service << 'EOF'
[Unit]
Description=Veramo Backend Django
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/opt/veramo/veramo_backend
Environment=PYTHONPATH=/opt/veramo/veramo_backend
Environment=DJANGO_SETTINGS_MODULE=veramo_backend.settings.prod
ExecStart=/opt/veramo/veramo_backend/venv/bin/gunicorn veramo_backend.wsgi:application --bind 0.0.0.0:8000 --workers 1 --timeout 30
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# 6. Recarregar e iniciar
systemctl daemon-reload
systemctl enable veramo-backend
systemctl start veramo-backend

# 7. Aguardar inicialização
sleep 10

# 8. Verificar status
echo "📋 Status do backend:"
systemctl status veramo-backend --no-pager -l

# 9. Testar endpoint
echo "🧪 Testando endpoint final..."
curl -X POST http://localhost:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@veramo.com", "password": "admin123"}' \
  -v

echo -e "\n\n✅ Correção de porta finalizada!"
echo "🌐 Teste o login em: https://veramo.com.br"
echo "👤 Credenciais: admin@veramo.com / admin123"
