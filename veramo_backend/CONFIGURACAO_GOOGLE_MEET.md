# Configuração do Google Meet para Homologadores

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis no arquivo `google_config.env`:

```env
# Credenciais OAuth2 do Google Cloud Console
GOOGLE_CLIENT_ID=seu_client_id_aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_REDIRECT_URI=http://localhost:8000/oauth2callback

# Escopo necessário para criar eventos no Google Calendar
GOOGLE_SCOPES=https://www.googleapis.com/auth/calendar.events
```

## Configuração no Google Cloud Console

1. **Acesse**: https://console.cloud.google.com/
2. **Crie um projeto** ou selecione um existente
3. **Ative a API**: "Google Calendar API"
4. **Crie credenciais OAuth 2.0**:
   - Tipo: Aplicação Web
   - URIs de redirecionamento autorizados:
     - `http://localhost:8000/oauth2callback` (desenvolvimento)
     - `https://seudominio.com/oauth2callback` (produção)
5. **Copie** o Client ID e Client Secret para as variáveis acima

## Como Funciona o Sistema

### 1. Conectar Homologador ao Google
```bash
GET /api/homologadores/{homologador_id}/google/auth-url/
```
- Retorna URL de autorização OAuth2
- Homologador faz login no Google
- Tokens são salvos no banco de dados

### 2. Criar Agendamento
```bash
POST /api/demissao-process/{processo_id}/agendar/
```
- Verifica disponibilidade do homologador
- Cria evento no Google Calendar do homologador
- Gera link do Google Meet automaticamente

### 3. Gerar Link Meet
```bash
POST /api/demissao-process/{processo_id}/gerar-link-meet/
```
- Cria evento no Google Calendar se não existir
- Retorna link do Google Meet

### 4. Remarcar Evento
```bash
POST /api/demissao-process/{processo_id}/remarcar-evento/
```
- Atualiza horário no Google Calendar
- Envia notificações para participantes

### 5. Cancelar Evento
```bash
POST /api/demissao-process/{processo_id}/cancelar-evento/
```
- Remove evento do Google Calendar
- Atualiza status do agendamento

## Tratamento de Erros

- **422**: Homologador sem Google conectado
- **400**: Parâmetros inválidos
- **500**: Erro interno do servidor

## Modelo de Dados

### GoogleOAuthToken
- `homologador_id`: ID do homologador
- `email_google`: Email da conta Google
- `access_token`: Token de acesso
- `refresh_token`: Token de renovação
- `token_expiry`: Data de expiração
- `scopes`: Escopos autorizados
