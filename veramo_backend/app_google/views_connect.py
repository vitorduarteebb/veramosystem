# app_google/views_connect.py
import os, json, secrets
from urllib.parse import urlencode
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_GET
from django.core.cache import cache

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")  # http://localhost:8000/oauth2callback
SCOPE = "https://www.googleapis.com/auth/calendar.events"

@require_GET
def google_auth_url(request, homologador_id: int):
    if not GOOGLE_CLIENT_ID or not GOOGLE_REDIRECT_URI:
        return HttpResponseBadRequest("Config Google ausente.")
    # CSRF state amarrando ao homologador
    state = f"h:{homologador_id}:{secrets.token_urlsafe(16)}"
    cache.set(f"oauth_state:{state}", True, 600)  # 10 min
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPE,
        "access_type": "offline",
        "include_granted_scopes": "true",
        "prompt": "consent",
        "state": state,
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return JsonResponse({"auth_url": url})
