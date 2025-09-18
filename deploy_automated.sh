#!/bin/bash

# Script automatizado de deploy para VPS
# Execute como root na VPS

set -e  # Parar em caso de erro

echo "🚀 Iniciando deploy automatizado do Sistema Veramo..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    error "Este script deve ser executado como root"
fi

# Atualizar sistema
log "Atualizando sistema Ubuntu..."
apt update && apt upgrade -y

# Instalar dependências
log "Instalando dependências..."
apt install -y curl wget git nginx certbot python3-certbot-nginx docker.io docker-compose ufw

# Configurar firewall
log "Configurando firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Iniciar e habilitar serviços
log "Iniciando serviços..."
systemctl start docker
systemctl enable docker
systemctl start nginx
systemctl enable nginx

# Criar diretório da aplicação
log "Criando diretório da aplicação..."
mkdir -p /opt/veramo
cd /opt/veramo

# Clonar repositório
log "Clonando repositório do GitHub..."
if [ -d ".git" ]; then
    log "Repositório já existe, atualizando..."
    git pull
else
    git clone https://github.com/vitorduarteebb/veramosystem.git .
fi

# Configurar permissões
chown -R root:root /opt/veramo
chmod -R 755 /opt/veramo

# Criar arquivo de variáveis de ambiente
log "Criando arquivo de configuração..."
cat > /opt/veramo/veramo_backend/.env << 'EOF'
# Configurações Django
DEBUG=False
SECRET_KEY=your-secret-key-here-change-this-in-production
ALLOWED_HOSTS=veramo.com.br,www.veramo.com.br,148.230.72.205,localhost

# Configurações do banco de dados
DATABASE_URL=sqlite:///db.sqlite3

# Configurações Google OAuth (CONFIGURE ESTES VALORES)
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Configurações de email (CONFIGURE ESTES VALORES)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Configurações de produção
STATIC_ROOT=/opt/veramo/staticfiles
MEDIA_ROOT=/opt/veramo/media

# Configurações de segurança
SECURE_SSL_REDIRECT=True
SECURE_PROXY_SSL_HEADER=('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
EOF

# Configurar Nginx
log "Configurando Nginx..."
cat > /etc/nginx/sites-available/veramo << 'EOF'
server {
    listen 80;
    server_name veramo.com.br www.veramo.com.br;

    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name veramo.com.br www.veramo.com.br;

    # SSL será configurado pelo Certbot
    ssl_certificate /etc/letsencrypt/live/veramo.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/veramo.com.br/privkey.pem;

    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Headers de segurança
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # Admin Django
    location /admin/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # Arquivos estáticos
    location /static/ {
        alias /opt/veramo/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Arquivos de mídia
    location /media/ {
        alias /opt/veramo/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Habilitar site
ln -sf /etc/nginx/sites-available/veramo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração do Nginx
nginx -t || error "Erro na configuração do Nginx"

# Configurar Docker Compose
log "Configurando Docker Compose..."
cat > /opt/veramo/docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  backend:
    build: 
      context: ./veramo_backend
      dockerfile: Dockerfile
    container_name: veramo_backend
    ports:
      - "8000:8000"
    volumes:
      - ./veramo_backend:/app
      - ./media:/app/media
      - ./staticfiles:/app/staticfiles
    environment:
      - DEBUG=False
    env_file:
      - ./veramo_backend/.env
    command: >
      sh -c "pip install -r requirements.txt &&
             python manage.py collectstatic --noinput &&
             python manage.py migrate &&
             python manage.py createsuperuser --noinput --username admin --email admin@veramo.com.br || true &&
             gunicorn veramo_backend.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health/"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: 
      context: ./veramo_backend/frontend
      dockerfile: Dockerfile
    container_name: veramo_frontend
    ports:
      - "3000:80"
    volumes:
      - ./veramo_backend/frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=https://veramo.com.br/api
    restart: unless-stopped
    depends_on:
      - backend
EOF

# Criar diretórios necessários
mkdir -p /opt/veramo/media
mkdir -p /opt/veramo/staticfiles

# Configurar permissões
chown -R root:root /opt/veramo
chmod -R 755 /opt/veramo

log "✅ Configuração básica concluída!"

echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. 🔧 Configure as variáveis de ambiente:"
echo "   nano /opt/veramo/veramo_backend/.env"
echo ""
echo "2. 🌐 Configure o DNS do domínio veramo.com.br para apontar para 148.230.72.205"
echo ""
echo "3. 🔒 Aguarde a propagação do DNS e configure SSL:"
echo "   certbot --nginx -d veramo.com.br -d www.veramo.com.br"
echo ""
echo "4. 🚀 Inicie a aplicação:"
echo "   cd /opt/veramo"
echo "   docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "5. 📊 Verifique o status:"
echo "   docker ps"
echo "   docker-compose -f docker-compose.prod.yml logs"
echo ""
echo "🌐 URLs de acesso:"
echo "   - Site: https://veramo.com.br"
echo "   - Admin: https://veramo.com.br/admin"
echo "   - API: https://veramo.com.br/api"
echo ""
warning "IMPORTANTE: Configure primeiro o DNS antes de tentar obter o certificado SSL!"
