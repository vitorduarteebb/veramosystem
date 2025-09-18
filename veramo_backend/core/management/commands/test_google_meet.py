from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta
import logging

# Importar o serviço no escopo do módulo para ser visível em todos os métodos
try:
    from core.services.google_meet_service import GoogleMeetService
except Exception as _e:
    GoogleMeetService = None

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Testa a integração com o Google Meet'

    def add_arguments(self, parser):
        parser.add_argument(
            '--create-meeting',
            action='store_true',
            help='Cria uma reunião de teste no Google Meet',
        )
        parser.add_argument(
            '--list-meetings',
            action='store_true',
            help='Lista reuniões existentes no Google Calendar',
        )
        parser.add_argument(
            '--check-config',
            action='store_true',
            help='Verifica a configuração do Google Meet',
        )

    def handle(self, *args, **options):
        try:
            if GoogleMeetService is None:
                raise ImportError('Serviço do Google Meet indisponível')
            self.stdout.write(self.style.SUCCESS('✓ Serviço do Google Meet importado com sucesso'))
            
            # Verificar configuração
            if options['check_config']:
                self.check_configuration()
            
            # Criar reunião de teste
            if options['create_meeting']:
                self.create_test_meeting()
            
            # Listar reuniões
            if options['list_meetings']:
                self.list_meetings()
            
            # Se nenhuma opção foi especificada, executar verificação básica
            if not any([options['create_meeting'], options['list_meetings'], options['check_config']]):
                self.stdout.write(
                    self.style.WARNING('Nenhuma opção especificada. Executando verificação básica...')
                )
                self.check_configuration()
                
        except ImportError as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Erro ao importar serviço do Google Meet: {e}')
            )
            self.stdout.write(
                self.style.WARNING('Verifique se as dependências estão instaladas: pip install google-auth google-api-python-client')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Erro inesperado: {e}')
            )

    def check_configuration(self):
        """Verifica a configuração do Google Meet"""
        self.stdout.write('\n🔍 Verificando configuração do Google Meet...')
        
        # Verificar variáveis de ambiente
        required_vars = [
            'GOOGLE_CREDENTIALS_FILE',
            'GOOGLE_SERVICE_ACCOUNT_INFO',
            'GOOGLE_CLOUD_PROJECT_ID',
        ]
        
        config_ok = False
        for var in required_vars:
            value = getattr(settings, var, None)
            if value:
                self.stdout.write(f'✓ {var}: Configurado')
                config_ok = True
            else:
                self.stdout.write(f'✗ {var}: Não configurado')
        
        if not config_ok:
            self.stdout.write(
                self.style.WARNING(
                    '\n⚠️  Nenhuma configuração de credenciais encontrada!\n'
                    'Configure pelo menos uma das seguintes opções:\n'
                    '1. GOOGLE_CREDENTIALS_FILE: Caminho para arquivo JSON\n'
                    '2. GOOGLE_SERVICE_ACCOUNT_INFO: JSON das credenciais\n'
                    '3. GOOGLE_CLOUD_PROJECT_ID: ID do projeto no Google Cloud\n\n'
                    'Veja o arquivo env.google_meet.example para mais detalhes.'
                )
            )
            return False
        
        # Tentar autenticar
        try:
            if GoogleMeetService is None:
                raise RuntimeError('Serviço do Google Meet indisponível')
            meet_service = GoogleMeetService()
            self.stdout.write('✓ Autenticação com Google API bem-sucedida')
            return True
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Falha na autenticação: {e}')
            )
            return False

    def create_test_meeting(self):
        """Cria uma reunião de teste no Google Meet"""
        self.stdout.write('\n📅 Criando reunião de teste no Google Meet...')
        
        try:
            if GoogleMeetService is None:
                raise RuntimeError('Serviço do Google Meet indisponível')
            meet_service = GoogleMeetService()
            
            # Criar horários para a reunião de teste
            now = timezone.now()
            start_time = now + timedelta(hours=1)
            end_time = start_time + timedelta(hours=1)
            
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
                self.stdout.write(
                    self.style.SUCCESS('✓ Reunião de teste criada com sucesso!')
                )
                self.stdout.write(f'  📍 Link do Meet: {meeting_info["meet_link"]}')
                self.stdout.write(f'  📅 Link do Calendar: {meeting_info["html_link"]}')
                self.stdout.write(f'  🆔 ID do Evento: {meeting_info["event_id"]}')
                
                # Perguntar se deve remover a reunião de teste
                remove = input('\n❓ Deseja remover esta reunião de teste? (s/N): ')
                if remove.lower() in ['s', 'sim', 'y', 'yes']:
                    if meet_service.delete_meeting(meeting_info['event_id']):
                        self.stdout.write(
                            self.style.SUCCESS('✓ Reunião de teste removida com sucesso')
                        )
                    else:
                        self.stdout.write(
                            self.style.ERROR('✗ Erro ao remover reunião de teste')
                        )
            else:
                self.stdout.write(
                    self.style.ERROR('✗ Falha ao criar reunião de teste')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Erro ao criar reunião de teste: {e}')
            )

    def list_meetings(self):
        """Lista reuniões existentes no Google Calendar"""
        self.stdout.write('\n📋 Listando reuniões existentes...')
        
        try:
            meet_service = GoogleMeetService()
            
            # Buscar eventos futuros
            now = timezone.now()
            start_time = now.isoformat() + 'Z'
            
            # Usar o serviço para buscar eventos
            service = meet_service.service
            events_result = service.events().list(
                calendarId='primary',
                timeMin=start_time,
                maxResults=10,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            
            if not events:
                self.stdout.write('  📭 Nenhuma reunião futura encontrada')
                return
            
            self.stdout.write(f'  📅 Encontradas {len(events)} reuniões futuras:\n')
            
            for event in events:
                start = event['start'].get('dateTime', event['start'].get('date'))
                meet_link = event.get('hangoutLink', 'N/A')
                
                self.stdout.write(f'  📌 {event["summary"]}')
                self.stdout.write(f'     🕐 {start}')
                self.stdout.write(f'     🔗 {meet_link}')
                self.stdout.write('')
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Erro ao listar reuniões: {e}')
            )
