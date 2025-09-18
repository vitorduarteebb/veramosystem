# 🔗 Integração Google Meet - Veramo3

Este documento explica como configurar e usar a integração com Google Meet no sistema Veramo3.

## 📋 Funcionalidades

- ✅ **Criar reuniões** automaticamente no Google Meet
- ✅ **Atualizar reuniões** existentes
- ✅ **Deletar reuniões** quando necessário
- ✅ **Integração automática** com agendamentos
- ✅ **Notificações** por e-mail e WhatsApp com links do Meet

## 🚀 Configuração Rápida

### 1. Configurar Google Cloud Project

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Habilite as APIs necessárias:
   - Google Calendar API
   - Google Meet API
   - Google Workspace Events API

### 2. Criar Credenciais OAuth

1. No Google Cloud Console, vá para "APIs & Services" > "Credentials"
2. Clique em "Create Credentials" > "OAuth 2.0 Client IDs"
3. Escolha "Desktop application"
4. Baixe o arquivo JSON das credenciais
5. Renomeie para `client_secret.json` e coloque na pasta `veramo_backend/`

### 3. Configurar Variáveis de Ambiente

Edite o arquivo `veramo_backend/veramo_backend/settings/local.py`:

```python
# Configurações do Google Meet
GOOGLE_OAUTH_CLIENT_SECRETS_FILE = BASE_DIR / 'client_secret.json'
GOOGLE_OAUTH_TOKEN_FILE = BASE_DIR / 'google_token.json'
GOOGLE_CALENDAR_ID = 'primary'
```

### 4. Testar Configuração

```bash
cd veramo_backend
python test_meet_integration.py
```

## 🔧 Uso no Sistema

### Criar Reunião Automaticamente

Quando um agendamento é criado, o sistema automaticamente:

1. Cria uma reunião no Google Meet
2. Salva o link no banco de dados
3. Envia notificações aos participantes

### Endpoints Disponíveis

#### Criar Reunião de Teste
```bash
POST /api/schedule/test-create-meeting/
{
  "summary": "Título da Reunião",
  "description": "Descrição da reunião",
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T11:00:00Z"
}
```

#### Criar Sala para Agendamento
```bash
POST /api/schedule/{id}/create_meeting_room/
```

#### Remover Sala
```bash
POST /api/schedule/{id}/delete_meeting_room/
```

## 📊 Estrutura do Banco de Dados

O modelo `Schedule` possui os seguintes campos para integração:

```python
class Schedule(models.Model):
    # Campos do Google Meet
    google_calendar_event_id = models.CharField(max_length=255, blank=True, null=True)
    google_meet_conference_id = models.CharField(max_length=255, blank=True, null=True)
    google_meet_link = models.URLField(blank=True, null=True)
    google_calendar_link = models.URLField(blank=True, null=True)
    meeting_created_at = models.DateTimeField(blank=True, null=True)
    
    @property
    def has_google_meeting(self):
        """Verifica se já foi criada uma reunião no Google Meet"""
        return bool(self.google_meet_link and self.google_calendar_event_id)
```

## 🛠️ Comandos de Gerenciamento

### Verificar Configuração
```bash
python manage.py test_google_meet --check-config
```

### Criar Reunião de Teste
```bash
python manage.py test_google_meet --create-meeting
```

### Listar Reuniões
```bash
python manage.py test_google_meet --list-meetings
```

## 🔒 Segurança

- Todas as operações são logadas
- Rate limiting configurado
- Credenciais armazenadas de forma segura
- Validação de permissões por usuário

## 🐛 Solução de Problemas

### Erro: "Nenhuma credencial Google configurada"
- Verifique se o arquivo `client_secret.json` existe
- Confirme se o caminho está correto no settings

### Erro: "Service account does not have access to calendar"
- Verifique se a conta tem permissões no Google Calendar
- Adicione o email da conta com permissões de "Make changes to events"

### Erro: "Invalid credentials"
- Verifique se o arquivo de credenciais está correto
- Confirme se as APIs estão habilitadas no Google Cloud

## 📞 Suporte

Para suporte técnico, consulte:
- [Google Calendar API Documentation](https://developers.google.com/calendar)
- [Google Meet API Documentation](https://developers.google.com/meet)
- [Google Cloud Console](https://console.cloud.google.com/)

## 📝 Logs

Os logs de integração são salvos em:
- `logs/google_meet.log` - Logs detalhados
- `logs/security.log` - Logs de segurança
- Console Django - Logs de erro

## 🔄 Atualizações

Para atualizar a integração:

1. Atualize as dependências:
```bash
pip install --upgrade google-auth google-api-python-client
```

2. Execute as migrações:
```bash
python manage.py migrate
```

3. Teste a configuração:
```bash
python manage.py test_google_meet --check-config
```
