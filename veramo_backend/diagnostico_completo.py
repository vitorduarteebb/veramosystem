#!/usr/bin/env python3
"""
Script de DIAGNÓSTICO COMPLETO - Identificar problema do Google Meet
"""

import os
import django
import logging
import json
import requests
from datetime import datetime, timedelta, timezone
import uuid

# Configurar logging detalhado
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'veramo_backend.settings.dev')
django.setup()

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

def main():
    print("🔍 DIAGNÓSTICO COMPLETO - GOOGLE MEET")
    print("=" * 60)
    print("📋 Verificando todos os pontos críticos...")
    print()
    
    try:
        # 1. VERIFICAR SE EXISTE TOKEN SALVO
        token_file = 'google_tokens.json'
        if not os.path.exists(token_file):
            print("❌ PROBLEMA 1: Token não encontrado!")
            print("   Arquivo: google_tokens.json não existe")
            print("   SOLUÇÃO: Execute primeiro o teste de autenticação")
            return
        
        # Carregar token
        with open(token_file, 'r') as f:
            token_data = json.load(f)
        
        print("✅ Token encontrado!")
        print(f"   Client ID: {token_data.get('client_id', 'NÃO DEFINIDO')}")
        print(f"   Scopes: {token_data.get('scopes', 'NÃO DEFINIDO')}")
        print(f"   Expiry: {token_data.get('expiry', 'NÃO DEFINIDO')}")
        print()
        
        # 2. CRIAR CREDENCIAIS
        creds = Credentials(
            token=token_data['token'],
            refresh_token=token_data['refresh_token'],
            token_uri="https://oauth2.googleapis.com/token",
            client_id=token_data['client_id'],
            client_secret=token_data['client_secret'],
            scopes=token_data['scopes']
        )
        
        print("🔍 DIAGNÓSTICO 1: Verificando usuário autenticado...")
        
        # 3. VERIFICAR USUÁRIO AUTENTICADO
        try:
            info_response = requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {creds.token}"}
            )
            
            if info_response.status_code == 200:
                user_info = info_response.json()
                user_email = user_info.get("email")
                print(f"✅ USUÁRIO AUTENTICADO: {user_email}")
                print(f"   Nome: {user_info.get('name', 'N/A')}")
                print(f"   ID: {user_info.get('id', 'N/A')}")
            else:
                print(f"❌ PROBLEMA 2: Falha ao obter info do usuário")
                print(f"   Status: {info_response.status_code}")
                print(f"   Response: {info_response.text}")
                return
                
        except Exception as e:
            print(f"❌ PROBLEMA 2: Erro ao verificar usuário: {e}")
            return
        
        print()
        print("🔍 DIAGNÓSTICO 2: Verificando calendário primary...")
        
        # 4. VERIFICAR CALENDÁRIO PRIMARY
        try:
            service = build("calendar", "v3", credentials=creds)
            primary_cal = service.calendarList().get(calendarId="primary").execute()
            print(f"✅ CALENDÁRIO PRIMARY: {primary_cal['id']}")
            print(f"   Sumário: {primary_cal.get('summary', 'N/A')}")
            print(f"   Timezone: {primary_cal.get('timeZone', 'N/A')}")
            print(f"   Acesso: {primary_cal.get('accessRole', 'N/A')}")
            
        except HttpError as e:
            print(f"❌ PROBLEMA 3: Falha ao acessar calendário primary")
            print(f"   Status: {e.status_code}")
            print(f"   Reason: {e.reason}")
            print(f"   Details: {e.error_details if hasattr(e, 'error_details') else 'N/A'}")
            return
        except Exception as e:
            print(f"❌ PROBLEMA 3: Erro ao verificar calendário: {e}")
            return
        
        print()
        print("🔍 DIAGNÓSTICO 3: Testando criação de evento REAL...")
        
        # 5. TESTAR CRIAÇÃO DE EVENTO REAL
        try:
            start = datetime.now(timezone.utc) + timedelta(minutes=5)
            end = start + timedelta(minutes=45)
            
            body = {
                "summary": "Teste Veramo3 - Diagnóstico",
                "description": "Evento de teste para diagnóstico do Google Meet",
                "start": {"dateTime": start.isoformat(), "timeZone": "America/Sao_Paulo"},
                "end": {"dateTime": end.isoformat(), "timeZone": "America/Sao_Paulo"},
                "conferenceData": {
                    "createRequest": {
                        "requestId": str(uuid.uuid4()),
                        "conferenceSolutionKey": {"type": "hangoutsMeet"}
                    }
                }
            }
            
            print("🚀 Criando evento com Google Meet...")
            print(f"   Start: {start.isoformat()}")
            print(f"   End: {end.isoformat()}")
            print(f"   Request ID: {body['conferenceData']['createRequest']['requestId']}")
            
            event = service.events().insert(
                calendarId="primary",
                body=body,
                conferenceDataVersion=1
            ).execute()
            
            print("✅ EVENTO CRIADO COM SUCESSO!")
            print(f"   Event ID: {event['id']}")
            print(f"   Summary: {event.get('summary', 'N/A')}")
            
            # Verificar conferenceData
            conference_data = event.get('conferenceData', {})
            if conference_data:
                print("✅ CONFERENCE DATA ENCONTRADO!")
                print(f"   Conference ID: {conference_data.get('conferenceId', 'N/A')}")
                
                # Tentar obter link do Meet
                meet_link = (
                    event.get('hangoutLink') or
                    conference_data.get('entryPoints', [{}])[0].get('uri', '') or
                    conference_data.get('conferenceId', '')
                )
                
                if meet_link:
                    print(f"✅ LINK DO MEET: {meet_link}")
                    print("🎉 SUCESSO TOTAL! Google Meet funcionando perfeitamente!")
                else:
                    print("❌ PROBLEMA 4: ConferenceData existe mas sem link do Meet")
                    print(f"   ConferenceData: {conference_data}")
            else:
                print("❌ PROBLEMA 4: ConferenceData não encontrado no evento")
                print("   Possíveis causas:")
                print("   - Faltou conferenceDataVersion=1")
                print("   - Faltou createRequest no body")
                print("   - Escopo insuficiente")
                
        except HttpError as e:
            print(f"❌ PROBLEMA 4: Falha ao criar evento")
            print(f"   Status: {e.status_code}")
            print(f"   Reason: {e.reason}")
            print(f"   Details: {e.error_details if hasattr(e, 'error_details') else 'N/A'}")
            print(f"   Content: {e.content}")
            
            # Diagnóstico específico por status
            if e.status_code == 401:
                print("   DIAGNÓSTICO: Token expirado ou inválido")
                print("   SOLUÇÃO: Refazer OAuth com access_type=offline + prompt=consent")
            elif e.status_code == 403:
                print("   DIAGNÓSTICO: Permissões insuficientes")
                print("   SOLUÇÃO: Verificar escopo calendar.events")
            elif e.status_code == 404:
                print("   DIAGNÓSTICO: Calendário não encontrado")
                print("   SOLUÇÃO: Verificar calendarId ou usar Service Account com impersonação")
            elif e.status_code == 400:
                print("   DIAGNÓSTICO: Dados inválidos")
                print("   SOLUÇÃO: Verificar formato do body ou conferenceData")
                
        except Exception as e:
            print(f"❌ PROBLEMA 4: Erro inesperado: {e}")
            import traceback
            print(traceback.format_exc())
        
        print()
        print("🔍 DIAGNÓSTICO 4: Verificando lista de calendários...")
        
        # 6. VERIFICAR LISTA DE CALENDÁRIOS
        try:
            calendar_list = service.calendarList().list().execute()
            calendars = calendar_list.get('items', [])
            
            print(f"✅ CALENDÁRIOS DISPONÍVEIS: {len(calendars)}")
            for cal in calendars[:3]:  # Mostrar apenas os primeiros 3
                print(f"   - {cal['id']}: {cal.get('summary', 'N/A')} ({cal.get('accessRole', 'N/A')})")
            
        except Exception as e:
            print(f"❌ PROBLEMA 5: Erro ao listar calendários: {e}")
        
        print()
        print("🎯 RESUMO DO DIAGNÓSTICO:")
        print("=" * 60)
        print("✅ Se todos os testes passaram: Google Meet está funcionando!")
        print("❌ Se algum teste falhou: Verifique o erro específico acima")
        print("📋 Próximos passos: Integre o GoogleMeetService no seu sistema")
        
    except Exception as e:
        print(f"❌ ERRO GERAL: {e}")
        import traceback
        print(traceback.format_exc())

if __name__ == "__main__":
    main()
