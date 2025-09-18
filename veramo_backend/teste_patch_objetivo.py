#!/usr/bin/env python3
"""
Script de teste do PATCH OBJETIVO - Redirect Fixo
"""

import os
import django
import logging

# Configurar logging detalhado
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'veramo_backend.settings.dev')
django.setup()

from core.services.google_meet_service import GoogleMeetService

def main():
    print("🔧 PATCH OBJETIVO - REDIRECT FIXO")
    print("=" * 50)
    print("📋 Este script testa o redirect fixo:")
    print("   http://localhost:8083/oauth2callback")
    print()
    print("🚨 IMPORTANTE: Adicione EXATAMENTE esta URI no Google Cloud Console:")
    print("   http://localhost:8083/oauth2callback")
    print()
    print("⏳ Iniciando teste...")
    print()
    
    try:
        # Tentar inicializar o serviço (vai usar redirect fixo)
        meet_service = GoogleMeetService()
        
        if meet_service.service:
            print("✅ Autenticação bem-sucedida!")
            print("🎉 Google Meet está funcionando perfeitamente!")
            print("🔗 Redirect usado: http://localhost:8083/oauth2callback")
        else:
            print("⚠️  Autenticação falhou, mas capturamos o redirect_uri")
            
    except Exception as e:
        print(f"❌ Erro capturado: {e}")
        
        # Extrair informações do erro
        error_str = str(e)
        if "redirect_uri_mismatch" in error_str:
            print()
            print("🚨 REDIRECT_URI_MISMATCH DETECTADO!")
            print("=" * 50)
            print("📋 SOLUÇÃO OBJETIVA:")
            print("1. Abra o Google Cloud Console")
            print("2. Vá em: APIs e serviços → Credenciais")
            print("3. Abra o cliente OAuth 2.0")
            print("4. Em 'URIs de redirecionamento autorizados', adicione EXATAMENTE:")
            print()
            print("   http://localhost:8083/oauth2callback")
            print()
            print("5. Salve e execute este script novamente")
            print()
            print("💡 DICA: A URI deve ser EXATAMENTE igual (incluindo o caminho /oauth2callback)")

if __name__ == "__main__":
    main()
