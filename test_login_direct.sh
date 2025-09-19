#!/bin/bash

# Script para testar login diretamente na VPS
# Execute na VPS como root

echo "🧪 Testando login diretamente..."

cd /opt/veramo/veramo_backend
source venv/bin/activate

# 1. Verificar se o usuário admin existe
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
    print(f'  - Password hash: {admin_user.password[:50]}...')
except User.DoesNotExist:
    print('Usuário admin não encontrado!')
"

# 2. Testar autenticação manual
echo "🔐 Testando autenticação manual..."
python manage.py shell -c "
from django.contrib.auth import authenticate, get_user_model
User = get_user_model()

# Testar com username
user1 = authenticate(username='admin', password='admin123')
print(f'Auth com username: {user1}')

# Testar com email
user2 = authenticate(username='admin@veramo.com', password='admin123')
print(f'Auth com email: {user2}')

# Verificar se existe usuário com email
try:
    user_by_email = User.objects.get(email='admin@veramo.com')
    print(f'Usuário encontrado por email: {user_by_email.username}')
except User.DoesNotExist:
    print('Nenhum usuário encontrado com email admin@veramo.com')
"

# 3. Testar endpoint diretamente
echo "🌐 Testando endpoint diretamente..."
curl -X POST http://localhost:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@veramo.com", "password": "admin123"}' \
  -v

echo -e "\n\n🧪 Testando com username..."
curl -X POST http://localhost:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' \
  -v

echo -e "\n\n✅ Teste concluído!"
