#!/usr/bin/env python3
"""
Script para configurar autenticação Google Meet
Execute este script uma vez para autorizar a aplicação
"""

import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'veramo_backend.settings.dev')
django.setup()

from core.services.google_meet_service import GoogleMeetService
from datetime import datetime, timedelta

def main():
    print("🔐 Configurando autenticação Google Meet...")
    print("=" * 50)
    
    try:
        # Inicializar serviço (vai abrir navegador para autenticação)
        print("📱 Abrindo navegador para autenticação...")
        print("💡 Se o navegador não abrir, copie a URL que aparecerá abaixo")
        print()
        
        meet_service = GoogleMeetService()
        
        print("✅ Autenticação concluída!")
        print(f"✅ Credenciais válidas: {meet_service.credentials is not None}")
        print(f"✅ Serviço Google Calendar: {meet_service.service is not None}")
        
        # Testar criação de reunião
        print("\n🧪 Testando criação de reunião...")
        test_meeting = meet_service.create_meeting(
            summary="Teste Veramo3 - Google Meet",
            description="Esta é uma reunião de teste para verificar a integração",
            start_time=datetime.now() + timedelta(hours=1),
            end_time=datetime.now() + timedelta(hours=2),
            attendees=[],
            location="Google Meet"
        )
        
        if test_meeting:
            print("🎉 SUCESSO! Reunião criada:")
            print(f"   📅 Título: {test_meeting['summary']}")
            print(f"   🔗 Link: {test_meeting['meet_link']}")
            print(f"   📧 Evento ID: {test_meeting['event_id']}")
            print("\n✅ Google Meet está funcionando perfeitamente!")
        else:
            print("❌ Falha ao criar reunião de teste")
            
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        print("\n🔍 Detalhes do erro:")
        print(traceback.format_exc())
        
        print("\n💡 Possíveis soluções:")
        print("1. Verifique se o arquivo client_secret.json existe")
        print("2. Confirme se as URLs de redirecionamento estão corretas no Google Cloud Console")
        print("3. Certifique-se de que a porta 8080 está livre")

if __name__ == "__main__":
    main()
