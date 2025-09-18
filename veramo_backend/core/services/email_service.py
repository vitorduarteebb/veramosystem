import logging
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from datetime import datetime
import pytz

logger = logging.getLogger(__name__)

class EmailService:
    """Serviço para envio de emails do sistema"""
    
    def __init__(self):
        self.from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@veramo.com.br')
        self.fail_silently = True
    
    def send_agendamento_email(self, schedule, processo=None):
        """Envia email de agendamento para o funcionário"""
        try:
            # Dados do funcionário
            funcionario_email = schedule.employee.email if schedule.employee else None
            funcionario_nome = schedule.employee.name if schedule.employee else 'Funcionário'
            
            if not funcionario_email:
                logger.warning(f"Não foi possível enviar email: funcionário sem email no agendamento {schedule.id}")
                return False
            
            # Dados do agendamento
            data_agendamento = schedule.date.strftime('%d/%m/%Y')
            hora_inicio = schedule.start_time.strftime('%H:%M')
            hora_fim = schedule.end_time.strftime('%H:%M')
            
            # Link da videoconferência
            video_link = schedule.video_link or schedule.google_meet_link or 'Link será disponibilizado em breve'
            
            # Dados da empresa e sindicato
            empresa_nome = schedule.company.name if schedule.company else 'Empresa'
            sindicato_nome = schedule.union.name if schedule.union else 'Sindicato'
            homologador_nome = schedule.union_user.name if schedule.union_user else 'Homologador'
            
            # Preparar dados para o template
            context = {
                'funcionario_nome': funcionario_nome,
                'data_agendamento': data_agendamento,
                'hora_inicio': hora_inicio,
                'hora_fim': hora_fim,
                'video_link': video_link,
                'empresa_nome': empresa_nome,
                'sindicato_nome': sindicato_nome,
                'homologador_nome': homologador_nome,
                'processo_id': schedule.id,
                'motivo': processo.motivo if processo else 'Homologação de Demissão'
            }
            
            # Renderizar template HTML
            html_message = render_to_string('emails/agendamento_funcionario.html', context)
            
            # Versão texto simples
            plain_message = f"""
Olá {funcionario_nome},

Você tem um agendamento de homologação marcado:

📅 Data: {data_agendamento}
🕐 Horário: {hora_inicio} às {hora_fim}
🏢 Empresa: {empresa_nome}
🏛️ Sindicato: {sindicato_nome}
👤 Homologador: {homologador_nome}
📋 Motivo: {context['motivo']}

🔗 Link da Videoconferência: {video_link}

Por favor, esteja presente no horário agendado para a realização da homologação.

Atenciosamente,
Equipe Veramo
            """.strip()
            
            # Assunto do email
            subject = f'Agendamento de Homologação - {data_agendamento} às {hora_inicio}'
            
            # Enviar email
            result = send_mail(
                subject=subject,
                message=plain_message,
                from_email=self.from_email,
                recipient_list=[funcionario_email],
                html_message=html_message,
                fail_silently=self.fail_silently
            )
            
            if result:
                logger.info(f"Email de agendamento enviado com sucesso para {funcionario_email} (agendamento {schedule.id})")
                return True
            else:
                logger.error(f"Falha ao enviar email para {funcionario_email} (agendamento {schedule.id})")
                return False
                
        except Exception as e:
            logger.error(f"Erro ao enviar email de agendamento: {str(e)}")
            return False
    
    def send_agendamento_alterado_email(self, schedule, processo=None, old_user=None, new_user=None):
        """Envia email quando o agendamento é alterado"""
        try:
            # Dados do funcionário
            funcionario_email = schedule.employee.email if schedule.employee else None
            funcionario_nome = schedule.employee.name if schedule.employee else 'Funcionário'
            
            if not funcionario_email:
                logger.warning(f"Não foi possível enviar email: funcionário sem email no agendamento {schedule.id}")
                return False
            
            # Dados do agendamento
            data_agendamento = schedule.date.strftime('%d/%m/%Y')
            hora_inicio = schedule.start_time.strftime('%H:%M')
            hora_fim = schedule.end_time.strftime('%H:%M')
            
            # Link da videoconferência
            video_link = schedule.video_link or schedule.google_meet_link or 'Link será disponibilizado em breve'
            
            # Dados da empresa e sindicato
            empresa_nome = schedule.company.name if schedule.company else 'Empresa'
            sindicato_nome = schedule.union.name if schedule.union else 'Sindicato'
            homologador_nome = schedule.union_user.name if schedule.union_user else 'Homologador'
            
            # Preparar dados para o template
            context = {
                'funcionario_nome': funcionario_nome,
                'data_agendamento': data_agendamento,
                'hora_inicio': hora_inicio,
                'hora_fim': hora_fim,
                'video_link': video_link,
                'empresa_nome': empresa_nome,
                'sindicato_nome': sindicato_nome,
                'homologador_nome': homologador_nome,
                'processo_id': schedule.id,
                'motivo': processo.motivo if processo else 'Homologação de Demissão',
                'alterado': True,
                'old_homologador': old_user.name if old_user else None,
                'new_homologador': new_user.name if new_user else None
            }
            
            # Renderizar template HTML
            html_message = render_to_string('emails/agendamento_funcionario.html', context)
            
            # Versão texto simples
            plain_message = f"""
Olá {funcionario_nome},

Seu agendamento de homologação foi alterado:

📅 Data: {data_agendamento}
🕐 Horário: {hora_inicio} às {hora_fim}
🏢 Empresa: {empresa_nome}
🏛️ Sindicato: {sindicato_nome}
👤 Homologador: {homologador_nome}
📋 Motivo: {context['motivo']}

🔗 Link da Videoconferência: {video_link}

Por favor, esteja presente no horário agendado para a realização da homologação.

Atenciosamente,
Equipe Veramo
            """.strip()
            
            # Assunto do email
            subject = f'Agendamento Alterado - {data_agendamento} às {hora_inicio}'
            
            # Enviar email
            result = send_mail(
                subject=subject,
                message=plain_message,
                from_email=self.from_email,
                recipient_list=[funcionario_email],
                html_message=html_message,
                fail_silently=self.fail_silently
            )
            
            if result:
                logger.info(f"Email de agendamento alterado enviado com sucesso para {funcionario_email} (agendamento {schedule.id})")
                return True
            else:
                logger.error(f"Falha ao enviar email para {funcionario_email} (agendamento {schedule.id})")
                return False
                
        except Exception as e:
            logger.error(f"Erro ao enviar email de agendamento alterado: {str(e)}")
            return False
