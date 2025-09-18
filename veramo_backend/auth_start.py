import os
from urllib.parse import urlencode
from dotenv import load_dotenv

load_dotenv('google_config.env')

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

params = {
  "client_id": CLIENT_ID,
  "redirect_uri": REDIRECT_URI,
  "response_type": "code",
  "scope": "https://www.googleapis.com/auth/calendar.events",
  "access_type": "offline",
  "include_granted_scopes": "true",
  "prompt": "consent",
}

print("Abra esta URL no navegador:\n")
print("https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params))