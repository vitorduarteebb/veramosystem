from django.core.management.base import BaseCommand
from django.core.files.storage import default_storage
from core.models import DemissaoProcess, Document, Schedule, SystemLog
import os
import shutil

class Command(BaseCommand):
    help = 'Limpa todas as homologações do sistema'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Executa a limpeza sem solicitar confirmação',
        )

    def handle(self, *args, **options):
        if not options['force']:
            self.stdout.write(
                self.style.WARNING('⚠️  ATENÇÃO: Esta operação irá remover TODAS as homologações do sistema!')
            )
            self.stdout.write('📋 Serão removidos:')
            self.stdout.write('   • Todos os processos de demissão')
            self.stdout.write('   • Todos os documentos enviados')
            self.stdout.write('   • Todos os agendamentos')
            self.stdout.write('   • Logs relacionados às homologações')
            self.stdout.write('   • Arquivos físicos (PDFs, assinaturas)')
            self.stdout.write('')
            
            resposta = input('🤔 Tem certeza que deseja continuar? (digite "SIM" para confirmar): ')
            
            if resposta.upper() != 'SIM':
                self.stdout.write(self.style.ERROR('❌ Operação cancelada pelo usuário'))
                return

        self.stdout.write('🧹 Iniciando limpeza das homologações...')
        
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
            self.stdout.write('📄 Removendo documentos...')
            documentos = Document.objects.all()
            for doc in documentos:
                # Remover arquivo físico se existir
                if doc.file and default_storage.exists(doc.file.name):
                    default_storage.delete(doc.file.name)
                    contadores['arquivos'] += 1
                contadores['documentos'] += 1
            
            Document.objects.all().delete()
            self.stdout.write(
                self.style.SUCCESS(f'   ✅ {contadores["documentos"]} documentos removidos')
            )
            
            # 2. Limpar processos de demissão
            self.stdout.write('📋 Removendo processos de demissão...')
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
            self.stdout.write(
                self.style.SUCCESS(f'   ✅ {contadores["processos"]} processos removidos')
            )
            
            # 3. Limpar agendamentos
            self.stdout.write('📅 Removendo agendamentos...')
            agendamentos = Schedule.objects.all()
            contadores['agendamentos'] = agendamentos.count()
            Schedule.objects.all().delete()
            self.stdout.write(
                self.style.SUCCESS(f'   ✅ {contadores["agendamentos"]} agendamentos removidos')
            )
            
            # 4. Limpar logs relacionados às homologações
            self.stdout.write('📝 Removendo logs relacionados às homologações...')
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
            self.stdout.write(
                self.style.SUCCESS(f'   ✅ {contadores["logs"]} logs removidos')
            )
            
            # 5. Limpar diretórios de arquivos relacionados
            self.stdout.write('🗂️ Limpando diretórios de arquivos...')
            try:
                # Limpar diretório de documentos
                if os.path.exists('media/documents/'):
                    shutil.rmtree('media/documents/')
                    self.stdout.write('   ✅ Diretório \'media/documents/\' removido')
                
                # Limpar diretório de assinaturas
                if os.path.exists('media/assinaturas/'):
                    shutil.rmtree('media/assinaturas/')
                    self.stdout.write('   ✅ Diretório \'media/assinaturas/\' removido')
                    
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f'   ⚠️ Erro ao limpar diretórios: {e}')
                )
            
            # Relatório final
            self.stdout.write('')
            self.stdout.write('='*50)
            self.stdout.write('📊 RELATÓRIO DE LIMPEZA')
            self.stdout.write('='*50)
            self.stdout.write(f'📋 Processos de demissão: {contadores["processos"]}')
            self.stdout.write(f'📄 Documentos: {contadores["documentos"]}')
            self.stdout.write(f'📅 Agendamentos: {contadores["agendamentos"]}')
            self.stdout.write(f'📝 Logs: {contadores["logs"]}')
            self.stdout.write(f'🗂️ Arquivos físicos: {contadores["arquivos"]}')
            self.stdout.write('='*50)
            self.stdout.write(
                self.style.SUCCESS('✅ Limpeza concluída com sucesso!')
            )
            self.stdout.write('🎯 Sistema pronto para testar distribuição')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Erro durante a limpeza: {e}')
            )
            raise
