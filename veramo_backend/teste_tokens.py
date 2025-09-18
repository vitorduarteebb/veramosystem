#!/usr/bin/env python3
"""
Script para testar se os tokens OAuth foram atualizados
"""

import os
import json
import requests
from datetime import datetime

def main():
    print("🔍 TESTE DE TOKENS OAUTH")
    print("=" * 50)
    
    try:
        # Verificar arquivo de tokens
        tokens_path = "google_tokens_dev.json"
        
        if not os.path.exists(tokens_path):
            print("❌ Arquivo de tokens não existe")
            return
        
        with open(tokens_path, 'r', encoding='utf-8') as f:
            tokens = json.load(f)
        
        print("📋 Tokens encontrados:")
        print(f"✅ Access Token: {tokens.get('access_token', 'N/A')[:20]}...")
        print(f"✅ Refresh Token: {'***' if tokens.get('refresh_token') else 'N/A'}")
        print(f"✅ Token Type: {tokens.get('token_type', 'N/A')}")
        print(f"✅ Scope: {tokens.get('scope', 'N/A')}")
        
        # Testar se o token está válido
        access_token = tokens.get('access_token')
        if access_token:
            print("\n🔍 Testando token...")
            
            # Fazer uma requisição para verificar se o token está válido
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Testar com uma requisição simples
            response = requests.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                user_info = response.json()
                print(f"✅ Token válido! Usuário: {user_info.get('email', 'N/A')}")
                print("✅ Pronto para criar reuniões do Google Meet!")
            else:
                print(f"❌ Token inválido! Status: {response.status_code}")
                print(f"❌ Resposta: {response.text}")
                
        else:
            print("❌ Access token não encontrado")
            
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    main()

