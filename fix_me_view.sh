#!/bin/bash

# Script para corrigir view MeWithRoleView
# Execute na VPS como root

echo "🔧 Corrigindo view MeWithRoleView..."

# 1. Ir para o diretório do backend
cd /opt/veramo/veramo_backend || { echo "Erro: Diretório não encontrado."; exit 1; }

# 2. Ativar ambiente virtual
source venv/bin/activate

# 3. Corrigir arquivo auth_me_view.py
echo "🔧 Corrigindo arquivo auth_me_view.py..."
cat > veramo_backend/auth_me_view.py << 'EOF'
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from veramo_backend.simple_store import union_to_user_ids

class MeWithRoleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Determinar union_id
        union_id = None
        for u, ids in union_to_user_ids.items():
            if user.id in ids:
                union_id = u
                break

        # Determinar role baseado nas permissões do usuário
        if getattr(user, "is_superuser", False):
            role = "superadmin"
        elif getattr(user, "is_staff", False):
            role = "admin"
        elif union_id is not None:
            role = "sindicato"
        else:
            role = "user"

        return Response({
            "id": user.id,
            "email": getattr(user, "email", ""),
            "username": getattr(user, "username", ""),
            "role": role,
            "unionId": union_id,
            "first_name": getattr(user, "first_name", ""),
            "last_name": getattr(user, "last_name", ""),
            "is_superuser": getattr(user, "is_superuser", False),
            "is_staff": getattr(user, "is_staff", False),
            "is_active": getattr(user, "is_active", False),
        })
EOF

# 4. Verificar se o arquivo foi criado
echo "✅ Verificando arquivo auth_me_view.py..."
if [ -f "veramo_backend/auth_me_view.py" ]; then
    echo "Arquivo auth_me_view.py criado com sucesso!"
    echo "Primeiras linhas:"
    head -10 veramo_backend/auth_me_view.py
else
    echo "❌ Erro: Arquivo auth_me_view.py não foi criado"
    exit 1
fi

# 5. Reiniciar backend
echo "🔄 Reiniciando backend..."
systemctl restart veramo-backend

# 6. Aguardar inicialização
sleep 10

# 7. Testar endpoint /auth/users/me/
echo "🧪 Testando endpoint /auth/users/me/..."
# Primeiro fazer login para obter token
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@veramo.com", "password": "admin123"}')

echo "Resposta do login:"
echo $LOGIN_RESPONSE

# Extrair token de acesso
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ACCESS_TOKEN" ]; then
    echo "Token obtido: ${ACCESS_TOKEN:0:50}..."
    
    # Testar endpoint /auth/users/me/
    echo "Testando /auth/users/me/:"
    curl -s -X GET http://localhost:8000/auth/users/me/ \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json"
else
    echo "❌ Erro: Não foi possível obter token de acesso"
fi

echo -e "\n\n✅ View MeWithRoleView corrigida!"
echo "🌐 Teste o login em: https://veramo.com.br"
echo "👤 Credenciais: admin@veramo.com / admin123"
