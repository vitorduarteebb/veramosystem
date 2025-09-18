import os, uuid
from datetime import datetime, timedelta, timezone
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

class GoogleMeetService:
    def __init__(self, client_id=None, client_secret=None, token_dict=None):
        self.client_id = client_id or os.getenv("GOOGLE_CLIENT_ID")
        self.client_secret = client_secret or os.getenv("GOOGLE_CLIENT_SECRET")
        self.token = token_dict

    def _creds(self):
        return Credentials(
            token=self.token.get("access_token"),
            refresh_token=self.token.get("refresh_token"),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=self.client_id,
            client_secret=self.client_secret,
            scopes=["https://www.googleapis.com/auth/calendar.events"],
        )

    def create_meeting(self, summary="Reunião", minutes_from_now=10, duration=45):
        service = build("calendar", "v3", credentials=self._creds())
        start = datetime.now(timezone.utc) + timedelta(minutes=minutes_from_now)
        end   = start + timedelta(minutes=duration)

        body = {
          "summary": summary,
          "start": {"dateTime": start.isoformat(), "timeZone": "America/Sao_Paulo"},
          "end":   {"dateTime": end.isoformat(),   "timeZone": "America/Sao_Paulo"},
          "conferenceData": {
            "createRequest": {
              "requestId": str(uuid.uuid4()),
              "conferenceSolutionKey": {"type": "hangoutsMeet"}
            }
          }
        }

        event = service.events().insert(
            calendarId="primary",
            body=body,
            conferenceDataVersion=1
        ).execute()

        meet_link = event.get("hangoutLink") or event["conferenceData"]["entryPoints"][0]["uri"]
        return {"event_id": event["id"], "meet_link": meet_link}
