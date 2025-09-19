#!/bin/bash

# Script para debugar problema de login na VPS
# Execute na VPS como root

echo "🔍 Debugando problema de login..."

cd /opt/veramo/veramo_backend
source venv/bin/activate

# 1. Verificar usuário admin
echo "👤 Verificando usuário admin..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
try:
    admin_user = User.objects.get(username='admin')
    print(f'Usuário admin:')
    print(f'  - Username: {admin_user.username}')
    print(f'  - Email: {admin_user.email}')
    print(f'  - Is active: {admin_user.is_active}')
    print(f'  - Is superuser: {admin_user.is_superuser}')
    print(f'  - Is staff: {admin_user.is_staff}')
    
    # Testar autenticação
    from django.contrib.auth import authenticate
    auth_user = authenticate(username='admin', password='admin123')
    if auth_user:
        print(f'  - Autenticação OK: {auth_user.username}')
    else:
        print(f'  - Autenticação FALHOU!')
        
except User.DoesNotExist:
    print('Usuário admin não encontrado!')
"

# 2. Testar endpoint de login diretamente
echo "🧪 Testando endpoint de login..."
echo "Teste 1 - Com email:"
curl -X POST http://localhost:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@veramo.com", "password": "admin123"}' \
  -v

echo -e "\n\nTeste 2 - Com username:"
curl -X POST http://localhost:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' \
  -v

# 3. Verificar configuração do Djoser
echo -e "\n\n🔧 Verificando configuração Djoser..."
python manage.py shell -c "
from django.conf import settings
print('DJOSER config:')
if hasattr(settings, 'DJOSER'):
    print(f'  DJOSER: {settings.DJOSER}')
else:
    print('  DJOSER não configurado')

print('REST_FRAMEWORK config:')
if hasattr(settings, 'REST_FRAMEWORK'):
    print(f'  REST_FRAMEWORK: {settings.REST_FRAMEWORK}')
else:
    print('  REST_FRAMEWORK não configurado')
"

# 4. Verificar URLs
echo -e "\n\n🌐 Verificando URLs..."
python manage.py shell -c "
from django.urls import reverse
try:
    url = reverse('jwt-create')
    print(f'URL jwt-create: {url}')
except:
    print('URL jwt-create não encontrada')

try:
    url = reverse('auth-me')
    print(f'URL auth-me: {url}')
except:
    print('URL auth-me não encontrada')
"

# 5. Verificar logs do backend
echo -e "\n\n📋 Logs recentes do backend:"
journalctl -u veramo-backend -n 20 --no-pager

echo -e "\n\n✅ Debug concluído!"
