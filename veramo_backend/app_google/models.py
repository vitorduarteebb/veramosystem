# app_google/models.py
from django.db import models

class GoogleOAuthToken(models.Model):
    homologador_id = models.IntegerField(db_index=True)  # ou ForeignKey se existir o modelo Homologador
    email_google = models.EmailField()
    access_token = models.TextField()
    refresh_token = models.TextField()
    token_expiry = models.DateTimeField(null=True, blank=True)
    scopes = models.TextField(blank=True, default="")  # opcional
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("homologador_id", "email_google")
