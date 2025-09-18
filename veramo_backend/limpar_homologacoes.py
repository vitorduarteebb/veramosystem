#!/usr/bin/env python
"""
Script para limpar todas as homologações do sistema
Este script remove todos os dados relacionados aos processos de homologação
"""

import os
import sys
import django
from django.conf import settings

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'veramo_backend.settings.dev')
django.setup()

from core.models import DemissaoProcess, Document, Schedule, SystemLog
from django.core.files.storage import default_storage
import shutil

def limpar_homologacoes():
    """Limpa todas as homologações do sistema"""
    
    print("🧹 Iniciando limpeza das homologações...")
    
    # Contadores para relatório
    contadores = {
        'processos': 0,
        'documentos': 0,
        'agendamentos': 0,
        'logs': 0,
        'arquivos': 0
    }
    
    try:
        # 1. Limpar documentos (primeiro para evitar problemas de foreign key)
        print("📄 Removendo documentos...")
        documentos = Document.objects.all()
        for doc in documentos:
            # Remover arquivo físico se existir
            if doc.file and default_storage.exists(doc.file.name):
                default_storage.delete(doc.file.name)
                contadores['arquivos'] += 1
            contadores['documentos'] += 1
        
        Document.objects.all().delete()
        print(f"   ✅ {contadores['documentos']} documentos removidos")
        
        # 2. Limpar processos de demissão
        print("📋 Removendo processos de demissão...")
        processos = DemissaoProcess.objects.all()
        for processo in processos:
            # Remover arquivos de assinatura se existirem
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
        print(f"   ✅ {contadores['processos']} processos removidos")
        
        # 3. Limpar agendamentos
        print("📅 Removendo agendamentos...")
        agendamentos = Schedule.objects.all()
        contadores['agendamentos'] = agendamentos.count()
        Schedule.objects.all().delete()
        print(f"   ✅ {contadores['agendamentos']} agendamentos removidos")
        
        # 4. Limpar logs relacionados às homologações
        print("📝 Removendo logs relacionados às homologações...")
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
        print(f"   ✅ {contadores['logs']} logs removidos")
        
        # 5. Limpar diretórios de arquivos relacionados
        print("🗂️ Limpando diretórios de arquivos...")
        try:
            # Limpar diretório de documentos
            if os.path.exists('media/documents/'):
                shutil.rmtree('media/documents/')
                print("   ✅ Diretório 'media/documents/' removido")
            
            # Limpar diretório de assinaturas
            if os.path.exists('media/assinaturas/'):
                shutil.rmtree('media/assinaturas/')
                print("   ✅ Diretório 'media/assinaturas/' removido")
                
        except Exception as e:
            print(f"   ⚠️ Erro ao limpar diretórios: {e}")
        
        # Relatório final
        print("\n" + "="*50)
        print("📊 RELATÓRIO DE LIMPEZA")
        print("="*50)
        print(f"📋 Processos de demissão: {contadores['processos']}")
        print(f"📄 Documentos: {contadores['documentos']}")
        print(f"📅 Agendamentos: {contadores['agendamentos']}")
        print(f"📝 Logs: {contadores['logs']}")
        print(f"🗂️ Arquivos físicos: {contadores['arquivos']}")
        print("="*50)
        print("✅ Limpeza concluída com sucesso!")
        print("🎯 Sistema pronto para testar distribuição")
        
    except Exception as e:
        print(f"❌ Erro durante a limpeza: {e}")
        return False
    
    return True

def confirmar_limpeza():
    """Solicita confirmação do usuário antes de executar a limpeza"""
    print("⚠️  ATENÇÃO: Esta operação irá remover TODAS as homologações do sistema!")
    print("📋 Serão removidos:")
    print("   • Todos os processos de demissão")
    print("   • Todos os documentos enviados")
    print("   • Todos os agendamentos")
    print("   • Logs relacionados às homologações")
    print("   • Arquivos físicos (PDFs, assinaturas)")
    print()
    
    resposta = input("🤔 Tem certeza que deseja continuar? (digite 'SIM' para confirmar): ")
    
    if resposta.upper() == 'SIM':
        return True
    else:
        print("❌ Operação cancelada pelo usuário")
        return False

if __name__ == '__main__':
    print("🧹 Script de Limpeza de Homologações")
    print("="*40)
    
    if confirmar_limpeza():
        sucesso = limpar_homologacoes()
        if sucesso:
            print("\n🎉 Sistema limpo e pronto para novos testes!")
        else:
            print("\n💥 Falha na limpeza. Verifique os logs acima.")
            sys.exit(1)
    else:
        sys.exit(0)
