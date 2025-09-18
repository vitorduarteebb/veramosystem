# 🔧 Solução Rápida para Erro OAuth

## ❌ **Erro Atual:**
```
Acesso bloqueado: erro de autorização
The OAuth client was not found.
Erro 401: invalid_client
```

## ✅ **Solução:**

### **Opção 1: Configuração Automática (Recomendado)**

```bash
cd veramo_backend
python setup_google_oauth.py
```

### **Opção 2: Configuração Manual**

#### **Passo 1: Google Cloud Console**
1. Acesse: https://console.cloud.google.com/
2. Crie um projeto ou selecione existente
3. Habilite as APIs:
   - Google Calendar API
   - Google Meet API
   - Google Workspace Events API

#### **Passo 2: Criar Credenciais OAuth**
1. Vá para "APIs & Services" > "Credentials"
2. Clique em "Create Credentials" > "OAuth 2.0 Client IDs"
3. Escolha "Desktop application"
4. Configure URLs de redirecionamento:
   - `http://localhost:8080`
5. Baixe o arquivo JSON

#### **Passo 3: Configurar no Sistema**
1. Renomeie o arquivo baixado para `client_secret.json`
2. Coloque na pasta `veramo_backend/`
3. Execute:
```bash
python setup_google_oauth.py
```

### **Opção 3: Desabilitar Temporariamente**

Se não quiser usar Google Meet agora:

```bash
cd veramo_backend
python manage.py test_google_meet --check-config
```

O sistema funcionará sem Google Meet, usando links manuais.

## 🔍 **Verificação:**

```bash
# Testar configuração
python manage.py test_google_meet --check-config

# Testar criação de reunião
python manage.py test_google_meet --create-meeting
```

## 📞 **Suporte:**

Se ainda tiver problemas:
1. Verifique se as APIs estão habilitadas
2. Confirme se o arquivo `client_secret.json` está correto
3. Verifique se as URLs de redirecionamento estão configuradas
4. Execute o script de configuração automática

## 🚀 **Próximos Passos:**

Após configurar:
1. O sistema criará reuniões automaticamente
2. Links do Google Meet serão gerados
3. Notificações incluirão os links
4. Integração completa funcionará
