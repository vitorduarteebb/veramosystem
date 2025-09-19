#!/bin/bash

# Script para corrigir problema de login na VPS
# Execute na VPS como root

echo "🔧 Corrigindo problema de login..."

cd /opt/veramo/veramo_backend
source venv/bin/activate

# Verificar se o usuário admin existe
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
    print('Usuário admin não encontrado!')
"

# Recriar usuário admin com senha correta
echo "🔄 Recriando usuário admin..."
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
print('Novo usuário admin criado:')
print(f'  - Username: {admin_user.username}')
print(f'  - Email: {admin_user.email}')
print(f'  - Password: admin123')
"

# Verificar se o login funciona
echo "🧪 Testando login via API..."
curl -X POST http://localhost:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@veramo.com", "password": "admin123"}' \
  || echo "Erro no teste de login"

# Reiniciar backend
echo "🔄 Reiniciando backend..."
systemctl restart veramo-backend

# Verificar status
echo "🔍 Verificando status do backend..."
systemctl status veramo-backend --no-pager -l

echo "✅ Correção de login finalizada!"
echo "🌐 Teste o login em: https://veramo.com.br"
echo "👤 Credenciais: admin@veramo.com / admin123"
