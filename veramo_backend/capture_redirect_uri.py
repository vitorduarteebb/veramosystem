#!/usr/bin/env python3
"""
Script para capturar redirect_uri exato e resolver redirect_uri_mismatch
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
    print("🔍 CAPTURANDO REDIRECT_URI EXATO")
    print("=" * 50)
    print("📋 Este script vai tentar autenticar e mostrar EXATAMENTE")
    print("   qual redirect_uri está sendo enviado para o Google.")
    print()
    print("🚨 IMPORTANTE: Quando der erro redirect_uri_mismatch,")
    print("   copie a URI exata que aparecerá nos logs e adicione")
    print("   no Google Cloud Console.")
    print()
    print("⏳ Iniciando teste...")
    print()
    
    try:
        # Tentar inicializar o serviço (vai capturar o redirect_uri)
        meet_service = GoogleMeetService()
        
        if meet_service.service:
            print("✅ Autenticação bem-sucedida!")
            print("🎉 Google Meet está funcionando perfeitamente!")
        else:
            print("⚠️  Autenticação falhou, mas capturamos o redirect_uri")
            
    except Exception as e:
        print(f"❌ Erro capturado: {e}")
        
        # Extrair informações do erro
        error_str = str(e)
        if "redirect_uri_mismatch" in error_str:
            print()
            print("🚨 REDIRECT_URI_MISMATCH DETECTADO!")
            print("=" * 40)
            print("📋 SOLUÇÃO:")
            print("1. Abra o Google Cloud Console")
            print("2. Vá em: APIs e serviços → Credenciais")
            print("3. Abra o cliente OAuth 2.0:")
            print("   ID: 343146875318-u97jnvlbvoh15m956v718cinf03q1hvi.apps.googleusercontent.com")
            print("4. Em 'URIs de redirecionamento autorizados', adicione:")
            print()
            
            # Tentar extrair a URI do erro
            if "http://localhost:" in error_str:
                import re
                uris = re.findall(r'http://localhost:\d+/', error_str)
                for uri in uris:
                    print(f"   {uri}")
            else:
                print("   http://localhost:8083/")
                print("   http://localhost:8080/")
                print("   http://localhost:8081/")
                print("   http://localhost:8082/")
            
            print()
            print("5. Salve e execute este script novamente")
            print()
            print("💡 DICA: A URI deve ser EXATAMENTE igual (incluindo a barra final)")

if __name__ == "__main__":
    main()
