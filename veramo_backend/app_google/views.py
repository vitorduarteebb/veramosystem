import os, json, uuid, requests, datetime
from datetime import datetime, timedelta, timezone
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone as django_timezone
from django.core.cache import cache
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv
from app_google.models import GoogleOAuthToken

# Carregar configurações
load_dotenv('google_config.env')

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
TOKEN_URL = "https://oauth2.googleapis.com/token"
USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

TOKENS_PATH = "google_tokens_dev.json"  # DEV: arquivo. Produção: banco.

@csrf_exempt
def oauth2callback(request):
    code = request.GET.get("code")
    state = request.GET.get("state")
    
    # Se não tem state, usa o método antigo (compatibilidade)
    if not state:
        return _legacy_oauth_callback(request, code)
    
    if not code or not cache.get(f"oauth_state:{state}"):
        return HttpResponseBadRequest("Parâmetros inválidos (code/state).")

    cache.delete(f"oauth_state:{state}")
    
    # Extrai homologador_id
    try:
        prefix, homologador_id, _nonce = state.split(":", 2)
        homologador_id = int(homologador_id.replace("h", "")) if prefix != "h" else int(homologador_id)
    except Exception:
        return HttpResponseBadRequest("State inválido.")

    data = {
        "code": code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    r = requests.post(TOKEN_URL, data=data, timeout=20)
    if r.status_code != 200:
        return HttpResponse(f"Erro ao trocar code: {r.status_code}\n{r.text}", status=500)

    tokens = r.json()  # access_token, refresh_token, expires_in, ...
    
    # Descobre e-mail da conta
    ui = requests.get(USERINFO_URL, headers={"Authorization": f"Bearer {tokens['access_token']}"}).json()
    email_google = ui.get("email") or ""

    # Salva/atualiza no BD
    expiry = django_timezone.now() + datetime.timedelta(seconds=tokens.get("expires_in", 0))
    obj, _ = GoogleOAuthToken.objects.update_or_create(
        homologador_id=homologador_id,
        email_google=email_google,
        defaults={
            "access_token": tokens.get("access_token"),
            "refresh_token": tokens.get("refresh_token") or "",
            "token_expiry": expiry,
            "scopes": "https://www.googleapis.com/auth/calendar.events",
        },
    )
    return HttpResponse("Google conectado! Pode fechar esta aba.")

def _legacy_oauth_callback(request, code):
    """Método antigo para compatibilidade"""
    data = {
        "code": code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    r = requests.post(TOKEN_URL, data=data, timeout=20)
    if r.status_code != 200:
        return HttpResponse(f"Erro ao trocar code: {r.status_code}\n{r.text}", status=500)

    tokens = r.json()
    with open(TOKENS_PATH, "w", encoding="utf-8") as f:
        json.dump(tokens, f, ensure_ascii=False, indent=2)

    return HttpResponse("Autenticado! Tokens salvos (google_tokens_dev.json).")

@csrf_exempt
def test_real_google_meet(request):
    """Cria um evento REAL no Calendar e retorna o link do Meet."""
    try:
        with open(TOKENS_PATH, "r", encoding="utf-8") as f:
            t = json.load(f)
            
        # Verificar se tem tokens válidos
        if not t.get('access_token') or not t.get('refresh_token'):
            return JsonResponse({
                "error": "Tokens inválidos. Faça o login OAuth primeiro.",
                "solution": "Execute: python auth_start.py e faça login no Google"
            }, status=400)
            
    except FileNotFoundError:
        return JsonResponse({
            "error": "Sem tokens. Faça o login OAuth primeiro.",
            "solution": "Execute: python auth_start.py e faça login no Google"
        }, status=400)

    creds = Credentials(
        token=t.get("access_token"),
        refresh_token=t.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        scopes=["https://www.googleapis.com/auth/calendar.events"],
    )

    service = build("calendar", "v3", credentials=creds)

    start = datetime.now(timezone.utc) + timedelta(minutes=5)
    end   = start + timedelta(minutes=45)

    body = {
      "summary": "Homologação Veramo",
      "description": "Gerado pelo sistema.",
      "start": {"dateTime": start.isoformat(), "timeZone": "America/Sao_Paulo"},
      "end":   {"dateTime": end.isoformat(),   "timeZone": "America/Sao_Paulo"},
      "conferenceData": {
        "createRequest": {
          "requestId": str(uuid.uuid4()),
          "conferenceSolutionKey": {"type": "hangoutsMeet"}
        }
      },
      # "attendees": [{"email": "alguem@exemplo.com"}],  # opcional
    }

    try:
        event = service.events().insert(
            calendarId="primary",
            body=body,
            conferenceDataVersion=1
        ).execute()

        meet_link = event.get("hangoutLink") or event["conferenceData"]["entryPoints"][0]["uri"]
        return JsonResponse({
            "event_id": event["id"],
            "meet_link": meet_link
        })

    except HttpError as e:
        content = getattr(e, "content", b"").decode("utf-8", "ignore")
        return JsonResponse({
            "error": "HttpError",
            "status": getattr(e, "status_code", None),
            "reason": getattr(e, "reason", str(e)),
            "content": content
        }, status=400)
