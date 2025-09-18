#!/usr/bin/env python
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'veramo_backend.settings.dev')
django.setup()

from app_google.models import GoogleOAuthToken

def verify_homologador_connection(homologador_id):
    """Verifica se homologador está conectado ao Google"""
    token = GoogleOAuthToken.objects.filter(homologador_id=homologador_id).first()
    
    if token:
        print(f"✅ Homologador {homologador_id} CONECTADO!")
        print(f"📧 Email Google: {token.email_google}")
        print(f"🔄 Tem refresh_token: {'✅ SIM' if token.refresh_token else '❌ NÃO'}")
        print(f"⏰ Expira em: {token.token_expiry}")
        print(f"📅 Criado em: {token.created_at}")
        print(f"🔄 Atualizado em: {token.updated_at}")
        return True
    else:
        print(f"❌ Homologador {homologador_id} NÃO conectado")
        print(f"🔗 URL para conectar: http://localhost:8000/api/homologadores/{homologador_id}/google/auth-url/")
        return False

if __name__ == "__main__":
    print("🔍 Verificando conexão do Homologador 11...")
    verify_homologador_connection(11)
