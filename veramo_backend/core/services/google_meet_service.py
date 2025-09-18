import logging
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from google.auth.transport.requests import Request
from google.oauth2 import service_account
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from django.conf import settings
from django.core.cache import cache
import os

logger = logging.getLogger(__name__)

class GoogleMeetService:
    """
    Serviço para gerenciar salas do Google Meet usando a API oficial do Google Workspace
    """

    # Escopos necessários para a API do Google Calendar (gera link do Meet)
    SCOPES = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
    ]

    def __init__(self):
        # Para desenvolvimento, usar modo simplificado
        self.credentials = None
        self.service = None
        
        # Verificar se deve tentar autenticação completa
        if getattr(settings, 'GOOGLE_MEET_FULL_AUTH', False):
            try:
                self._authenticate()
            except Exception as e:
                logger.warning(f"Autenticação Google falhou, usando modo simplificado: {e}")
                self.credentials = None
                self.service = None

    def _authenticate(self):
        """Autentica com a API do Google usando Conta de Serviço (prod) ou OAuth Client (dev)."""
        try:
            # Carregar configurações do arquivo .env
            from dotenv import load_dotenv
            load_dotenv('google_config.env')
            
            # 1) Tenta Conta de Serviço (produção)
            subject = getattr(settings, 'GOOGLE_IMPERSONATE_EMAIL', None)
            creds_file = os.getenv('GOOGLE_CREDENTIALS_FILE') or getattr(settings, 'GOOGLE_CREDENTIALS_FILE', None)
            service_info = getattr(settings, 'GOOGLE_SERVICE_ACCOUNT_INFO', None)
            oauth_client_file = os.getenv('GOOGLE_OAUTH_CLIENT_SECRETS_FILE') or getattr(settings, 'GOOGLE_OAUTH_CLIENT_SECRETS_FILE', None)

            creds = None
            if creds_file and os.path.exists(creds_file):
                creds = service_account.Credentials.from_service_account_file(creds_file, scopes=self.SCOPES)
                if subject:
                    creds = creds.with_subject(subject)
            elif service_info:
                creds = service_account.Credentials.from_service_account_info(json.loads(service_info), scopes=self.SCOPES)
                if subject:
                    creds = creds.with_subject(subject)

            # 2) Se não houver Conta de Serviço, usa OAuth Client (desenvolvimento)
            if creds is None and oauth_client_file and os.path.exists(oauth_client_file):
                # Usar o arquivo de tokens do usuário (google_tokens_dev.json)
                token_path = os.getenv('GOOGLE_CREDENTIALS_FILE') or 'google_tokens_dev.json'
                creds = None
                if os.path.exists(token_path):
                    try:
                        # Carregar tokens do arquivo JSON
                        with open(token_path, 'r') as f:
                            token_data = json.load(f)
                        
                        # Criar credenciais OAuth do usuário
                        from google.oauth2.credentials import Credentials as UserCreds
                        creds = UserCreds(
                            token=token_data.get('access_token'),
                            refresh_token=token_data.get('refresh_token'),
                            token_uri="https://oauth2.googleapis.com/token",
                            client_id=os.getenv('GOOGLE_CLIENT_ID'),
                            client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
                            scopes=self.SCOPES
                        )
                    except Exception as e:
                        logger.warning(f"Erro ao carregar tokens OAuth: {e}")
                        creds = None
                if not creds or not creds.valid:
                    if creds and creds.expired and creds.refresh_token:
                        creds.refresh(Request())
                    else:
                        # REDIRECT FIXO - PORTA 8000 (UNIFICADA)
                        GOOGLE_REDIRECT = "http://localhost:8000/oauth2callback"  # FIXO - PORTA 8000
                        
                        flow = InstalledAppFlow.from_client_secrets_file(oauth_client_file, self.SCOPES)
                        
                        # FORÇAR O REDIRECT FIXO
                        flow.redirect_uri = GOOGLE_REDIRECT
                        
                        # DEBUG DE PROVA: Mostrar exatamente o que está sendo usado
                        logger.info("🔍 === PATCH OBJETIVO - REDIRECT FIXO ===")
                        logger.info(f"🔍 OAuth Client File: {oauth_client_file}")
                        logger.info(f"🔍 Scopes: {self.SCOPES}")
                        logger.info(f"🔍 Redirect FIXO: {GOOGLE_REDIRECT}")
                        
                        # IMPORTANTE: Log do client_id e redirect_uri ANTES de executar
                        logger.info(f"🔍 DEBUG client_id: {flow.client_config.get('client_id', 'NÃO DEFINIDO')}")
                        logger.info(f"🔍 DEBUG redirect_uri ANTES: {getattr(flow, 'redirect_uri', 'NÃO DEFINIDO')}")
                        logger.info(f"🔍 DEBUG redirect_uri DEPOIS: {flow.redirect_uri}")
                        
                        # Usar apenas a porta fixa 8000 (UNIFICADA)
                        try:
                            logger.info(f"🔍 Tentando porta fixa 8000 com redirect: {GOOGLE_REDIRECT}")
                            creds = flow.run_local_server(port=8000)
                            
                            logger.info(f"✅ Autenticação OAuth bem-sucedida!")
                            logger.info(f"✅ Redirect URI usado: {GOOGLE_REDIRECT}")
                            
                        except Exception as port_error:
                            logger.error(f"❌ Falha na porta 8000: {port_error}")
                            
                            # DIAGNÓSTICO DETALHADO do erro
                            if "redirect_uri_mismatch" in str(port_error):
                                logger.error(f"🚨 === REDIRECT_URI_MISMATCH DETECTADO ===")
                                logger.error(f"🚨 Redirect usado: {GOOGLE_REDIRECT}")
                                logger.error(f"🚨 Erro completo: {port_error}")
                                logger.error(f"🚨 === SOLUÇÃO OBJETIVA ===")
                                logger.error(f"🚨 1. Abra Google Cloud Console")
                                logger.error(f"🚨 2. Vá em: APIs e serviços → Credenciais")
                                logger.error(f"🚨 3. Abra o cliente OAuth 2.0:")
                                logger.error(f"🚨    ID: {flow.client_config.get('client_id', 'NÃO DEFINIDO')}")
                                logger.error(f"🚨 4. Em 'URIs de redirecionamento autorizados', adicione EXATAMENTE:")
                                logger.error(f"🚨    {GOOGLE_REDIRECT}")
                                logger.error(f"🚨 5. Salve e tente novamente")
                                logger.error(f"🚨 === FIM PATCH OBJETIVO ===")
                                
                            raise RuntimeError(f"Falha na autenticação OAuth: {port_error}")
                            
                            if creds is None:
                                raise RuntimeError("Nenhuma porta disponível para autenticação OAuth")
                                
                        except Exception as e:
                            logger.error(f"Erro no fluxo OAuth: {e}")
                            raise RuntimeError(f"Falha na autenticação OAuth: {e}")
                        # Salva o token para reutilizar
                        with open(token_path, 'w') as token:
                            token.write(creds.to_json())

            if creds is None:
                raise RuntimeError('Nenhuma credencial Google configurada (service account ou OAuth). Configure GOOGLE_OAUTH_CLIENT_SECRETS_FILE ou GOOGLE_CREDENTIALS_FILE.')

            self.credentials = creds
            self.service = build('calendar', 'v3', credentials=self.credentials, cache_discovery=False)

        except Exception as e:
            logger.error(f"Erro na autenticação com Google API: {str(e)}")
            raise
    
    def create_meeting(self, 
                       summary: str,
                       description: str,
                       start_time: datetime,
                       end_time: datetime,
                       attendees: list = None,
                       location: str = None) -> Optional[Dict[str, Any]]:
        """
        Cria uma reunião REAL no Google Meet usando a API oficial do Google Calendar
        
        Args:
            summary: Título da reunião
            description: Descrição da reunião
            start_time: Horário de início
            end_time: Horário de término
            attendees: Lista de emails dos participantes
            location: Local da reunião (opcional)
        
        Returns:
            Dict com informações da reunião criada ou None se falhar
        """
        try:
            if not self.service:
                logger.error("❌ Serviço Google não autenticado - NÃO é possível criar reunião real")
                logger.error("❌ Configure OAuth corretamente para criar salas reais do Google Meet")
                return None
            
            import uuid
            
            # Criar evento no Google Calendar com Google Meet REAL
            event = {
                'summary': summary,
                'description': description,
                'start': {
                    'dateTime': start_time.isoformat(),
                    'timeZone': 'America/Sao_Paulo',
                },
                'end': {
                    'dateTime': end_time.isoformat(),
                    'timeZone': 'America/Sao_Paulo',
                },
                'attendees': [{'email': email} for email in (attendees or [])],
                'conferenceData': {
                    'createRequest': {
                        'requestId': str(uuid.uuid4()),  # ID único para cada requisição
                        'conferenceSolutionKey': {
                            'type': 'hangoutsMeet'
                        }
                    }
                },
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60},
                        {'method': 'popup', 'minutes': 10},
                    ],
                },
            }
            
            # DEBUG: Verificar usuário autenticado
            try:
                import requests
                info_response = requests.get(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {self.service._http.request.credentials.token}"}
                )
                if info_response.status_code == 200:
                    user_info = info_response.json()
                    logger.info(f"🔍 USUÁRIO AUTENTICADO: {user_info.get('email')}")
                else:
                    logger.warning(f"⚠️ Falha ao verificar usuário: {info_response.status_code}")
            except Exception as e:
                logger.warning(f"⚠️ Erro ao verificar usuário: {e}")
            
            logger.info("🚀 Criando evento REAL no Google Calendar com Google Meet...")
            logger.info(f"🚀 Summary: {summary}")
            logger.info(f"🚀 Start: {start_time.isoformat()}")
            logger.info(f"🚀 End: {end_time.isoformat()}")
            logger.info(f"🚀 Attendees: {attendees or []}")
            logger.info(f"🚀 Request ID: {event['conferenceData']['createRequest']['requestId']}")
            
            # Criar o evento com conferência - CRÍTICO: conferenceDataVersion=1
            created_event = self.service.events().insert(
                calendarId='primary',
                body=event,
                conferenceDataVersion=1,  # ESSENCIAL para criar Meet
                sendUpdates='all'
            ).execute()
            
            logger.info(f"✅ Evento criado! ID: {created_event.get('id')}")
            
            # Extrair informações da conferência REAL
            conference_data = created_event.get('conferenceData', {})
            
            if conference_data:
                logger.info(f"✅ ConferenceData encontrado!")
                logger.info(f"✅ Conference ID: {conference_data.get('conferenceId', 'N/A')}")
                logger.info(f"✅ Entry Points: {len(conference_data.get('entryPoints', []))}")
            else:
                logger.error("❌ ConferenceData NÃO encontrado no evento!")
                logger.error("❌ Possíveis causas:")
                logger.error("❌ - Faltou conferenceDataVersion=1")
                logger.error("❌ - Faltou createRequest no body")
                logger.error("❌ - Escopo insuficiente")
                return None
            
            # Tentar diferentes formas de obter o link do Meet
            meet_link = (
                created_event.get('hangoutLink') or  # Forma mais comum
                conference_data.get('entryPoints', [{}])[0].get('uri', '') or  # Forma alternativa
                conference_data.get('conferenceId', '')  # Último recurso
            )
            
            if not meet_link:
                logger.error("❌ Falha ao obter link do Google Meet - conferenceData vazio")
                logger.error(f"❌ Evento criado: {created_event.get('id')}")
                logger.error(f"❌ ConferenceData: {conference_data}")
                return None
            
            meeting_info = {
                'event_id': created_event.get('id'),
                'meet_link': meet_link,
                'conference_id': conference_data.get('conferenceId', ''),
                'start_time': start_time.isoformat(),
                'end_time': end_time.isoformat(),
                'summary': summary,
                'description': description,
                'html_link': created_event.get('htmlLink', ''),
                'attendees': attendees or [],
                'method': 'real_api'  # Indicar que é uma reunião real
            }
            
            logger.info(f"✅ Reunião REAL criada com sucesso!")
            logger.info(f"✅ Event ID: {created_event.get('id')}")
            logger.info(f"✅ Meet Link: {meet_link}")
            logger.info(f"✅ Conference ID: {conference_data.get('conferenceId', '')}")
            
            return meeting_info
            
        except Exception as e:
            logger.error(f"❌ Erro ao criar reunião REAL: {str(e)}")
            import traceback
            logger.error(f"❌ Traceback: {traceback.format_exc()}")
            return None
    
    # REMOVIDO: Método simplificado que criava links falsos
    # Agora só criamos reuniões REAIS via API do Google Calendar
    
    def update_meeting(self, event_id: str, **kwargs) -> Optional[Dict[str, Any]]:
        """
        Atualiza uma reunião existente
        
        Args:
            event_id: ID do evento no Google Calendar
            **kwargs: Campos a serem atualizados
        
        Returns:
            Dict com informações atualizadas ou None se falhar
        """
        try:
            if not self.service:
                self._authenticate()
            
            # Buscar evento existente
            event = self.service.events().get(
                calendarId='primary',
                eventId=event_id
            ).execute()
            
            # Atualizar campos
            for key, value in kwargs.items():
                if key in ['summary', 'description', 'location']:
                    event[key] = value
                elif key in ['start_time', 'end_time']:
                    if key == 'start_time':
                        event['start']['dateTime'] = value.isoformat()
                    else:
                        event['end']['dateTime'] = value.isoformat()
                elif key == 'attendees':
                    event['attendees'] = [{'email': email} for email in value]
            
            # Atualizar evento
            updated_event = self.service.events().update(
                calendarId='primary',
                eventId=event_id,
                body=event,
                sendUpdates='all'
            ).execute()
            
            return {
                'event_id': updated_event['id'],
                'meet_link': updated_event.get('hangoutLink'),
                'summary': updated_event['summary'],
                'html_link': updated_event['htmlLink']
            }
            
        except Exception as e:
            logger.error(f"Erro ao atualizar reunião {event_id}: {str(e)}")
            return None
    
    def delete_meeting(self, event_id: str) -> bool:
        """
        Remove uma reunião
        
        Args:
            event_id: ID do evento no Google Calendar
        
        Returns:
            True se removido com sucesso, False caso contrário
        """
        try:
            if not self.service:
                self._authenticate()
            
            self.service.events().delete(
                calendarId='primary',
                eventId=event_id,
                sendUpdates='all'
            ).execute()
            
            logger.info(f"Reunião {event_id} removida com sucesso")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao remover reunião {event_id}: {str(e)}")
            return False
    
    def get_meeting_info(self, event_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtém informações de uma reunião
        
        Args:
            event_id: ID do evento no Google Calendar
        
        Returns:
            Dict com informações da reunião ou None se não encontrada
        """
        try:
            if not self.service:
                self._authenticate()
            
            event = self.service.events().get(
                calendarId='primary',
                eventId=event_id
            ).execute()
            
            return {
                'event_id': event['id'],
                'meet_link': event.get('hangoutLink'),
                'conference_id': event.get('conferenceData', {}).get('conferenceId'),
                'start_time': event['start']['dateTime'],
                'end_time': event['end']['dateTime'],
                'summary': event['summary'],
                'description': event.get('description', ''),
                'html_link': event['htmlLink'],
                'attendees': [att['email'] for att in event.get('attendees', [])]
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter informações da reunião {event_id}: {str(e)}")
            return None
