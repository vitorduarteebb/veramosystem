#!/bin/bash

# Script para corrigir erro de migração na VPS
# Execute na VPS como root

echo "🔧 Corrigindo erro de migração na VPS..."

cd /opt/veramo/veramo_backend

# Fazer backup do banco
echo "📦 Fazendo backup do banco..."
cp db.sqlite3 db.sqlite3.backup

# Ativar virtual environment
source venv/bin/activate

# Verificar se a coluna já existe
echo "🔍 Verificando estrutura do banco..."
if sqlite3 db.sqlite3 ".schema core_demissaoprocess" | grep -q "documento_assinado_trabalhador"; then
    echo "✅ Coluna já existe, marcando migração como aplicada..."
    python manage.py migrate core 0017 --fake
else
    echo "❌ Coluna não encontrada, tentando migração normal..."
fi

# Continuar com as migrações
echo "🚀 Executando migrações restantes..."
python manage.py migrate

# Verificar se tudo está OK
echo "✅ Verificando configuração..."
python manage.py check

# Coletar arquivos estáticos
echo "📁 Coletando arquivos estáticos..."
python manage.py collectstatic --noinput

# Criar superuser se não existir
echo "👤 Verificando superuser..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@veramo.com.br', 'admin123')
    print('Superuser criado: admin / admin123')
else:
    print('Superuser já existe')
"

# Reiniciar serviços
echo "🔄 Reiniciando serviços..."
systemctl restart veramo-backend veramo-frontend nginx

echo "🎉 Correção concluída!"
echo "🌐 Teste o site: https://veramo.com.br"
echo "🔧 Admin: https://veramo.com.br/admin/"
echo "👤 Login: admin / admin123"
