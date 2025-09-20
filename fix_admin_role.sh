#!/bin/bash

# Script para corrigir role do usuário admin
# Execute na VPS como root

echo "🔧 Corrigindo role do usuário admin..."

# 1. Ir para o diretório do backend
cd /opt/veramo/veramo_backend || { echo "Erro: Diretório não encontrado."; exit 1; }

# 2. Ativar ambiente virtual
source venv/bin/activate

# 3. Verificar usuário atual
echo "👤 Verificando usuário admin atual..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
try:
    admin_user = User.objects.get(username='admin')
    print(f'Usuário admin encontrado:')
    print(f'  - ID: {admin_user.id}')
    print(f'  - Username: {admin_user.username}')
    print(f'  - Email: {admin_user.email}')
    print(f'  - Is active: {admin_user.is_active}')
    print(f'  - Is superuser: {admin_user.is_superuser}')
    print(f'  - Is staff: {admin_user.is_staff}')
except User.DoesNotExist:
    print('Usuário admin não encontrado.')
"

# 4. Corrigir role do usuário admin
echo "🔧 Corrigindo role do usuário admin..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()

# Buscar usuário admin
try:
    admin_user = User.objects.get(username='admin')
    
    # Definir como superuser e staff
    admin_user.is_superuser = True
    admin_user.is_staff = True
    admin_user.is_active = True
    admin_user.save()
    
    print('✅ Usuário admin corrigido!')
    print(f'  - Username: {admin_user.username}')
    print(f'  - Email: {admin_user.email}')
    print(f'  - Is superuser: {admin_user.is_superuser}')
    print(f'  - Is staff: {admin_user.is_staff}')
    print(f'  - Is active: {admin_user.is_active}')
    
except User.DoesNotExist:
    print('❌ Usuário admin não encontrado.')
"

# 5. Verificar se a correção funcionou
echo "✅ Verificando se a correção funcionou..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
try:
    admin_user = User.objects.get(username='admin')
    print(f'Verificação final:')
    print(f'  - Is superuser: {admin_user.is_superuser}')
    print(f'  - Is staff: {admin_user.is_staff}')
    print(f'  - Is active: {admin_user.is_active}')
    
    if admin_user.is_superuser and admin_user.is_staff and admin_user.is_active:
        print('✅ Usuário admin está correto!')
    else:
        print('❌ Usuário admin ainda tem problemas.')
except User.DoesNotExist:
    print('❌ Usuário admin não encontrado.')
"

# 6. Reiniciar backend
echo "🔄 Reiniciando backend..."
systemctl restart veramo-backend

# 7. Aguardar inicialização
sleep 10

# 8. Testar login
echo "🧪 Testando login..."
curl -X POST http://localhost:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@veramo.com", "password": "admin123"}'

echo -e "\n\n✅ Role do usuário admin corrigida!"
echo "🌐 Teste o login em: https://veramo.com.br"
echo "👤 Credenciais: admin@veramo.com / admin123"
