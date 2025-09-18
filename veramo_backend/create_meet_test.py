#!/usr/bin/env python3
"""
Script de TESTE - Criar reunião REAL no Google Meet
"""

import os
import json
import uuid
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

# Carregar configurações
load_dotenv('google_config.env')

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

def main():
    print("🚀 TESTE DE CRIAÇÃO DE REUNIÃO REAL")
    print("=" * 50)
    
    # Verificar se existe token
    token_file = "google_tokens_dev.json"
    if not os.path.exists(token_file):
        print("❌ Token não encontrado!")
        print("   Execute primeiro: python auth_start.py")
        print("   E faça a autenticação OAuth")
        return
    
    try:
        # Carregar tokens
        with open(token_file, "r", encoding="utf-8") as f:
            tokens = json.load(f)
        
        print("✅ Tokens carregados!")
        print(f"   Access Token: {tokens.get('access_token', '')[:20]}...")
        print(f"   Refresh Token: {'***' if tokens.get('refresh_token') else 'N/A'}")
        print()
        
        # Criar credenciais
        creds = Credentials(
            token=tokens.get("access_token"),
            refresh_token=tokens.get("refresh_token"),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=CLIENT_ID,
            client_secret=CLIENT_SECRET,
            scopes=["https://www.googleapis.com/auth/calendar.events"],
        )
        
        # Criar serviço do Google Calendar
        service = build("calendar", "v3", credentials=creds)
        
        print("🔍 Verificando usuário autenticado...")
        
        # Verificar usuário autenticado
        import requests
        info_response = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {creds.token}"}
        )
        
        if info_response.status_code == 200:
            user_info = info_response.json()
            print(f"✅ Usuário: {user_info.get('email')}")
            print(f"   Nome: {user_info.get('name', 'N/A')}")
        else:
            print(f"⚠️ Falha ao verificar usuário: {info_response.status_code}")
        
        print()
        print("🚀 Criando reunião REAL no Google Meet...")
        
        # Configurar horários
        start = datetime.now(timezone.utc) + timedelta(minutes=5)
        end = start + timedelta(minutes=45)
        
        # Criar evento com Google Meet
        body = {
            "summary": "Teste Veramo3 - Reunião REAL",
            "description": "Esta é uma reunião REAL criada via API do Google Calendar",
            "start": {"dateTime": start.isoformat(), "timeZone": "America/Sao_Paulo"},
            "end": {"dateTime": end.isoformat(), "timeZone": "America/Sao_Paulo"},
            "conferenceData": {
                "createRequest": {
                    "requestId": str(uuid.uuid4()),
                    "conferenceSolutionKey": {"type": "hangoutsMeet"}
                }
            },
            "attendees": [],  # opcional
        }
        
        print(f"   Start: {start.isoformat()}")
        print(f"   End: {end.isoformat()}")
        print(f"   Request ID: {body['conferenceData']['createRequest']['requestId']}")
        
        # Criar evento
        event = service.events().insert(
            calendarId="primary",
            body=body,
            conferenceDataVersion=1
        ).execute()
        
        print()
        print("🎉 REUNIÃO CRIADA COM SUCESSO!")
        print("=" * 50)
        print(f"📅 Event ID: {event['id']}")
        print(f"📝 Summary: {event.get('summary', 'N/A')}")
        
        # Verificar conferenceData
        conference_data = event.get('conferenceData', {})
        if conference_data:
            print(f"🆔 Conference ID: {conference_data.get('conferenceId', 'N/A')}")
            print(f"🔗 Entry Points: {len(conference_data.get('entryPoints', []))}")
            
            # Obter link do Meet
            meet_link = (
                event.get("hangoutLink") or
                conference_data.get("entryPoints", [{}])[0].get("uri", "") or
                conference_data.get("conferenceId", "")
            )
            
            if meet_link:
                print(f"🎥 MEET LINK: {meet_link}")
                print()
                print("✅ SUCESSO TOTAL!")
                print("✅ Esta é uma sala REAL do Google Meet")
                print("✅ Você pode acessar e usar normalmente")
                print("✅ O evento aparecerá no Google Calendar")
            else:
                print("❌ Falha ao obter link do Meet")
        else:
            print("❌ ConferenceData não encontrado")
            print("   Possíveis causas:")
            print("   - Faltou conferenceDataVersion=1")
            print("   - Faltou createRequest no body")
            print("   - Escopo insuficiente")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        print(traceback.format_exc())

if __name__ == "__main__":
    main()
