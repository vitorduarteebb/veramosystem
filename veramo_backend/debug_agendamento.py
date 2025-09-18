#!/usr/bin/env python
import requests
import json

def debug_agendamento(processo_id):
    """Debug do processo de agendamento"""
    print(f"🔍 Debugando agendamento do processo {processo_id}...")
    
    # 1. Verificar dados do processo
    url_processo = f"http://localhost:8000/api/demissao-processes/{processo_id}/"
    try:
        response = requests.get(url_processo)
        if response.status_code == 200:
            processo = response.json()
            print(f"✅ Processo encontrado:")
            print(f"   Nome: {processo.get('nome_funcionario')}")
            print(f"   Status: {processo.get('status')}")
            print(f"   Empresa: {processo.get('empresa', {}).get('name')}")
            print(f"   Sindicato: {processo.get('sindicato', {}).get('name')}")
        else:
            print(f"❌ Erro ao buscar processo: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Erro ao conectar: {e}")
        return
    
    # 2. Verificar homologador conectado
    print(f"\n🔍 Verificando homologadores conectados...")
    url_homologadores = "http://localhost:8000/api/users/?role=union_master"
    try:
        response = requests.get(url_homologadores)
        if response.status_code == 200:
            homologadores = response.json().get('results', [])
            print(f"📋 Homologadores disponíveis:")
            for h in homologadores:
                print(f"   ID {h.get('id')}: {h.get('first_name')} {h.get('last_name')} ({h.get('email')})")
        else:
            print(f"❌ Erro ao buscar homologadores: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro ao buscar homologadores: {e}")
    
    # 3. Testar agendamento com dados mínimos
    print(f"\n🧪 Testando agendamento...")
    url_agendar = f"http://localhost:8000/api/demissao-processes/{processo_id}/agendar/"
    
    # Dados de teste
    dados_teste = {
        "start": "14:00:00",
        "end": "15:00:00", 
        "date": "2024-01-15"
    }
    
    try:
        response = requests.post(url_agendar, json=dados_teste)
        print(f"📊 Status: {response.status_code}")
        print(f"📄 Response: {response.text}")
        
        if response.status_code == 400:
            try:
                error_data = response.json()
                print(f"❌ Erro 400 detalhado:")
                for key, value in error_data.items():
                    print(f"   {key}: {value}")
            except:
                print(f"❌ Erro 400 (texto): {response.text}")
                
    except Exception as e:
        print(f"❌ Erro ao testar agendamento: {e}")

if __name__ == "__main__":
    debug_agendamento(17)
