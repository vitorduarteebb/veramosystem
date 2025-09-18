#!/usr/bin/env python
import requests
import json

def get_auth_url(homologador_id):
    """Obtém URL de autorização para homologador"""
    url = f"http://localhost:8000/api/homologadores/{homologador_id}/google/auth-url/"
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            auth_url = data.get('auth_url')
            print(f"✅ URL de autorização gerada para homologador {homologador_id}:")
            print(f"\n{auth_url}\n")
            print("📋 INSTRUÇÕES:")
            print("1. Copie a URL acima")
            print("2. Cole no navegador")
            print("3. Faça login com a conta Google do homologador")
            print("4. Aceite as permissões")
            print("5. Você verá: 'Google conectado! Pode fechar esta aba.'")
            return auth_url
        else:
            print(f"❌ Erro {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Erro ao conectar: {e}")
        return None

if __name__ == "__main__":
    # Gerar URL para homologador 11 (designado no processo 17)
    get_auth_url(11)
