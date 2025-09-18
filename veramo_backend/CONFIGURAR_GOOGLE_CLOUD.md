# 🔧 Configurar Google Cloud Console para OAuth

## 📋 **Passo a Passo para Resolver redirect_uri_mismatch**

### **1. Acesse o Google Cloud Console**
- Vá para: https://console.cloud.google.com/
- Selecione o projeto: `trans-shuttle-471119-k6`

### **2. Configure as URLs de Redirecionamento**
1. Vá para **"APIs & Services" > "Credentials"**
2. Clique no **OAuth 2.0 Client ID** existente
3. Na seção **"Authorized redirect URIs"**, adicione estas URLs:

```
http://localhost:8080
http://localhost:8081
http://localhost:8082
http://localhost:8083
http://localhost:8084
http://localhost:3000
http://localhost:8000
http://localhost
```

### **3. Salve as Alterações**
- Clique em **"Save"**
- Aguarde alguns minutos para as mudanças propagarem

### **4. Teste a Configuração**
```bash
cd veramo_backend
python test_meet_integration.py
```

## 🚨 **Importante:**
- **Não use HTTPS** para localhost
- **Não adicione barras no final** das URLs
- **Verifique se não há espaços** extras
- **Aguarde 5-10 minutos** após salvar

## 🔍 **Verificação:**
Após configurar, o sistema deve:
1. Abrir uma janela do navegador
2. Pedir autorização do Google
3. Criar uma reunião de teste
4. Mostrar os links do Google Meet

## 📞 **Se ainda tiver problemas:**
1. Verifique se todas as URLs estão exatamente iguais
2. Tente novamente após alguns minutos
3. Verifique se as APIs estão habilitadas:
   - Google Calendar API
   - Google Meet API
   - Google Workspace Events API
