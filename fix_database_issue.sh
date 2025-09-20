#!/bin/bash

# Script para corrigir problema de DATABASE na VPS
# Execute na VPS como root

echo "🔧 Corrigindo problema de DATABASE..."

cd /opt/veramo/veramo_backend
source venv/bin/activate

# 1. Verificar manage.py
echo "📝 Verificando manage.py..."
cat manage.py

# 2. Verificar variáveis de ambiente
echo "🌍 Verificando variáveis de ambiente..."
echo "DJANGO_SETTINGS_MODULE: $DJANGO_SETTINGS_MODULE"
echo "PYTHONPATH: $PYTHONPATH"

# 3. Definir variáveis de ambiente explicitamente
echo "🔧 Definindo variáveis de ambiente..."
export DJANGO_SETTINGS_MODULE=veramo_backend.settings.prod
export PYTHONPATH=/opt/veramo/veramo_backend

# 4. Testar configuração novamente
echo "🧪 Testando configuração..."
python manage.py check

# 5. Executar migrações
echo "🗄️ Executando migrações..."
python manage.py migrate

# 6. Criar superuser
echo "👤 Criando superuser..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()

# Deletar usuário admin se existir
try:
    admin_user = User.objects.get(username='admin')
    admin_user.delete()
    print('Usuário admin antigo removido')
except User.DoesNotExist:
    print('Usuário admin não existia')

# Criar novo usuário admin
admin_user = User.objects.create_superuser(
    username='admin',
    email='admin@veramo.com',
    password='admin123'
)
print('Novo usuário admin criado!')
print(f'Username: {admin_user.username}')
print(f'Email: {admin_user.email}')
print(f'Password: admin123')
"

# 7. Coletar arquivos estáticos
echo "📁 Coletando arquivos estáticos..."
python manage.py collectstatic --noinput

# 8. Atualizar serviço systemd com variáveis de ambiente
echo "⚙️ Atualizando serviço systemd..."
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
ExecStart=/opt/veramo/veramo_backend/venv/bin/gunicorn veramo_backend.wsgi:application --bind 0.0.0.0:8000 --workers 3
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# 9. Recarregar systemd e reiniciar serviço
echo "🔄 Reiniciando serviço..."
systemctl daemon-reload
systemctl restart veramo-backend

# 10. Aguardar inicialização
sleep 10

# 11. Testar endpoint
echo "🧪 Testando endpoint..."
curl -X POST http://localhost:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@veramo.com", "password": "admin123"}' \
  -v

echo -e "\n\n✅ Problema de DATABASE corrigido!"
echo "🌐 Teste o login em: https://veramo.com.br"
echo "👤 Credenciais: admin@veramo.com / admin123"
