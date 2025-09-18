#!/usr/bin/env python3
"""
Script para testar endpoint de criação de reunião
"""

import requests
import json

def main():
    print("🚀 TESTE DE CRIAÇÃO DE REUNIÃO")
    print("=" * 50)
    
    try:
        # Testar endpoint
        response = requests.post("http://localhost:8000/api/test-real-google-meet/")
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCESSO!")
            print(f"Event ID: {data.get('event_id')}")
            print(f"Meet Link: {data.get('meet_link')}")
        else:
            print("❌ ERRO!")
            try:
                error_data = response.json()
                print(f"Erro: {error_data}")
            except:
                print(f"Erro: {response.text}")
                
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")

if __name__ == "__main__":
    main()
