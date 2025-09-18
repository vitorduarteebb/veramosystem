#!/usr/bin/env python3
"""
Script de teste rápido - Verificar GoogleMeetService
"""

import os
import django
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'veramo_backend.settings.dev')
django.setup()

from core.services.google_meet_service import GoogleMeetService

def main():
    print("🔍 TESTE RÁPIDO - GOOGLE MEET SERVICE")
    print("=" * 50)
    
    try:
        # Verificar arquivos
        print("📋 Verificando arquivos...")
        
        client_secret_path = "client_secret.json"
        tokens_path = "google_tokens_dev.json"
        
        if os.path.exists(client_secret_path):
            print(f"✅ {client_secret_path} existe")
        else:
            print(f"❌ {client_secret_path} não existe")
            
        if os.path.exists(tokens_path):
            print(f"✅ {tokens_path} existe")
            # Verificar conteúdo
            with open(tokens_path, 'r') as f:
                content = f.read()
                if "access_token" in content and "refresh_token" in content:
                    print("✅ Tokens válidos encontrados")
                else:
                    print("❌ Tokens inválidos ou vazios")
        else:
            print(f"❌ {tokens_path} não existe")
        
        print()
        print("🔍 Testando GoogleMeetService...")
        
        # Testar serviço
        meet_service = GoogleMeetService()
        
        if meet_service.service:
            print("✅ GoogleMeetService autenticado com sucesso!")
            print("✅ Pronto para criar reuniões reais!")
        else:
            print("❌ GoogleMeetService não autenticado")
            print("❌ Precisa fazer login OAuth primeiro")
            
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        print(traceback.format_exc())

if __name__ == "__main__":
    main()
