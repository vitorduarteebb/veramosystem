#!/bin/bash

# Script para corrigir completamente o sistema na VPS
# Execute na VPS como root

echo "🔧 Corrigindo sistema completo na VPS..."

# 1. Parar todos os serviços
echo "⏹️ Parando serviços..."
systemctl stop veramo-backend veramo-frontend nginx

# 2. Ir para o diretório correto
cd /opt/veramo

# 3. Atualizar código do Git
echo "📥 Atualizando código do Git..."
git fetch origin
git reset --hard origin/main
git clean -fd

# 4. Corrigir estrutura do backend
echo "🐍 Corrigindo backend..."
cd veramo_backend

# Verificar se manage.py existe no local correto
if [ ! -f "manage.py" ]; then
    echo "❌ manage.py não encontrado, procurando..."
    find . -name "manage.py" -type f
fi

# Ativar virtual environment
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Configurar ambiente
cp env.production .env

# Gerar SECRET_KEY
SECRET_KEY=$(python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
sed -i "s/your-super-secret-key-change-this-in-production-please/$SECRET_KEY/" .env

# Executar migrações com tratamento de erro
echo "🗄️ Executando migrações..."
python manage.py migrate --run-syncdb || {
    echo "⚠️ Erro na migração, tentando correção..."
    python manage.py migrate core 0017 --fake
    python manage.py migrate
}

# Coletar arquivos estáticos
python manage.py collectstatic --noinput

# Criar superuser
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@veramo.com.br', 'admin123')
    print('Superuser criado: admin / admin123')
else:
    print('Superuser já existe')
"

# 5. Corrigir frontend
echo "⚛️ Corrigindo frontend..."
cd frontend

# Verificar se package.json existe
if [ ! -f "package.json" ]; then
    echo "❌ package.json não encontrado!"
    ls -la
    exit 1
fi

# Instalar dependências
npm install

# Fazer build
npm run build

# Verificar se build foi criado
if [ ! -d "dist" ] || [ -z "$(ls -A dist/)" ]; then
    echo "❌ Build falhou!"
    exit 1
fi

echo "✅ Build criado com sucesso!"
ls -la dist/

# 6. Corrigir serviços systemd
echo "⚙️ Corrigindo serviços systemd..."

# Backend service
cat > /etc/systemd/system/veramo-backend.service << EOF
[Unit]
Description=Veramo Backend Django
After=network.target

[Service]
Type=exec
User=root
Group=root
WorkingDirectory=/opt/veramo/veramo_backend
Environment=PATH=/opt/veramo/veramo_backend/venv/bin
ExecStart=/opt/veramo/veramo_backend/venv/bin/python manage.py runserver 0.0.0.0:8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Frontend service
cat > /etc/systemd/system/veramo-frontend.service << EOF
[Unit]
Description=Veramo Frontend React
After=network.target

[Service]
Type=exec
User=root
Group=root
WorkingDirectory=/opt/veramo/veramo_backend/frontend
ExecStart=/usr/bin/serve -s dist -l 3000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# 7. Recarregar e iniciar serviços
echo "🔄 Iniciando serviços..."
systemctl daemon-reload
systemctl enable veramo-backend veramo-frontend nginx
systemctl start veramo-backend veramo-frontend nginx

# 8. Verificar status
echo "🔍 Verificando status..."
sleep 5

echo "Backend status:"
systemctl status veramo-backend --no-pager -l

echo "Frontend status:"
systemctl status veramo-frontend --no-pager -l

echo "Nginx status:"
systemctl status nginx --no-pager -l

# 9. Testar endpoints
echo "🧪 Testando endpoints..."
echo "Backend health:"
curl -s http://localhost:8000/health/ || echo "Backend não responde"

echo "Frontend:"
curl -s http://localhost:3000/ | head -10

echo "✅ Correção completa finalizada!"
echo "🌐 Acesse: https://veramo.com.br"
echo "🔧 Admin: https://veramo.com.br/admin/"
echo "👤 Login: admin / admin123"
