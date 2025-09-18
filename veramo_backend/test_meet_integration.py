#!/usr/bin/env python3
"""
Script de teste para integração com Google Meet
"""

import os
import sys
import django
from datetime import datetime, timedelta

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'veramo_backend.settings.local')
django.setup()

from django.utils import timezone
from core.services.google_meet_service import GoogleMeetService

def test_google_meet_integration():
    """Testa a integração com Google Meet"""
    print("🧪 Testando integração com Google Meet...")
    
    try:
        # Criar serviço do Google Meet
        print("📡 Inicializando serviço do Google Meet...")
        meet_service = GoogleMeetService()
        print("✅ Serviço inicializado com sucesso!")
        
        # Criar horários para a reunião de teste
        now = timezone.now()
        start_time = now + timedelta(hours=1)
        end_time = start_time + timedelta(hours=1)
        
        print(f"📅 Criando reunião para: {start_time.strftime('%d/%m/%Y %H:%M')}")
        
        # Criar reunião
        meeting_info = meet_service.create_meeting(
            summary="Reunião de Teste - Veramo3",
            description="Esta é uma reunião de teste para verificar a integração com o Google Meet",
            start_time=start_time,
            end_time=end_time,
            attendees=[],
            location="Google Meet"
        )
        
        if meeting_info:
            print("🎉 Reunião criada com sucesso!")
            print(f"  📍 Link do Meet: {meeting_info['meet_link']}")
            print(f"  📅 Link do Calendar: {meeting_info['html_link']}")
            print(f"  🆔 ID do Evento: {meeting_info['event_id']}")
            
            # Perguntar se deve remover a reunião de teste
            remove = input('\n❓ Deseja remover esta reunião de teste? (s/N): ')
            if remove.lower() in ['s', 'sim', 'y', 'yes']:
                if meet_service.delete_meeting(meeting_info['event_id']):
                    print("✅ Reunião de teste removida com sucesso")
                else:
                    print("❌ Erro ao remover reunião de teste")
        else:
            print("❌ Falha ao criar reunião de teste")
            
    except Exception as e:
        print(f"❌ Erro ao testar integração: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = test_google_meet_integration()
    if success:
        print("\n🎉 Teste concluído com sucesso!")
    else:
        print("\n❌ Teste falhou!")
        sys.exit(1)
