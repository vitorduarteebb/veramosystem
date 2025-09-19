#!/bin/bash

# Script para corrigir erro de migração na VPS
# Execute na VPS como root

echo "🔧 Corrigindo erro de migração..."

cd /opt/veramo/veramo_backend

# 1. Fazer backup do banco atual
echo "📦 Fazendo backup do banco..."
cp db.sqlite3 db.sqlite3.backup

# 2. Verificar estrutura atual do banco
echo "🔍 Verificando estrutura do banco..."
sqlite3 db.sqlite3 ".schema core_demissaoprocess" | grep documento_assinado_trabalhador

# 3. Se a coluna já existe, marcar a migração como aplicada
echo "✅ Marcando migração como aplicada..."
source venv/bin/activate
python manage.py migrate core 0017 --fake

# 4. Continuar com as migrações restantes
echo "🚀 Continuando migrações..."
python manage.py migrate

# 5. Verificar se tudo está OK
echo "✅ Verificando status..."
python manage.py check

echo "🎉 Correção concluída!"
