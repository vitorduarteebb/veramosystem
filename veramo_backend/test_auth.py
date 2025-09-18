#!/usr/bin/env python
import requests
import json

def test_auth_with_token():
    """Testa autenticação com token JWT"""
    
    # Token do log (você pode substituir por um token atual)
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90e…6MTF9.OJf09le8rU0Yu6YvIgF-2W04ZDy7xil3HSz-4175OOI"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Testar endpoint de processos
    url_processos = "http://localhost:8000/api/demissao-processes/?sindicato=2"
    
    print("🔍 Testando autenticação...")
    
    try:
        response = requests.get(url_processos, headers=headers)
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Autenticação OK!")
            print(f"📋 Processos encontrados: {len(data.get('results', []))}")
        elif response.status_code == 401:
            print("❌ Token expirado ou inválido")
            print("💡 Solução: Faça login novamente no frontend")
        else:
            print(f"❌ Erro {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"❌ Erro ao conectar: {e}")

def test_login():
    """Testa login para obter novo token"""
    
    # Dados de login do homologador 11
    login_data = {
        "email": "vitor@gmail.com",
        "password": "sua_senha_aqui"  # Você precisa fornecer a senha
    }
    
    url_login = "http://localhost:8000/auth/jwt/create/"
    
    print("🔐 Testando login...")
    
    try:
        response = requests.post(url_login, json=login_data)
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Login OK!")
            print(f"🔑 Access Token: {data.get('access', '')[:50]}...")
            print(f"🔄 Refresh Token: {data.get('refresh', '')[:50]}...")
            return data
        else:
            print(f"❌ Erro no login: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Erro ao conectar: {e}")
        return None

if __name__ == "__main__":
    # Testar autenticação atual
    test_auth_with_token()
    
    print("\n" + "="*50)
    print("💡 Para obter novo token, execute:")
    print("   python test_auth.py --login")
    print("   (E forneça a senha do vitor@gmail.com)")
