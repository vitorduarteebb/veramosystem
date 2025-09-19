#!/bin/bash

# Script manual para corrigir login na VPS
# Execute na VPS como root

echo "🔧 Corrigindo login manualmente..."

cd /opt/veramo/veramo_backend
source venv/bin/activate

# 1. Criar diretório urls se não existir
mkdir -p veramo_backend/urls

# 2. Criar view de login simples
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

# 3. Criar URLs simples
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
    # Auth simples
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

# 4. Recriar usuário admin
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

# 5. Reiniciar backend
systemctl restart veramo-backend

# 6. Aguardar e testar
sleep 5

echo "🧪 Testando login..."
curl -X POST http://localhost:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@veramo.com", "password": "admin123"}'

echo -e "\n\n✅ Correção manual finalizada!"
echo "🌐 Teste o login em: https://veramo.com.br"
echo "👤 Credenciais: admin@veramo.com / admin123"
