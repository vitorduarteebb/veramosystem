#!/usr/bin/env python3
"""
Script de teste RÁPIDO - Validar auth_url com porta 8000
"""

import os
import django
import logging

# Configurar logging detalhado
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'veramo_backend.settings.dev')
django.setup()

from google_auth_oauthlib.flow import InstalledAppFlow

def main():
    print("🔍 TESTE RÁPIDO - VALIDAR AUTH_URL")
    print("=" * 50)
    print("📋 Verificando redirect_uri na auth_url...")
    print()
    
    try:
        # Configurar o flow exatamente como no GoogleMeetService
        GOOGLE_REDIRECT = "http://localhost:8000/oauth2callback"
        SCOPES = ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/calendar.events"]
        
        flow = InstalledAppFlow.from_client_secrets_file("client_secret.json", SCOPES)
        flow.redirect_uri = GOOGLE_REDIRECT
        
        # Gerar auth_url
        auth_url, state = flow.authorization_url(
            access_type="offline",
            include_granted_scopes=True,
            prompt="consent",
        )
        
        print("✅ AUTH_URL GERADA:")
        print("=" * 50)
        print(auth_url)
        print("=" * 50)
        print()
        
        # Extrair redirect_uri da URL
        import urllib.parse
        parsed_url = urllib.parse.urlparse(auth_url)
        query_params = urllib.parse.parse_qs(parsed_url.query)
        
        redirect_uri_param = query_params.get('redirect_uri', ['NÃO ENCONTRADO'])
        redirect_uri_decoded = urllib.parse.unquote(redirect_uri_param[0]) if redirect_uri_param[0] != 'NÃO ENCONTRADO' else 'NÃO ENCONTRADO'
        
        print("🔍 ANÁLISE DA AUTH_URL:")
        print(f"   redirect_uri (encoded): {redirect_uri_param[0]}")
        print(f"   redirect_uri (decoded): {redirect_uri_decoded}")
        print(f"   Esperado: {GOOGLE_REDIRECT}")
        print()
        
        if redirect_uri_decoded == GOOGLE_REDIRECT:
            print("✅ PERFEITO! redirect_uri está correto!")
            print("✅ Agora adicione EXATAMENTE esta URI no Google Cloud Console:")
            print(f"   {GOOGLE_REDIRECT}")
        else:
            print("❌ PROBLEMA! redirect_uri não está correto!")
            print(f"❌ Esperado: {GOOGLE_REDIRECT}")
            print(f"❌ Encontrado: {redirect_uri_decoded}")
        
        print()
        print("📋 PRÓXIMOS PASSOS:")
        print("1. Copie a auth_url acima")
        print("2. Abra no navegador")
        print("3. Faça login no Google")
        print("4. Deve redirecionar para http://localhost:8000/oauth2callback sem erro")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        print(traceback.format_exc())

if __name__ == "__main__":
    main()
