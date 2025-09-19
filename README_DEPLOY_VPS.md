# 🚀 Deploy Veramo System para VPS

## 📋 Pré-requisitos

- VPS Ubuntu 25.04 (ou similar)
- Acesso root via SSH
- Domínio configurado para apontar para o IP da VPS
- Mínimo 2GB RAM, 2 CPU cores

## 🔧 Configuração do DNS

Configure os seguintes registros DNS:
```
Tipo A: veramo.com.br → 148.230.72.205
Tipo A: www.veramo.com.br → 148.230.72.205
```

## 🚀 Deploy Automático

### 1. Conectar na VPS
```bash
ssh root@148.230.72.205
```

### 2. Executar script de deploy
```bash
curl -fsSL https://raw.githubusercontent.com/vitorduarteebb/veramosystem/main/deploy_vps_completo.sh | bash
```

**OU** se preferir baixar e executar:
```bash
wget https://raw.githubusercontent.com/vitorduarteebb/veramosystem/main/deploy_vps_completo.sh
chmod +x deploy_vps_completo.sh
./deploy_vps_completo.sh
```

## 📊 O que o script faz

### 🔄 Atualização do Sistema
- Atualiza packages do Ubuntu
- Instala dependências (nginx, python3, node.js, etc.)
- Configura firewall UFW

### 🐍 Backend (Django)
- Clona repositório para `/opt/veramo`
- Cria virtual environment Python
- Instala dependências (excluindo psycopg2)
- Configura banco SQLite
- Coleta arquivos estáticos
- Executa migrações
- Cria superuser `admin`/`admin123`

### ⚛️ Frontend (React)
- Instala dependências Node.js
- Executa build de produção
- Configura servidor estático

### 🌐 Nginx
- Configura proxy reverso
- Frontend na raiz (`/`)
- Backend API em `/api/` e `/auth/`
- Admin Django em `/admin/`
- Arquivos estáticos e mídia

### 🔒 SSL/HTTPS
- Instala certificados Let's Encrypt
- Configura redirecionamento HTTP → HTTPS
- Renovação automática

### ⚙️ Serviços Systemd
- `veramo-backend`: Django na porta 8000
- `veramo-frontend`: React na porta 3000
- Reinício automático em caso de falha

## 🔍 Verificação

Após o deploy, acesse:
- **Site**: https://veramo.com.br
- **Admin**: https://veramo.com.br/admin/
- **API**: https://veramo.com.br/api/
- **Health**: https://veramo.com.br/health/

## 👤 Credenciais Padrão

- **Username**: admin
- **Password**: admin123
- **Email**: admin@veramo.com.br

⚠️ **IMPORTANTE**: Altere a senha após o primeiro login!

## 🛠️ Comandos Úteis

### Verificar status dos serviços
```bash
systemctl status veramo-backend
systemctl status veramo-frontend
systemctl status nginx
```

### Ver logs em tempo real
```bash
journalctl -u veramo-backend -f
journalctl -u veramo-frontend -f
journalctl -u nginx -f
```

### Reiniciar serviços
```bash
systemctl restart veramo-backend
systemctl restart veramo-frontend
systemctl restart nginx
```

### Atualizar código
```bash
cd /opt/veramo
git pull origin main
systemctl restart veramo-backend veramo-frontend
```

## 🔧 Configuração Avançada

### Google OAuth
Edite `/opt/veramo/veramo_backend/.env`:
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Email SMTP
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Banco de Dados
Por padrão usa SQLite. Para PostgreSQL:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/veramo_db
```

## 📁 Estrutura de Arquivos

```
/opt/veramo/
├── veramo_backend/
│   ├── core/                 # App principal Django
│   ├── signing/              # App assinatura eletrônica
│   ├── app_google/           # App Google Meet
│   ├── frontend/             # App React
│   │   ├── dist/             # Build de produção
│   │   └── src/              # Código fonte
│   ├── media/                # Uploads
│   ├── staticfiles/          # Arquivos estáticos
│   ├── venv/                 # Virtual environment
│   ├── manage.py             # Django management
│   ├── requirements.txt      # Dependências Python
│   └── .env                  # Variáveis de ambiente
└── deploy_vps_completo.sh    # Script de deploy
```

## 🚨 Troubleshooting

### Erro 502 Bad Gateway
```bash
# Verificar se serviços estão rodando
systemctl status veramo-backend veramo-frontend

# Reiniciar se necessário
systemctl restart veramo-backend veramo-frontend nginx
```

### Erro de permissões
```bash
# Corrigir permissões
chown -R root:root /opt/veramo
chmod -R 755 /opt/veramo
```

### SSL não funciona
```bash
# Renovar certificados
certbot renew
systemctl restart nginx
```

### Backend não inicia
```bash
# Ver logs detalhados
journalctl -u veramo-backend -n 50

# Verificar dependências
cd /opt/veramo/veramo_backend
source venv/bin/activate
pip install -r requirements.txt
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs dos serviços
2. Confirme que o DNS está correto
3. Verifique se as portas 80/443 estão abertas
4. Teste conexões internas: `curl http://localhost:8000/health/`

## 🔄 Atualizações

Para atualizar o sistema:
```bash
cd /opt/veramo
git pull origin main
source veramo_backend/venv/bin/activate
pip install -r veramo_backend/requirements.txt
python veramo_backend/manage.py migrate
python veramo_backend/manage.py collectstatic --noinput
cd veramo_backend/frontend && npm run build
systemctl restart veramo-backend veramo-frontend
```
