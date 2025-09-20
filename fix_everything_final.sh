#!/bin/bash

# Script FINAL para corrigir TUDO de uma vez
# Execute na VPS como root

echo "🔧 CORREÇÃO FINAL - Corrigindo TUDO de uma vez..."

# 1. Ir para o diretório do backend
cd /opt/veramo/veramo_backend || { echo "Erro: Diretório não encontrado."; exit 1; }

# 2. Ativar ambiente virtual
source venv/bin/activate

# 3. Criar arquivo simple_store.py
echo "🔧 Criando arquivo simple_store.py..."
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

# 4. Criar arquivo auth_simple.py
echo "🔧 Criando arquivo auth_simple.py..."
cat > veramo_backend/auth_simple.py << 'EOF'
from django.contrib.auth import authenticate, get_user_model
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
import json

User = get_user_model()

@method_decorator(csrf_exempt, name="dispatch")
class SimpleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # Tentar obter dados do JSON
            if hasattr(request, 'data'):
                email = request.data.get("email")
                username = request.data.get("username")
                password = request.data.get("password")
            else:
                # Fallback para dados brutos
                body = request.body.decode('utf-8')
                data = json.loads(body)
                email = data.get("email")
                username = data.get("username")
                password = data.get("password")

            if not password:
                return Response({"password": ["Este campo é obrigatório."]}, status=status.HTTP_400_BAD_REQUEST)

            # Se email foi fornecido, buscar username
            if email and not username:
                try:
                    user = User.objects.get(email=email)
                    username = user.username
                except User.DoesNotExist:
                    return Response({"email": ["Usuário não encontrado."]}, status=status.HTTP_400_BAD_REQUEST)

            if not username:
                return Response({"username": ["Este campo é obrigatório."]}, status=status.HTTP_400_BAD_REQUEST)

            # Autenticar usuário
            user = authenticate(request, username=username, password=password)
            if not user or not user.is_active:
                return Response({"detail": "Credenciais inválidas."}, status=status.HTTP_400_BAD_REQUEST)

            # Gerar tokens JWT
            refresh = RefreshToken.for_user(user)
            return Response({
                "refresh": str(refresh), 
                "access": str(refresh.access_token),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                }
            })
            
        except Exception as e:
            return Response({"detail": f"Erro interno: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
EOF

# 5. Criar arquivo auth_me_view.py
echo "🔧 Criando arquivo auth_me_view.py..."
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

# 6. Criar arquivos de API básicos
echo "🔧 Criando arquivos de API básicos..."

# api_views.py
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

# api_detail_views.py
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
        return Response({"detail":"Not found"}, status=status.HTTP_400_NOT_FOUND)

    def put(self, request, pk: int):
        updated = unions_store.update(int(pk), request.data or {})
        if not updated:
            return Response({"detail": "Not found"}, status=status.HTTP_400_NOT_FOUND)
        return Response(updated)

    def delete(self, request, pk: int):
        ok = unions_store.delete(int(pk))
        if not ok:
            return Response({"detail": "Not found"}, status=status.HTTP_400_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

class CompanyDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk: int):
        updated = companies_store.update(int(pk), request.data or {})
        if not updated:
            return Response({"detail": "Not found"}, status=status.HTTP_400_NOT_FOUND)
        return Response(updated)

    def delete(self, request, pk: int):
        ok = companies_store.delete(int(pk))
        if not ok:
            return Response({"detail": "Not found"}, status=status.HTTP_400_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
EOF

# api_extra_views.py
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

# api_users_view.py
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

# 7. Criar URLs corretas
echo "🔧 Criando URLs corretas..."
cat > veramo_backend/urls/__init__.py << 'EOF'
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from veramo_backend.auth_simple import SimpleLoginView
from veramo_backend.auth_me_view import MeWithRoleView
from veramo_backend.api_views import UnionsView, CompaniesView
from veramo_backend.api_detail_views import UnionDetailView, CompanyDetailView
from veramo_backend.api_extra_views import SchedulesView, UsersByUnionView, CompanyUnionsView
from veramo_backend.api_users_view import UsersView

def health_view(request):
    return HttpResponse('OK')

urlpatterns = [
    # Auth - USAR NOSSA VIEW PERSONALIZADA
    path('auth/jwt/create/', SimpleLoginView.as_view(), name='jwt-create'),
    path('auth/users/me/', MeWithRoleView.as_view(), name='auth-me'),

    # Admin e health
    path('admin/', admin.site.urls),
    path('health/', health_view),

    # API unions/companies (lista/cria e detalhe)
    path('api/unions/', UnionsView.as_view()),
    path('api/unions/<int:pk>/', UnionDetailView.as_view()),
    path('api/companies/', CompaniesView.as_view()),
    path('api/companies/<int:pk>/', CompanyDetailView.as_view()),

    # API auxiliares
    path('api/schedules/', SchedulesView.as_view()),
    path('api/users/', UsersView.as_view()),
    path('api/company-unions/', CompanyUnionsView.as_view()),

    # Djoser (mantido como fallback)
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
EOF

# 8. Reiniciar backend
echo "🔄 Reiniciando backend..."
systemctl restart veramo-backend

# 9. Aguardar inicialização
sleep 10

# 10. Testar login
echo "🧪 Testando login..."
curl -X POST http://localhost:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@veramo.com", "password": "admin123"}'

echo -e "\n\n✅ CORREÇÃO FINAL CONCLUÍDA!"
echo "🌐 Teste o login em: https://veramo.com.br"
echo "👤 Credenciais: admin@veramo.com / admin123"
