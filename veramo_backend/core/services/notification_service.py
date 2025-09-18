from typing import Optional, List
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

try:
    import requests  # type: ignore
except Exception:  # requests pode não estar instalado em alguns ambientes
    requests = None  # fallback


def _format_datetime(date, start_time, end_time) -> str:
    try:
        data_str = date.strftime('%d/%m/%Y')
        inicio_str = start_time.strftime('%H:%M')
        fim_str = end_time.strftime('%H:%M')
        return f"{data_str} das {inicio_str} às {fim_str}"
    except Exception:
        return "(horário não disponível)"


def _sanitize_phone(phone: Optional[str]) -> Optional[str]:
    if not phone:
        return None
    digits = ''.join(ch for ch in phone if ch.isdigit())
    # Se não vier com DDI, assume Brasil (+55)
    if digits and not digits.startswith('55') and len(digits) in (10, 11):
        digits = '55' + digits
    return f"+{digits}" if digits else None


def _send_email(subject: str, body: str, recipients: List[str]) -> None:
    if not recipients:
        return
    send_mail(
        subject=subject,
        message=body,
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@veramo.local'),
        recipient_list=recipients,
        fail_silently=True,
    )


def _send_whatsapp_text(phone_e164: str, message: str) -> None:
    if not getattr(settings, 'WHATSAPP_ENABLED', False):
        return
    provider = getattr(settings, 'WHATSAPP_PROVIDER', 'meta')
    if provider == 'meta':
        # WhatsApp Cloud API
        if not requests:
            return
        token = getattr(settings, 'WHATSAPP_TOKEN', '')
        phone_id = getattr(settings, 'WHATSAPP_PHONE_ID', '')
        if not token or not phone_id:
            return
        url = f"https://graph.facebook.com/v17.0/{phone_id}/messages"
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        }
        payload = {
            'messaging_product': 'whatsapp',
            'to': phone_e164,
            'type': 'text',
            'text': {'body': message[:4096]},  # limite de segurança
        }
        try:
            requests.post(url, headers=headers, json=payload, timeout=10)
        except Exception:
            pass
    else:
        # Espaço para provedores customizados via webhook
        pass


def notify_agendamento(schedule, processo) -> None:
    """Envia e-mail e WhatsApp ao funcionário com dia/horário e link da videoconferência.
    Não levanta exceções (fail-silent)."""

    try:
        when_str = _format_datetime(schedule.date, schedule.start_time, schedule.end_time)
        meet_link = schedule.video_link or getattr(processo, 'video_link', '') or ''

        # Coleta de contatos
        email = getattr(processo, 'email_funcionario', None) or getattr(schedule.employee, 'email', None)
        phone = getattr(processo, 'telefone_funcionario', None) or getattr(schedule.employee, 'phone', None)
        phone_e164 = _sanitize_phone(phone)

        # Montagem de mensagem
        subject = "Homologação agendada"
        body = (
            f"Olá {getattr(processo, 'nome_funcionario', getattr(schedule.employee, 'name', ''))},\n\n"
            f"Sua homologação foi agendada para {when_str}.\n"
            f"Empresa: {getattr(processo.empresa, 'name', '')}\n"
            f"Sindicato: {getattr(processo.sindicato, 'name', '')}\n"
            f"Link da videoconferência: {meet_link}\n\n"
            f"Por favor, esteja disponível alguns minutos antes do horário."
        )

        # E-mail
        if email:
            _send_email(subject=subject, body=body, recipients=[email])

        # WhatsApp
        if phone_e164:
            _send_whatsapp_text(phone_e164, body)

    except Exception:
        # Never break main flow
        pass



def notify_homologador_pendente_meet(schedule) -> None:
    """Notifica o homologador responsável que o agendamento foi criado
    sem link de Google Meet e que ele deve criar a reunião manualmente
    na sua agenda e informar o link no sistema.

    Não levanta exceções (fail-silent).
    """
    try:
        homologador = getattr(schedule, 'union_user', None)
        if not homologador or not getattr(homologador, 'email', None):
            return

        when_str = _format_datetime(schedule.date, schedule.start_time, schedule.end_time)

        subject = "Ação necessária: informe o link do Meet para a homologação"
        body = (
            f"Olá {getattr(homologador, 'first_name', '')},\n\n"
            f"Foi criado um agendamento de homologação para {when_str}.\n"
            f"Como o Google não está conectado para este homologador, \n"
            f"é necessário criar manualmente uma reunião no Google Calendar/Meet e informar o link no sistema.\n\n"
            f"Passos:\n"
            f"1) Crie o evento no Google Calendar para o horário acima (com Google Meet).\n"
            f"2) Copie o link do Meet gerado.\n"
            f"3) No sistema Veramo, acesse Sindicato » Agendamentos e cole o link na ação 'Definir/Atualizar link'.\n\n"
            f"Observação: o link ficará visível para empresa e trabalhador assim que salvo."
        )

        _send_email(subject=subject, body=body, recipients=[homologador.email])

        phone_e164 = _sanitize_phone(getattr(homologador, 'phone', None))
        if phone_e164:
            _send_whatsapp_text(
                phone_e164,
                f"Ação necessária: informe o link do Meet para a homologação de {when_str}. Crie no Calendar e cole o link no Veramo."
            )
    except Exception:
        # Never break main flow
        pass
