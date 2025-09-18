#!/usr/bin/env python3
"""
Script para fazer login OAuth automaticamente
"""

import webbrowser
import time

def main():
    print("🔐 LOGIN OAUTH AUTOMÁTICO")
    print("=" * 50)
    
    # URL de autorização
    auth_url = "https://accounts.google.com/o/oauth2/v2/auth?client_id=858349561629-jos908qgal0t7m2e9bnn7mde785cjhab.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Foauth2callback&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.events&access_type=offline&include_granted_scopes=true&prompt=consent"
    
    print("🚀 Abrindo navegador para login...")
    print(f"URL: {auth_url}")
    
    # Abrir navegador
    webbrowser.open(auth_url)
    
    print()
    print("📋 INSTRUÇÕES:")
    print("1. Faça login no Google")
    print("2. Autorize o aplicativo")
    print("3. Você será redirecionado para o callback")
    print("4. Os tokens serão salvos automaticamente")
    print()
    print("⏳ Aguardando redirecionamento...")
    
    # Aguardar um pouco para o usuário fazer login
    time.sleep(3)
    
    print("✅ Login OAuth iniciado!")
    print("✅ Verifique se o arquivo google_tokens_dev.json foi atualizado")

if __name__ == "__main__":
    main()