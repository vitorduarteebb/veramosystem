#!/usr/bin/env python
import requests
import json

def limpar_homologacoes_via_api():
    """Limpa homologações via API"""
    
    # URL da API (ajuste conforme necessário)
    url = "http://localhost:8000/core/cleanup/homologacoes/"
    
    print("🧹 Limpando homologações via API...")
    print(f"📡 Chamando: {url}")
    
    try:
        # Fazer requisição POST
        response = requests.post(url, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success'):
                print("✅ Limpeza concluída com sucesso!")
                
                contadores = data.get('contadores', {})
                print("\n" + "="*50)
                print("📊 RELATÓRIO DE LIMPEZA")
                print("="*50)
                print(f"📋 Processos de demissão: {contadores.get('processos', 0)}")
                print(f"📄 Documentos: {contadores.get('documentos', 0)}")
                print(f"📅 Agendamentos: {contadores.get('agendamentos', 0)}")
                print(f"📝 Logs: {contadores.get('logs', 0)}")
                print(f"🗂️ Arquivos físicos: {contadores.get('arquivos', 0)}")
                print("="*50)
                print("🎯 Sistema pronto para testar distribuição")
                return True
            else:
                print(f"❌ Erro na API: {data.get('message', 'Erro desconhecido')}")
                return False
        else:
            print(f"❌ Erro HTTP {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Erro de conexão. Verifique se o servidor Django está rodando.")
        print("💡 Execute: python manage.py runserver")
        return False
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False

if __name__ == '__main__':
    print("🧹 Script de Limpeza via API")
    print("="*40)
    
    sucesso = limpar_homologacoes_via_api()
    if sucesso:
        print("\n🎉 Sistema limpo e pronto para novos testes!")
    else:
        print("\n💥 Falha na limpeza. Verifique os logs acima.")
