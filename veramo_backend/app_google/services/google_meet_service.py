# app_google/services/google_meet_service.py
import os, uuid, datetime
from django.utils import timezone
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from app_google.models import GoogleOAuthToken

def _build_creds(token):
    return Credentials(
        token=token.access_token,
        refresh_token=token.refresh_token or None,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        scopes=["https://www.googleapis.com/auth/calendar.events"],
    )

def criar_meet_para_homologador(homologador_id: int, titulo: str, inicio_local, fim_local, attendees_emails, tz="America/Sao_Paulo"):
    """
    Cria um evento no Google Calendar do homologador com Google Meet.
    
    Args:
        homologador_id: ID do homologador
        titulo: Título do evento
        inicio_local: datetime com timezone (ex: America/Sao_Paulo)
        fim_local: datetime com timezone (ex: America/Sao_Paulo)
        attendees_emails: Lista de emails dos participantes
        tz: Timezone do evento (padrão: America/Sao_Paulo)
    
    Returns:
        dict: {"event_id": str, "meet_link": str}
    
    Raises:
        PermissionError: Se homologador não tem Google conectado
        HttpError: Se falha na API do Google
    """
    token = (GoogleOAuthToken.objects
             .filter(homologador_id=homologador_id)
             .order_by("-updated_at")
             .first())
    if not token or not token.refresh_token:
        raise PermissionError("Homologador sem Google conectado.")

    creds = _build_creds(token)
    service = build("calendar", "v3", credentials=creds)

    # Converte para UTC, mas informa o tz no body (Calendar aceita ambos)
    inicio_utc = inicio_local.astimezone(datetime.timezone.utc)
    fim_utc = fim_local.astimezone(datetime.timezone.utc)

    body = {
        "summary": titulo,
        "start": {"dateTime": inicio_utc.isoformat(), "timeZone": tz},
        "end":   {"dateTime": fim_utc.isoformat(),    "timeZone": tz},
        "attendees": [{"email": e} for e in attendees_emails],
        "conferenceData": {
            "createRequest": {
                "requestId": str(uuid.uuid4()),
                "conferenceSolutionKey": {"type": "hangoutsMeet"}
            }
        },
        "guestsCanModify": False,
        "guestsCanSeeOtherGuests": True,
    }

    event = service.events().insert(
        calendarId="primary",
        body=body,
        conferenceDataVersion=1,
        sendUpdates="all",
    ).execute()

    meet = event.get("hangoutLink") or event["conferenceData"]["entryPoints"][0]["uri"]

    # Salva access_token atualizado se tiver refresh automático
    if creds.token and creds.token != token.access_token:
        token.access_token = creds.token
        token.token_expiry = timezone.now() + datetime.timedelta(seconds=3500)
        token.save(update_fields=["access_token", "token_expiry"])

    return {"event_id": event["id"], "meet_link": meet}

def verificar_disponibilidade_homologador(homologador_id: int, inicio_local, fim_local):
    """
    Verifica se o homologador está disponível no horário especificado.
    
    Args:
        homologador_id: ID do homologador
        inicio_local: datetime com timezone
        fim_local: datetime com timezone
    
    Returns:
        bool: True se disponível, False se ocupado
    
    Raises:
        PermissionError: Se homologador não tem Google conectado
        HttpError: Se falha na API do Google
    """
    token = (GoogleOAuthToken.objects
             .filter(homologador_id=homologador_id)
             .order_by("-updated_at")
             .first())
    if not token or not token.refresh_token:
        raise PermissionError("Homologador sem Google conectado.")

    creds = _build_creds(token)
    service = build("calendar", "v3", credentials=creds)

    inicio_utc = inicio_local.astimezone(datetime.timezone.utc)
    fim_utc = fim_local.astimezone(datetime.timezone.utc)

    busy = service.freebusy().query(body={
        "timeMin": inicio_utc.isoformat(),
        "timeMax": fim_utc.isoformat(),
        "items": [{"id": "primary"}]
    }).execute()["calendars"]["primary"]["busy"]

    return len(busy) == 0

def remarcar_evento_homologador(homologador_id: int, event_id: str, novo_inicio_local, novo_fim_local, tz="America/Sao_Paulo"):
    """
    Remarca um evento existente no calendário do homologador.
    
    Args:
        homologador_id: ID do homologador
        event_id: ID do evento no Google Calendar
        novo_inicio_local: novo datetime com timezone
        novo_fim_local: novo datetime com timezone
        tz: Timezone do evento
    
    Returns:
        dict: {"event_id": str, "meet_link": str}
    
    Raises:
        PermissionError: Se homologador não tem Google conectado
        HttpError: Se falha na API do Google
    """
    token = (GoogleOAuthToken.objects
             .filter(homologador_id=homologador_id)
             .order_by("-updated_at")
             .first())
    if not token or not token.refresh_token:
        raise PermissionError("Homologador sem Google conectado.")

    creds = _build_creds(token)
    service = build("calendar", "v3", credentials=creds)

    novo_inicio_utc = novo_inicio_local.astimezone(datetime.timezone.utc)
    novo_fim_utc = novo_fim_local.astimezone(datetime.timezone.utc)

    body = {
        "start": {"dateTime": novo_inicio_utc.isoformat(), "timeZone": tz},
        "end": {"dateTime": novo_fim_utc.isoformat(), "timeZone": tz},
    }

    event = service.events().patch(
        calendarId="primary",
        eventId=event_id,
        body=body,
        sendUpdates="all"
    ).execute()

    meet = event.get("hangoutLink") or event["conferenceData"]["entryPoints"][0]["uri"]

    return {"event_id": event["id"], "meet_link": meet}

def cancelar_evento_homologador(homologador_id: int, event_id: str):
    """
    Cancela um evento no calendário do homologador.
    
    Args:
        homologador_id: ID do homologador
        event_id: ID do evento no Google Calendar
    
    Returns:
        bool: True se cancelado com sucesso
    
    Raises:
        PermissionError: Se homologador não tem Google conectado
        HttpError: Se falha na API do Google
    """
    token = (GoogleOAuthToken.objects
             .filter(homologador_id=homologador_id)
             .order_by("-updated_at")
             .first())
    if not token or not token.refresh_token:
        raise PermissionError("Homologador sem Google conectado.")

    creds = _build_creds(token)
    service = build("calendar", "v3", credentials=creds)

    service.events().delete(
        calendarId="primary",
        eventId=event_id,
        sendUpdates="all"
    ).execute()

    return True
