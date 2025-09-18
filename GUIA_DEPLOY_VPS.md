# 🚀 Guia de Deploy do Sistema Veramo na VPS

## Informações da VPS
- **IP**: 148.230.72.205
- **Sistema**: Ubuntu 25.04
- **Domínio**: veramo.com.br
- **Usuário**: root

## Passo 1: Conectar na VPS

```bash
ssh root@148.230.72.205
# Digite a senha quando solicitado
```

## Passo 2: Executar Script de Instalação

```bash
# Baixar e executar script de instalação
curl -o deploy_automated.sh https://raw.githubusercontent.com/vitorduarteebb/veramosystem/main/deploy_automated.sh
chmod +x deploy_automated.sh
./deploy_automated.sh
```

## Passo 3: Configurar Variáveis de Ambiente

```bash
# Criar arquivo de configuração
nano /opt/veramo/veramo_backend/.env
```

**Conteúdo do arquivo .env:**
```env
# Configurações Django
DEBUG=False
SECRET_KEY=sua-chave-secreta-aqui-mude-em-producao
ALLOWED_HOSTS=veramo.com.br,www.veramo.com.br,148.230.72.205

# Configurações do banco de dados
DATABASE_URL=sqlite:///db.sqlite3

# Configurações Google OAuth (SUBSTITUA PELOS SEUS VALORES)
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret

# Configurações de email (SUBSTITUA PELOS SEUS VALORES)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=seu-email@gmail.com
EMAIL_HOST_PASSWORD=sua-senha-de-app

# Configurações de produção
STATIC_ROOT=/opt/veramo/staticfiles
MEDIA_ROOT=/opt/veramo/media
```

## Passo 4: Configurar DNS

**IMPORTANTE**: Configure o DNS do domínio `veramo.com.br` para apontar para `148.230.72.205`

- A record: `veramo.com.br` → `148.230.72.205`
- CNAME record: `www.veramo.com.br` → `veramo.com.br`

## Passo 5: Obter Certificado SSL

```bash
# Aguardar propagação do DNS (pode levar até 24h)
# Depois executar:
certbot --nginx -d veramo.com.br -d www.veramo.com.br
```

## Passo 6: Iniciar Aplicação

```bash
cd /opt/veramo
docker-compose -f docker-compose.prod.yml up -d
```

## Passo 7: Verificar Status

```bash
# Verificar containers
docker ps

# Verificar logs
docker-compose -f docker-compose.prod.yml logs

# Verificar Nginx
systemctl status nginx
```

## Comandos Úteis

```bash
# Reiniciar aplicação
cd /opt/veramo
docker-compose -f docker-compose.prod.yml restart

# Ver logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f

# Parar aplicação
docker-compose -f docker-compose.prod.yml down

# Atualizar aplicação
cd /opt/veramo
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

## Troubleshooting

### Se o SSL não funcionar:
```bash
# Verificar se o DNS está propagado
nslookup veramo.com.br

# Testar sem SSL primeiro
# Comentar as linhas SSL no nginx e testar HTTP
```

### Se a aplicação não iniciar:
```bash
# Verificar logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# Verificar se as portas estão livres
netstat -tlnp | grep :8000
netstat -tlnp | grep :3000
```

## URLs de Acesso

- **Site**: https://veramo.com.br
- **Admin Django**: https://veramo.com.br/admin
- **API**: https://veramo.com.br/api

---

**⚠️ IMPORTANTE**: 
1. Configure primeiro o DNS do domínio
2. Aguarde a propagação do DNS
3. Depois configure o SSL
4. Por último, inicie a aplicação
