#!/bin/bash

# Script de Deploy Completo para Veramo System VPS
# Executa na VPS como root
# Uso: bash deploy_vps_completo.sh

set -e  # Parar em caso de erro

echo "🚀 Iniciando deploy do Veramo System..."

# Variáveis
DOMAIN="veramo.com.br"
PROJECT_DIR="/opt/veramo"
BACKEND_DIR="$PROJECT_DIR/veramo_backend"
FRONTEND_DIR="$PROJECT_DIR/veramo_backend/frontend"
REPO_URL="https://github.com/vitorduarteebb/veramosystem.git"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Atualizar sistema
print_status "Atualizando sistema..."
apt update && apt upgrade -y

# 2. Instalar dependências do sistema
print_status "Instalando dependências do sistema..."
apt install -y \
    nginx \
    git \
    curl \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    python3-pip \
    python3-venv \
    sqlite3 \
    supervisor \
    ufw \
    certbot \
    python3-certbot-nginx

# 3. Instalar Node.js
print_status "Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 4. Configurar firewall
print_status "Configurando firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# 5. Clonar ou atualizar repositório
print_status "Clonando/atualizando repositório..."
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
    git fetch origin
    git reset --hard origin/main
    git clean -fd
else
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# 6. Configurar backend Python
print_status "Configurando backend Python..."
cd "$BACKEND_DIR"

# Criar virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Ativar virtual environment
source venv/bin/activate

# Atualizar pip e instalar dependências
pip install --upgrade pip setuptools wheel

# Instalar dependências (excluindo psycopg2)
pip install -r requirements.txt

# Configurar ambiente de produção
print_status "Configurando ambiente de produção..."
cp env.production .env

# Gerar SECRET_KEY único
SECRET_KEY=$(python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
sed -i "s/your-super-secret-key-change-this-in-production-please/$SECRET_KEY/" .env

# Configurar Django
print_status "Configurando Django..."
python manage.py collectstatic --noinput
python manage.py migrate

# Criar superuser se não existir
print_status "Criando superuser..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@veramo.com.br', 'admin123')
    print('Superuser criado: admin / admin123')
else:
    print('Superuser já existe')
"

# 7. Configurar frontend
print_status "Configurando frontend..."
cd "$FRONTEND_DIR"

# Instalar dependências do Node.js
npm install

# Build do frontend
npm run build

# Instalar serve globalmente para servir arquivos estáticos
npm install -g serve

# 8. Configurar serviços systemd
print_status "Configurando serviços systemd..."

# Serviço do backend
cat > /etc/systemd/system/veramo-backend.service << EOF
[Unit]
Description=Veramo Backend (Django)
After=network.target

[Service]
Type=exec
User=root
Group=root
WorkingDirectory=$BACKEND_DIR
Environment=PATH=$BACKEND_DIR/venv/bin
ExecStart=$BACKEND_DIR/venv/bin/python manage.py runserver 0.0.0.0:8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Serviço do frontend
cat > /etc/systemd/system/veramo-frontend.service << EOF
[Unit]
Description=Veramo Frontend (React)
After=network.target

[Service]
Type=exec
User=root
Group=root
WorkingDirectory=$FRONTEND_DIR
ExecStart=/usr/bin/serve -s dist -l 3000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# 9. Configurar Nginx
print_status "Configurando Nginx..."
cat > /etc/nginx/sites-available/veramo << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_redirect off;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Authorization \$http_authorization;
        proxy_redirect off;
    }

    # Auth endpoints
    location /auth/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Authorization \$http_authorization;
        proxy_redirect off;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_redirect off;
    }

    # Static files
    location /static/ {
        alias $BACKEND_DIR/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias $BACKEND_DIR/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Ativar configuração do Nginx
ln -sf /etc/nginx/sites-available/veramo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração do Nginx
nginx -t

# 10. Iniciar serviços
print_status "Iniciando serviços..."

# Recarregar systemd
systemctl daemon-reload

# Iniciar e habilitar serviços
systemctl enable veramo-backend veramo-frontend nginx
systemctl restart veramo-backend veramo-frontend nginx

# 11. Configurar SSL
print_status "Configurando SSL..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# 12. Verificação final
print_status "Verificando serviços..."
sleep 5

echo ""
echo "🔍 Status dos serviços:"
systemctl status veramo-backend --no-pager -l
echo ""
systemctl status veramo-frontend --no-pager -l
echo ""
systemctl status nginx --no-pager -l

echo ""
echo "🌐 Testando endpoints:"
curl -s -o /dev/null -w "Frontend (HTTP 200): %{http_code}\n" http://localhost:3000/ || echo "Frontend: ERRO"
curl -s -o /dev/null -w "Backend Health (HTTP 200): %{http_code}\n" http://localhost:8000/health/ || echo "Backend: ERRO"

echo ""
print_status "✅ Deploy concluído!"
print_status "🌐 Site: https://$DOMAIN"
print_status "🔧 Admin: https://$DOMAIN/admin/"
print_status "👤 Login: admin / admin123"
print_status ""
print_status "📋 Para verificar logs:"
print_status "   journalctl -u veramo-backend -f"
print_status "   journalctl -u veramo-frontend -f"
print_status "   journalctl -u nginx -f"

echo ""
print_warning "🔐 IMPORTANTE: Altere a senha do admin após o primeiro login!"
print_warning "🔑 Configure as credenciais do Google OAuth no arquivo .env"
