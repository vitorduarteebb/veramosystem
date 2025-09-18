# 🚀 Sistema Veramo3 - Deploy Completo

Sistema moderno de gestão sindical e empresarial com Django + React.

## 📋 Checklist de Produção

### ✅ Backend (Django)
- [x] Configurar variáveis de ambiente (SECRET_KEY, DEBUG=False, ALLOWED_HOSTS, etc)
- [x] Configurar banco de dados de produção (PostgreSQL)
- [x] Configurar arquivos estáticos e mídia
- [x] Configurar CORS para o domínio da VPS
- [x] Configurar gunicorn + nginx
- [x] Adicionar requirements.txt atualizado

### ✅ Frontend (React)
- [x] Configurar variáveis de ambiente para apontar para o backend da VPS
- [x] Gerar build de produção
- [x] Servir o build com nginx

### ✅ Geral
- [x] Adicionar .env.example para facilitar deploy
- [x] Remover dados sensíveis do código
- [x] Adicionar README com instruções de deploy

## 🚀 Deploy Automatizado (Recomendado)

### 1. Na VPS, execute:
```bash
# Clone o repositório
git clone https://github.com/vitorduarteebb/veramo3.git
cd veramo3

# Torne o script executável
chmod +x deploy.sh

# Execute o deploy automatizado
bash deploy.sh
```

### 2. O script irá:
- ✅ Instalar todas as dependências (Python, Node.js, PostgreSQL, Nginx)
- ✅ Configurar o banco de dados PostgreSQL
- ✅ Gerar SECRET_KEY automaticamente
- ✅ Configurar variáveis de ambiente
- ✅ Aplicar migrações do Django
- ✅ Fazer build do frontend
- ✅ Configurar Nginx e Gunicorn
- ✅ Iniciar todos os serviços

### 3. Acesse o sistema:
- 🌐 **URL:** `http://IP_DA_VPS`
- 📧 **Email:** `admin@veramo.com`
- 🔑 **Senha:** `admin123`

## 🔧 Deploy Manual

### Backend (Django)
1. Configure o arquivo `.env` baseado em `veramo_backend/.env.example`
2. Instale dependências: `pip install -r requirements.txt`
3. Aplique as migrações: `python manage.py migrate`
4. Colete arquivos estáticos: `python manage.py collectstatic`
5. Inicie com gunicorn: `gunicorn veramo_backend.wsgi:application --bind 0.0.0.0:8000`

### Frontend (React)
1. Configure o arquivo `.env` baseado em `veramo_backend/frontend/.env.example`
2. Instale dependências: `npm install`
3. Rode `npm run build`
4. Sirva o conteúdo da pasta `dist/` com nginx

## 📁 Estrutura do Projeto

```
veramo3/
├── veramo_backend/          # Backend Django
│   ├── core/               # App principal
│   ├── frontend/           # Frontend React
│   ├── .env.example        # Variáveis de ambiente
│   ├── gunicorn.conf.py    # Configuração Gunicorn
│   ├── nginx.conf          # Configuração Nginx
│   └── requirements.txt    # Dependências Python
├── deploy.sh               # Script de deploy automatizado
└── README.md               # Este arquivo
```

## 🔐 Credenciais Padrão

### Superadmin
- **Email:** `admin@veramo.com`
- **Senha:** `admin123`

### Usuários de Empresa
- **Email:** `empresa@veramo.com` (company_master)
- **Email:** `teste@teste.com` (company_master)
- **Email:** `lduarte@gmail.com` (company_common)

### Usuários de Sindicato
- **Email:** `vitor.lduarte@gmail.com` (union_master)
- **Email:** `sindicato2@gmail.com` (union_master)
- **Email:** `sindi@veramo.com` (union_master)
- **Email:** `vitor@gmail.com` (union_common)

## 🛠️ Comandos Úteis

### Backend
```bash
# Aplicar migrações
python manage.py migrate

# Coletar arquivos estáticos
python manage.py collectstatic

# Criar superusuário
python manage.py createsuperuser

# Shell Django
python manage.py shell
```

### Frontend
```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build de produção
npm run build
```

### Serviços
```bash
# Verificar status do Gunicorn
sudo systemctl status veramo3

# Reiniciar Gunicorn
sudo systemctl restart veramo3

# Verificar status do Nginx
sudo systemctl status nginx

# Reiniciar Nginx
sudo systemctl restart nginx
```

## 🔧 Configurações Avançadas

### Variáveis de Ambiente (.env)
```bash
SECRET_KEY=sua_secret_key_aqui
DEBUG=False
ALLOWED_HOSTS=seu_dominio.com,IP_DA_VPS
DB_NAME=veramo
DB_USER=usuario
DB_PASSWORD=senha
DB_HOST=localhost
DB_PORT=5432
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://seu_dominio.com,http://localhost:3001
```

### Frontend (.env)
```bash
VITE_API_URL=https://seu_dominio.com
```

## 🐛 Troubleshooting

### Erro 404 no login
- Verifique se o backend está rodando: `sudo systemctl status veramo3`
- Verifique se as rotas estão corretas no `urls.py`

### Erro de CORS
- Configure `CORS_ALLOWED_ORIGINS` no `.env`
- Verifique se o domínio está correto

### Erro de banco de dados
- Verifique se o PostgreSQL está rodando: `sudo systemctl status postgresql`
- Verifique as credenciais no `.env`

## 📞 Suporte

Para suporte técnico, entre em contato através do GitHub Issues.

---

**Desenvolvido com ❤️ para o Sistema Veramo3** 