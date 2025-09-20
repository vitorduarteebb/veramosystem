#!/bin/bash

# Script para diagnosticar problema de login
# Execute na VPS como root

echo "🔍 Diagnosticando problema de login..."

# 1. Testar login diretamente no backend
echo "🧪 Testando login diretamente no backend (localhost:8000):"
curl -X POST http://localhost:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@veramo.com", "password": "admin123"}' \
  -v

echo -e "\n\n"

# 2. Testar login via Nginx (HTTPS)
echo "🧪 Testando login via Nginx (https://veramo.com.br):"
curl -X POST https://veramo.com.br/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@veramo.com", "password": "admin123"}' \
  -v

echo -e "\n\n"

# 3. Verificar logs do backend
echo "📋 Logs recentes do backend:"
journalctl -u veramo-backend -n 20 --no-pager

echo -e "\n\n"

# 4. Verificar logs do Nginx
echo "📋 Logs recentes do Nginx:"
journalctl -u nginx -n 20 --no-pager

echo -e "\n\n"

# 5. Verificar se o usuário existe no banco
echo "👤 Verificando usuário no banco de dados:"
cd /opt/veramo/veramo_backend
source venv/bin/activate
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
try:
    user = User.objects.get(email='admin@veramo.com')
    print(f'Usuário encontrado:')
    print(f'  - ID: {user.id}')
    print(f'  - Username: {user.username}')
    print(f'  - Email: {user.email}')
    print(f'  - Is active: {user.is_active}')
    print(f'  - Is superuser: {user.is_superuser}')
    print(f'  - Is staff: {user.is_staff}')
except User.DoesNotExist:
    print('❌ Usuário admin@veramo.com não encontrado!')
"

echo -e "\n\n"

# 6. Testar autenticação manual
echo "🔐 Testando autenticação manual:"
python manage.py shell -c "
from django.contrib.auth import authenticate, get_user_model
User = get_user_model()

# Testar autenticação
user = authenticate(username='admin', password='admin123')
if user:
    print(f'✅ Autenticação bem-sucedida: {user.email}')
else:
    print('❌ Falha na autenticação')

# Testar com email
try:
    user_obj = User.objects.get(email='admin@veramo.com')
    user = authenticate(username=user_obj.username, password='admin123')
    if user:
        print(f'✅ Autenticação com email bem-sucedida: {user.email}')
    else:
        print('❌ Falha na autenticação com email')
except User.DoesNotExist:
    print('❌ Usuário não encontrado')
"

echo -e "\n\n✅ Diagnóstico de login concluído!"
