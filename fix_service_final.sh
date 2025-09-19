#!/bin/bash

# Script para corrigir serviço systemd na VPS
# Execute na VPS como root

echo "🔧 Corrigindo serviço systemd..."

cd /opt/veramo/veramo_backend
source venv/bin/activate

# 1. Parar serviço
systemctl stop veramo-backend

# 2. Verificar se o usuário admin existe
echo "👤 Verificando usuário admin..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
try:
    admin_user = User.objects.get(username='admin')
    print(f'Usuário admin encontrado:')
    print(f'  - Username: {admin_user.username}')
    print(f'  - Email: {admin_user.email}')
    print(f'  - Is active: {admin_user.is_active}')
    print(f'  - Is superuser: {admin_user.is_superuser}')
    print(f'  - Is staff: {admin_user.is_staff}')
except User.DoesNotExist:
    print('Usuário admin não encontrado. Criando...')
    admin_user = User.objects.create_superuser(
        username='admin',
        email='admin@veramo.com',
        password='admin123'
    )
    print('Usuário admin criado!')
"

# 3. Corrigir serviço systemd
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
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# 4. Recarregar systemd
systemctl daemon-reload

# 5. Iniciar serviço
systemctl start veramo-backend

# 6. Aguardar inicialização
sleep 10

# 7. Verificar status
echo "📋 Status do serviço:"
systemctl status veramo-backend

# 8. Testar endpoint
echo "🧪 Testando endpoint..."
curl -X POST http://localhost:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@veramo.com", "password": "admin123"}' \
  -v

echo -e "\n\n✅ Serviço corrigido!"
echo "🌐 Teste o login em: https://veramo.com.br"
echo "👤 Credenciais: admin@veramo.com / admin123"
