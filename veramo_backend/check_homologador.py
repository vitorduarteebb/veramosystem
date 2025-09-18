#!/usr/bin/env python
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'veramo_backend.settings.dev')
django.setup()

from core.models import DemissaoProcess, Schedule, User
from app_google.models import GoogleOAuthToken

def check_processo_homologador(processo_id):
    """Verifica qual homologador está designado para um processo"""
    try:
        processo = DemissaoProcess.objects.get(id=processo_id)
        print(f"=== PROCESSO {processo_id} ===")
        print(f"Nome: {processo.nome_funcionario}")
        print(f"Empresa: {processo.empresa.name}")
        print(f"Sindicato: {processo.sindicato.name}")
        print(f"Status: {processo.status}")
        
        # Buscar agendamento relacionado
        schedule = Schedule.objects.filter(
            employee__name=processo.nome_funcionario,
            company=processo.empresa
        ).first()
        
        if schedule and schedule.union_user:
            homologador = schedule.union_user
            print(f"\n=== HOMOLOGADOR DESIGNADO ===")
            print(f"ID: {homologador.id}")
            print(f"Nome: {homologador.first_name} {homologador.last_name}")
            print(f"Email: {homologador.email}")
            print(f"Role: {homologador.role}")
            
            # Verificar se tem Google conectado
            token = GoogleOAuthToken.objects.filter(homologador_id=homologador.id).first()
            if token:
                print(f"\n=== GOOGLE OAUTH STATUS ===")
                print(f"✅ Google conectado!")
                print(f"Email Google: {token.email_google}")
                print(f"Tem refresh_token: {'✅' if token.refresh_token else '❌'}")
                print(f"Expira em: {token.token_expiry}")
                print(f"Criado em: {token.created_at}")
            else:
                print(f"\n=== GOOGLE OAUTH STATUS ===")
                print(f"❌ Google NÃO conectado")
                print(f"URL para conectar: http://localhost:8000/api/homologadores/{homologador.id}/google/auth-url/")
        else:
            print(f"\n❌ Nenhum agendamento encontrado para este processo")
            
    except DemissaoProcess.DoesNotExist:
        print(f"❌ Processo {processo_id} não encontrado")
    except Exception as e:
        print(f"❌ Erro: {e}")

def list_homologadores():
    """Lista todos os homologadores e seu status de Google"""
    print(f"\n=== TODOS OS HOMOLOGADORES ===")
    homologadores = User.objects.filter(role__startswith='union_')
    
    for h in homologadores:
        token = GoogleOAuthToken.objects.filter(homologador_id=h.id).first()
        status = "✅ Conectado" if token and token.refresh_token else "❌ Não conectado"
        print(f"ID {h.id}: {h.first_name} {h.last_name} ({h.email}) - {status}")

if __name__ == "__main__":
    # Verificar processo específico
    check_processo_homologador(17)
    
    # Listar todos os homologadores
    list_homologadores()
