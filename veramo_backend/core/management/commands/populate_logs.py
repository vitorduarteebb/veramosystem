from django.core.management.base import BaseCommand
from core.utils.logging import populate_sample_logs

class Command(BaseCommand):
    help = 'Popula o banco com logs de exemplo'

    def handle(self, *args, **options):
        self.stdout.write('Criando logs de exemplo...')
        
        try:
            logs = populate_sample_logs()
            self.stdout.write(
                self.style.SUCCESS(f'Sucesso! {len(logs)} logs criados.')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erro ao criar logs: {str(e)}')
            )
