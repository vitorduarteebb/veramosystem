from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.files.storage import default_storage
from core.models import DemissaoProcess, Document, Schedule, SystemLog
import os
import shutil
import json

@csrf_exempt
@require_http_methods(["POST"])
def limpar_homologacoes(request):
    """
    Endpoint para limpar todas as homologações do sistema
    """
    try:
        # Contadores para relatório
        contadores = {
            'processos': 0,
            'documentos': 0,
            'agendamentos': 0,
            'logs': 0,
            'arquivos': 0
        }
        
        # 1. Limpar documentos (primeiro para evitar problemas de foreign key)
        documentos = Document.objects.all()
        for doc in documentos:
            # Remover arquivo físico se existir
            if doc.file and default_storage.exists(doc.file.name):
                default_storage.delete(doc.file.name)
                contadores['arquivos'] += 1
            contadores['documentos'] += 1
        
        Document.objects.all().delete()
        
        # 2. Limpar processos de demissão
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
        
        # 3. Limpar agendamentos
        contadores['agendamentos'] = Schedule.objects.count()
        Schedule.objects.all().delete()
        
        # 4. Limpar logs relacionados às homologações
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
        
        # 5. Limpar diretórios de arquivos relacionados
        try:
            # Limpar diretório de documentos
            if os.path.exists('media/documents/'):
                shutil.rmtree('media/documents/')
            
            # Limpar diretório de assinaturas
            if os.path.exists('media/assinaturas/'):
                shutil.rmtree('media/assinaturas/')
                
        except Exception as e:
            print(f"Erro ao limpar diretórios: {e}")
        
        return JsonResponse({
            'success': True,
            'message': 'Limpeza concluída com sucesso!',
            'contadores': contadores
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Erro durante a limpeza: {str(e)}'
        }, status=500)
