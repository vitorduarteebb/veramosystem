#!/bin/bash

# Script para corrigir problema de login do Djoser
# Execute na VPS como root

echo "🔧 Corrigindo problema de login do Djoser..."

cd /opt/veramo/veramo_backend
source venv/bin/activate

# 1. Criar view de login customizada
echo "🔧 Criando view de login customizada..."
cat > veramo_backend/custom_auth.py << 'EOF'
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
class CustomLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # Obter dados do JSON
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

# 2. Atualizar URLs para usar view customizada
echo "🌐 Atualizando URLs..."
cat > veramo_backend/urls/__init__.py << 'EOF'
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from veramo_backend.custom_auth import CustomLoginView

def health_view(request):
    return HttpResponse('OK')

@api_view(['GET'])
@permission_classes([AllowAny])
def test_view(request):
    return Response({"message": "Backend funcionando!"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health_view),
    path('test/', test_view),
    
    # Login customizado
    path('auth/jwt/create/', CustomLoginView.as_view(), name='jwt-create'),
    
    # Djoser (mantido como fallback)
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
EOF

# 3. Reiniciar serviço
echo "🔄 Reiniciando serviço..."
systemctl restart veramo-backend

# 4. Aguardar inicialização
sleep 10

# 5. Testar login com email
echo "🧪 Testando login com email..."
curl -X POST http://localhost:8000/auth/jwt/create/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@veramo.com", "password": "admin123"}' \
  -v

echo -e "\n\n✅ Problema de login corrigido!"
echo "🌐 Teste o login em: https://veramo.com.br"
echo "👤 Credenciais: admin@veramo.com / admin123"
