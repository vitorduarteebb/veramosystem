#!/usr/bin/env python3
"""
Script para fazer login OAuth completo e salvar tokens
"""

import os
import json
import requests
import webbrowser
import time
from urllib.parse import urlencode

def main():
    print("🔐 LOGIN OAUTH COMPLETO")
    print("=" * 50)
    
    # Configurações - usar variáveis de ambiente
    CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "your-client-id-here")
    CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "your-client-secret-here")
    REDIRECT_URI = "http://localhost:8000/oauth2callback"
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    
    # Gerar URL de autorização
    params = {
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/calendar.events",
        "access_type": "offline",
        "include_granted_scopes": "true",
        "prompt": "consent",
    }
    
    auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    
    print("🚀 Abrindo navegador para login...")
    print(f"URL: {auth_url}")
    
    # Abrir navegador
    webbrowser.open(auth_url)
    
    print()
    print("📋 INSTRUÇÕES:")
    print("1. Faça login no Google")
    print("2. Autorize o aplicativo")
    print("3. Você será redirecionado para o callback")
    print("4. Copie o código da URL (depois de ?code=)")
    print()
    
    # Aguardar o usuário inserir o código
    code = input("📝 Cole o código aqui: ").strip()
    
    if not code:
        print("❌ Código não fornecido")
        return
    
    print("🔄 Trocando código por tokens...")
    
    # Trocar código por tokens
    data = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'code': code,
        'grant_type': 'authorization_code',
        'redirect_uri': REDIRECT_URI,
    }
    
    try:
        response = requests.post(TOKEN_URL, data=data, timeout=20)
        
        if response.status_code == 200:
            tokens = response.json()
            
            # Salvar tokens
            with open("google_tokens_dev.json", "w", encoding="utf-8") as f:
                json.dump(tokens, f, ensure_ascii=False, indent=2)
            
            print("✅ Tokens salvos com sucesso!")
            print(f"✅ Access Token: {tokens.get('access_token', 'N/A')[:20]}...")
            print(f"✅ Refresh Token: {'***' if tokens.get('refresh_token') else 'N/A'}")
            print("✅ Pronto para criar reuniões do Google Meet!")
            
        else:
            print(f"❌ Erro ao trocar código: {response.status_code}")
            print(f"❌ Resposta: {response.text}")
            
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    main()

