#!/usr/bin/env python
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'veramo_backend.settings.dev')
django.setup()

from core.models import DemissaoProcess, Document, Schedule, SystemLog
from django.core.files.storage import default_storage

print("🧹 Limpando homologações do sistema...")

# Contadores
contadores = {
    'processos': 0,
    'documentos': 0,
    'agendamentos': 0,
    'logs': 0,
    'arquivos': 0
}

try:
    # 1. Limpar documentos
    print("📄 Removendo documentos...")
    documentos = Document.objects.all()
    for doc in documentos:
        if doc.file and default_storage.exists(doc.file.name):
            default_storage.delete(doc.file.name)
            contadores['arquivos'] += 1
        contadores['documentos'] += 1
    
    Document.objects.all().delete()
    print(f"✅ {contadores['documentos']} documentos removidos")
    
    # 2. Limpar processos
    print("📋 Removendo processos de demissão...")
    processos = DemissaoProcess.objects.all()
    for processo in processos:
        if processo.documento_assinado_empresa and default_storage.exists(processo.documento_assinado_empresa.name):
            default_storage.delete(processo.documento_assinado_empresa.name)
            contadores['arquivos'] += 1
        if processo.documento_assinado_sindicato and default_storage.exists(processo.documento_assinado_sindicato.name):
            default_storage.delete(processo.documento_assinado_sindicato.name)
            contadores['arquivos'] += 1
        if processo.documento_assinado_trabalhador and default_storage.exists(processo.documento_assinado_trabalhador.name):
            default_storage.delete(processo.documento_assinado_trabalhador.name)
            contadores['arquivos'] += 1
        contadores['processos'] += 1
    
    DemissaoProcess.objects.all().delete()
    print(f"✅ {contadores['processos']} processos removidos")
    
    # 3. Limpar agendamentos
    print("📅 Removendo agendamentos...")
    contadores['agendamentos'] = Schedule.objects.count()
    Schedule.objects.all().delete()
    print(f"✅ {contadores['agendamentos']} agendamentos removidos")
    
    # 4. Limpar logs relacionados
    print("📝 Removendo logs relacionados...")
    logs_homologacao = SystemLog.objects.filter(
        action__in=[
            'DOCUMENT_UPLOADED',
            'DOCUMENT_APPROVED', 
            'DOCUMENT_REJECTED',
            'HOMOLOGATION_COMPLETED',
            'SCHEDULE_CREATED',
            'SCHEDULE_UPDATED',
            'SCHEDULE_DELETED'
        ]
    )
    contadores['logs'] = logs_homologacao.count()
    logs_homologacao.delete()
    print(f"✅ {contadores['logs']} logs removidos")
    
    # Relatório
    print("\n" + "="*40)
    print("📊 RELATÓRIO DE LIMPEZA")
    print("="*40)
    print(f"📋 Processos: {contadores['processos']}")
    print(f"📄 Documentos: {contadores['documentos']}")
    print(f"📅 Agendamentos: {contadores['agendamentos']}")
    print(f"📝 Logs: {contadores['logs']}")
    print(f"🗂️ Arquivos: {contadores['arquivos']}")
    print("="*40)
    print("✅ Limpeza concluída!")
    print("🎯 Sistema pronto para testar distribuição")
    
except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc()
