#!/usr/bin/env python
import os
import django
from datetime import datetime

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'veramo_backend.settings.dev')
django.setup()

from core.models import DemissaoProcess, Company, Union, User

def create_test_process():
    """Cria um processo de teste para agendamento"""
    
    # Buscar empresa e sindicato existentes
    empresa = Company.objects.first()
    sindicato = Union.objects.first()
    
    if not empresa or not sindicato:
        print("❌ Não há empresa ou sindicato cadastrados")
        return None
    
    # Criar processo de teste
    processo = DemissaoProcess.objects.create(
        nome_funcionario="Funcionário Teste",
        empresa=empresa,
        sindicato=sindicato,
        motivo="Teste de agendamento",
        status="documentos_aprovados",  # Status necessário para agendar
        email_funcionario="funcionario.teste@email.com"
    )
    
    print(f"✅ Processo de teste criado:")
    print(f"   ID: {processo.id}")
    print(f"   Nome: {processo.nome_funcionario}")
    print(f"   Status: {processo.status}")
    print(f"   Empresa: {processo.empresa.name}")
    print(f"   Sindicato: {processo.sindicato.name}")
    
    return processo

if __name__ == "__main__":
    processo = create_test_process()
    if processo:
        print(f"\n🧪 Para testar o agendamento:")
        print(f"   POST /api/demissao-processes/{processo.id}/agendar/")
        print(f"   Com dados: start, end, date")
