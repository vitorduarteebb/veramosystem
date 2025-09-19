#!/bin/bash

# Script para criar todos os arquivos necessários na VPS
# Execute na VPS como root

echo "🔧 Criando arquivos necessários..."

cd /opt/veramo/veramo_backend
source venv/bin/activate

# 1. Parar o serviço
systemctl stop veramo-backend

# 2. Criar auth_me_view.py
echo "📝 Criando auth_me_view.py..."
cat > veramo_backend/auth_me_view.py << 'EOF'
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from veramo_backend.simple_store import union_to_user_ids

class MeWithRoleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        union_id = None
        for u, ids in union_to_user_ids.items():
            if user.id in ids:
                union_id = u
                break

        if union_id is not None:
            role = "sindicato"
        elif getattr(user, "is_superuser", False):
            role = "superadmin"
        elif getattr(user, "is_staff", False):
            role = "admin"
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
        })
EOF

# 3. Criar simple_store.py
echo "📝 Criando simple_store.py..."
cat > veramo_backend/simple_store.py << 'EOF'
from typing import List, Dict
from threading import Lock

class InMemoryStore:
    def __init__(self):
        self._data: List[Dict] = []
        self._next_id = 1
        self._lock = Lock()

    def list_all(self):
        with self._lock:
            return list(self._data)

    def create(self, obj: Dict):
        with self._lock:
            obj = dict(obj)
            obj['id'] = self._next_id
            self._next_id += 1
            self._data.append(obj)
            return obj

    def update(self, obj_id: int, updates: Dict):
        with self._lock:
            for item in self._data:
                if item['id'] == obj_id:
                    item.update(updates)
                    return item
            return None

    def delete(self, obj_id: int):
        with self._lock:
            for i, item in enumerate(self._data):
                if item['id'] == obj_id:
                    self._data.pop(i)
                    return True
            return False

unions_store = InMemoryStore()
companies_store = InMemoryStore()
union_to_user_ids = {}
EOF

# 4. Criar api_views.py
echo "📝 Criando api_views.py..."
cat > veramo_backend/api_views.py << 'EOF'
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .simple_store import unions_store, companies_store

class UnionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(unions_store.list_all())

    def post(self, request):
        data = request.data or {}
        created = unions_store.create(data)
        return Response(created, status=status.HTTP_201_CREATED)

class CompaniesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(companies_store.list_all())

    def post(self, request):
        data = request.data or {}
        created = companies_store.create(data)
        return Response(created, status=status.HTTP_201_CREATED)
EOF

# 5. Criar api_detail_views.py
echo "📝 Criando api_detail_views.py..."
cat > veramo_backend/api_detail_views.py << 'EOF'
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .simple_store import unions_store, companies_store

class UnionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk: int):
        items = unions_store.list_all()
        for it in items:
            if it.get('id') == int(pk):
                return Response(it)
        return Response({"detail":"Not found"}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk: int):
        updated = unions_store.update(int(pk), request.data or {})
        if not updated:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(updated)

    def delete(self, request, pk: int):
        ok = unions_store.delete(int(pk))
        if not ok:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

class CompanyDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk: int):
        updated = companies_store.update(int(pk), request.data or {})
        if not updated:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(updated)

    def delete(self, request, pk: int):
        ok = companies_store.delete(int(pk))
        if not ok:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
EOF

# 6. Criar api_extra_views.py
echo "📝 Criando api_extra_views.py..."
cat > veramo_backend/api_extra_views.py << 'EOF'
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class SchedulesView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response([])

class UsersByUnionView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response([])

class CompanyUnionsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response([])
EOF

# 7. Criar api_users_view.py
echo "📝 Criando api_users_view.py..."
cat > veramo_backend/api_users_view.py << 'EOF'
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .simple_store import union_to_user_ids

User = get_user_model()

class UsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        union = request.query_params.get('union')
        if union and union in union_to_user_ids:
            ids = union_to_user_ids[union]
            qs = User.objects.filter(id__in=ids).order_by('id')
        else:
            qs = User.objects.none()
        data = [
            {
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'is_active': u.is_active,
            } for u in qs
        ]
        return Response(data)

    def post(self, request):
        data = request.data or {}
        union = str(data.get('union') or request.query_params.get('union') or '').strip()
        username = (data.get('username') or data.get('email') or '').strip()
        email = (data.get('email') or '').strip()
        password = (data.get('password') or data.get('user_password') or '').strip()

        errors = {}
        if not username: errors['username'] = ['Obrigatório']
        if not email: errors['email'] = ['Obrigatório']
        if not password: errors['password'] = ['Obrigatório']
        if not union: errors['union'] = ['Obrigatório']
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'username': ['Já existe.']}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=email).exists():
            return Response({'email': ['Já existe.']}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, email=email, password=password)
        user.is_active = True
        user.save()

        union_to_user_ids.setdefault(union, []).append(user.id)

        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_active': user.is_active,
            'union': union,
        }, status=status.HTTP_201_CREATED)
EOF

# 8. Testar Django
echo "🧪 Testando Django..."
python manage.py check

# 9. Reiniciar serviço
echo "🔄 Reiniciando serviço..."
systemctl start veramo-backend

# 10. Aguardar e testar
sleep 10

echo "🧪 Testando endpoint..."
curl -X POST http://localhost:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@veramo.com", "password": "admin123"}' \
  -v

echo -e "\n\n✅ Arquivos criados e sistema corrigido!"
echo "🌐 Teste o login em: https://veramo.com.br"
echo "👤 Credenciais: admin@veramo.com / admin123"
