#!/usr/bin/env python
import requests
import json
from datetime import datetime, timedelta

def test_agendamento_processo_18():
    """Testa agendamento do processo 18"""
    
    # Dados para agendamento
    amanha = datetime.now() + timedelta(days=1)
    data_agendamento = amanha.strftime("%Y-%m-%d")
    
    dados = {
        "start": "14:00:00",
        "end": "15:00:00",
        "date": data_agendamento
    }
    
    url = "http://localhost:8000/api/demissao-processes/18/agendar/"
    
    print(f"🧪 Testando agendamento do processo 18...")
    print(f"📅 Data: {data_agendamento}")
    print(f"⏰ Horário: {dados['start']} - {dados['end']}")
    
    try:
        response = requests.post(url, json=dados)
        
        print(f"\n📊 Status Code: {response.status_code}")
        print(f"📄 Response: {response.text}")
        
        if response.status_code == 201:
            data = response.json()
            print("✅ SUCESSO! Agendamento criado:")
            print(f"   Schedule ID: {data.get('schedule_id')}")
            print(f"   Video Link: {data.get('video_link')}")
        elif response.status_code == 400:
            try:
                error_data = response.json()
                print("❌ ERRO 400:")
                for key, value in error_data.items():
                    print(f"   {key}: {value}")
            except:
                print(f"❌ ERRO 400 (texto): {response.text}")
        elif response.status_code == 422:
            try:
                error_data = response.json()
                print("❌ ERRO 422: Homologador sem Google conectado")
                print(f"💡 Solução: {error_data.get('solution')}")
            except:
                print(f"❌ ERRO 422 (texto): {response.text}")
        else:
            print(f"❌ Erro {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"❌ Erro ao conectar: {e}")

if __name__ == "__main__":
    test_agendamento_processo_18()
