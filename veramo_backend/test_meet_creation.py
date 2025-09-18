#!/usr/bin/env python
import requests
import json

def test_meet_creation(processo_id):
    """Testa criação de link do Google Meet"""
    url = f"http://localhost:8000/api/demissao-processes/{processo_id}/gerar-link-meet/"
    
    print(f"🧪 Testando criação de Google Meet para processo {processo_id}...")
    
    try:
        response = requests.post(url)
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCESSO! Google Meet criado:")
            print(f"🔗 Link: {data.get('video_link')}")
            print(f"📅 Event ID: {data.get('meet_info', {}).get('event_id')}")
            print(f"📧 Meet Link: {data.get('meet_info', {}).get('meet_link')}")
        elif response.status_code == 422:
            data = response.json()
            print("❌ ERRO 422: Homologador sem Google conectado")
            print(f"💡 Solução: {data.get('solution')}")
        else:
            print(f"❌ Erro {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"❌ Erro ao conectar: {e}")

if __name__ == "__main__":
    # Testar processo 17
    test_meet_creation(17)
