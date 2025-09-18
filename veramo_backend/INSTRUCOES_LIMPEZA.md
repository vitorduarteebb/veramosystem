# 🧹 Instruções para Limpeza das Homologações

## Problema
Há algum problema com o terminal que impede a execução automática dos scripts. Aqui estão as instruções para limpar manualmente todas as homologações do sistema.

## 📋 Dados que serão removidos:
- **Processos de demissão** (`core_demissaoprocess`)
- **Documentos** (`core_document`) 
- **Agendamentos** (`core_schedule`)
- **Logs relacionados** (`core_systemlog`)
- **Arquivos físicos** (PDFs em `media/documents/` e `media/assinaturas/`)

## 🛠️ Métodos de Limpeza

### Método 1: Via Django Shell
```bash
cd veramo_backend
python manage.py shell
```

No shell do Django, execute:
```python
from core.models import DemissaoProcess, Document, Schedule, SystemLog
from django.core.files.storage import default_storage

# Contadores
processos = DemissaoProcess.objects.count()
documentos = Document.objects.count()
agendamentos = Schedule.objects.count()
logs = SystemLog.objects.filter(action__in=['DOCUMENT_UPLOADED', 'DOCUMENT_APPROVED', 'DOCUMENT_REJECTED', 'HOMOLOGATION_COMPLETED', 'SCHEDULE_CREATED', 'SCHEDULE_UPDATED', 'SCHEDULE_DELETED']).count()

print(f"Processos: {processos}")
print(f"Documentos: {documentos}")
print(f"Agendamentos: {agendamentos}")
print(f"Logs: {logs}")

# Limpar documentos
Document.objects.all().delete()
print("✅ Documentos removidos")

# Limpar processos
DemissaoProcess.objects.all().delete()
print("✅ Processos removidos")

# Limpar agendamentos
Schedule.objects.all().delete()
print("✅ Agendamentos removidos")

# Limpar logs
SystemLog.objects.filter(action__in=['DOCUMENT_UPLOADED', 'DOCUMENT_APPROVED', 'DOCUMENT_REJECTED', 'HOMOLOGATION_COMPLETED', 'SCHEDULE_CREATED', 'SCHEDULE_UPDATED', 'SCHEDULE_DELETED']).delete()
print("✅ Logs removidos")

print("🎯 Sistema limpo e pronto para testar distribuição!")
```

### Método 2: Via SQLite Direto
```bash
cd veramo_backend
sqlite3 db.sqlite3
```

No SQLite, execute:
```sql
-- Verificar quantos registros existem
SELECT COUNT(*) FROM core_document;
SELECT COUNT(*) FROM core_demissaoprocess;
SELECT COUNT(*) FROM core_schedule;
SELECT COUNT(*) FROM core_systemlog WHERE action IN ('DOCUMENT_UPLOADED', 'DOCUMENT_APPROVED', 'DOCUMENT_REJECTED', 'HOMOLOGATION_COMPLETED', 'SCHEDULE_CREATED', 'SCHEDULE_UPDATED', 'SCHEDULE_DELETED');

-- Limpar dados
DELETE FROM core_document;
DELETE FROM core_demissaoprocess;
DELETE FROM core_schedule;
DELETE FROM core_systemlog WHERE action IN ('DOCUMENT_UPLOADED', 'DOCUMENT_APPROVED', 'DOCUMENT_REJECTED', 'HOMOLOGATION_COMPLETED', 'SCHEDULE_CREATED', 'SCHEDULE_UPDATED', 'SCHEDULE_DELETED');

-- Sair
.quit
```

### Método 3: Via API (se o servidor estiver rodando)
```bash
# Iniciar servidor
cd veramo_backend
python manage.py runserver 8000

# Em outro terminal, fazer a chamada
curl -X POST http://localhost:8000/core/cleanup/homologacoes/
```

### Método 4: Arquivos Físicos
Remover manualmente os diretórios:
```bash
# Windows
rmdir /s /q media\documents\
rmdir /s /q media\assinaturas\

# Linux/Mac
rm -rf media/documents/
rm -rf media/assinaturas/
```

## ✅ Verificação
Após a limpeza, verifique se os dados foram removidos:

```python
# No Django shell
from core.models import DemissaoProcess, Document, Schedule, SystemLog

print(f"Processos restantes: {DemissaoProcess.objects.count()}")
print(f"Documentos restantes: {Document.objects.count()}")
print(f"Agendamentos restantes: {Schedule.objects.count()}")
print(f"Logs restantes: {SystemLog.objects.count()}")
```

Todos devem retornar 0.

## 🎯 Resultado Esperado
Após a limpeza, o sistema estará completamente limpo e pronto para testar o sistema de distribuição de homologações.

## 📝 Scripts Criados
- `limpar_homologacoes.py` - Script Django completo
- `limpar_dados.py` - Script Python simples
- `limpar_sqlite.py` - Script SQLite direto
- `limpar_via_api.py` - Script via API
- `limpar_direto.py` - Script SQLite direto
- `limpar.bat` - Script batch para Windows
- `core/management/commands/limpar_homologacoes.py` - Comando Django
- `core/views_cleanup.py` - Endpoint de API

Escolha o método que funcionar melhor no seu ambiente!
