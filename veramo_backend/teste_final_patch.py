#!/usr/bin/env python3
"""
Script de teste FINAL - PATCH OBJETIVO COMPLETO
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
from datetime import datetime, timedelta

def main():
    print("🎯 PATCH OBJETIVO COMPLETO - TESTE FINAL")
    print("=" * 60)
    print("📋 Informações do cliente OAuth:")
    print("   Client ID: 343146875318-u97jnvlbvoh15m956v718cinf03q1hvi.apps.googleusercontent.com")
    print("   Redirect URI: http://localhost:8000/oauth2callback")
    print()
    print("🚨 ANTES DE CONTINUAR:")
    print("1. Adicione EXATAMENTE esta URI no Google Cloud Console:")
    print("   http://localhost:8000/oauth2callback")
    print("2. Ative a Google Calendar API")
    print("3. Configure a tela de consentimento OAuth")
    print()
    
    input("Pressione ENTER quando tiver configurado o Google Cloud Console...")
    
    print()
    print("⏳ Iniciando teste de autenticação...")
    print()
    
    try:
        # Tentar inicializar o serviço (vai usar redirect fixo)
        meet_service = GoogleMeetService()
        
        if meet_service.service:
            print("✅ Autenticação bem-sucedida!")
            print("🎉 Google Meet está funcionando perfeitamente!")
            print("🔗 Redirect usado: http://localhost:8000/oauth2callback")
            print()
            
            # Testar criação de reunião REAL
            print("🚀 Testando criação de reunião REAL...")
            
            start_time = datetime.now() + timedelta(hours=1)
            end_time = start_time + timedelta(hours=1)
            
            meet_info = meet_service.create_meeting(
                summary="Teste Veramo3 - Reunião REAL",
                description="Esta é uma reunião REAL criada via API do Google Calendar",
                start_time=start_time,
                end_time=end_time,
                attendees=["empresa1@veramo.com"],
                location="Google Meet"
            )
            
            if meet_info:
                print("🎉 REUNIÃO REAL CRIADA COM SUCESSO!")
                print("=" * 60)
                print(f"📅 Event ID: {meet_info.get('event_id')}")
                print(f"🔗 Meet Link: {meet_info.get('meet_link')}")
                print(f"🆔 Conference ID: {meet_info.get('conference_id')}")
                print(f"📝 Summary: {meet_info.get('summary')}")
                print(f"👥 Attendees: {meet_info.get('attendees')}")
                print(f"🔧 Method: {meet_info.get('method')}")
                print()
                print("✅ Este é um link REAL do Google Meet que funciona!")
                print("✅ Você pode acessar e usar normalmente!")
            else:
                print("❌ Falha ao criar reunião REAL")
                
        else:
            print("⚠️  Autenticação falhou, mas capturamos o redirect_uri")
            
    except Exception as e:
        print(f"❌ Erro capturado: {e}")
        
        # Extrair informações do erro
        error_str = str(e)
        if "redirect_uri_mismatch" in error_str:
            print()
            print("🚨 REDIRECT_URI_MISMATCH DETECTADO!")
            print("=" * 60)
            print("📋 SOLUÇÃO OBJETIVA:")
            print("1. Abra o Google Cloud Console")
            print("2. Vá em: APIs e serviços → Credenciais")
            print("3. Abra o cliente OAuth 2.0:")
            print("   ID: 343146875318-u97jnvlbvoh15m956v718cinf03q1hvi.apps.googleusercontent.com")
            print("4. Em 'URIs de redirecionamento autorizados', adicione EXATAMENTE:")
            print()
            print("   http://localhost:8000/oauth2callback")
            print()
            print("5. Salve e execute este script novamente")
            print()
            print("💡 DICA: A URI deve ser EXATAMENTE igual (incluindo o caminho /oauth2callback)")

if __name__ == "__main__":
    main()
