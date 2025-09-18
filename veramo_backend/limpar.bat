@echo off
echo 🧹 Limpando homologações do sistema...

cd /d "%~dp0"

echo 📄 Removendo documentos...
python -c "import sqlite3; conn = sqlite3.connect('db.sqlite3'); cursor = conn.cursor(); cursor.execute('DELETE FROM core_document'); conn.commit(); conn.close(); print('Documentos removidos')"

echo 📋 Removendo processos de demissão...
python -c "import sqlite3; conn = sqlite3.connect('db.sqlite3'); cursor = conn.cursor(); cursor.execute('DELETE FROM core_demissaoprocess'); conn.commit(); conn.close(); print('Processos removidos')"

echo 📅 Removendo agendamentos...
python -c "import sqlite3; conn = sqlite3.connect('db.sqlite3'); cursor = conn.cursor(); cursor.execute('DELETE FROM core_schedule'); conn.commit(); conn.close(); print('Agendamentos removidos')"

echo 📝 Removendo logs relacionados...
python -c "import sqlite3; conn = sqlite3.connect('db.sqlite3'); cursor = conn.cursor(); cursor.execute('DELETE FROM core_systemlog WHERE action IN (\"DOCUMENT_UPLOADED\", \"DOCUMENT_APPROVED\", \"DOCUMENT_REJECTED\", \"HOMOLOGATION_COMPLETED\", \"SCHEDULE_CREATED\", \"SCHEDULE_UPDATED\", \"SCHEDULE_DELETED\")'); conn.commit(); conn.close(); print('Logs removidos')"

echo 🗂️ Removendo diretórios de arquivos...
if exist "media\documents\" rmdir /s /q "media\documents\"
if exist "media\assinaturas\" rmdir /s /q "media\assinaturas\"

echo ✅ Limpeza concluída!
echo 🎯 Sistema pronto para testar distribuição
pause
