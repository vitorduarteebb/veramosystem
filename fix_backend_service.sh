#!/bin/bash

# Script para corrigir o serviço backend na VPS
# Execute na VPS como root

echo "🔧 Corrigindo serviço backend..."

# 1. Parar o serviço atual
systemctl stop veramo-backend

# 2. Verificar status
echo "📋 Status atual do backend:"
systemctl status veramo-backend --no-pager -l

# 3. Corrigir o serviço systemd
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
ExecStart=/opt/veramo/veramo_backend/venv/bin/gunicorn veramo_backend.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# 4. Recarregar systemd
systemctl daemon-reload

# 5. Iniciar o serviço
echo "🚀 Iniciando backend..."
systemctl start veramo-backend

# 6. Aguardar inicialização
sleep 5

# 7. Verificar status
echo "📋 Status do backend após correção:"
systemctl status veramo-backend --no-pager -l

# 8. Testar endpoint
echo "🧪 Testando endpoint de login..."
curl -X POST http://localhost:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@veramo.com", "password": "admin123"}' \
  -v

echo -e "\n\n✅ Correção do backend finalizada!"
echo "🌐 Teste o login em: https://veramo.com.br"
echo "👤 Credenciais: admin@veramo.com / admin123"
