# API e webhooks

Os endpoints abaixo já existem, mas não são públicos. Sem sessão autenticada ou API key válida, a resposta é `401`.

## Autenticação

- Sessão do CRM (cookie `crm_session`)
- ou header `Authorization: Bearer <api-key>` / `x-api-key`

A API key é armazenada apenas como hash (`ApiKey.tokenHash`). O administrador gera e revoga chaves em **Configurações > Integrações e API**.

## Endpoints

### `GET /api/leads`

Lista leads do workspace autenticado.

### `POST /api/leads`

Cria um lead.

```json
{
  "firstName": "Ana",
  "lastName": "Souza",
  "email": "ana@empresa.com",
  "phone": "11999999999",
  "companyName": "Empresa Exemplo"
}
```

### `POST /api/webhooks/leads`

Mesmo contrato do `POST /api/leads`, pensado para formulários, n8n, Make, Zapier e sites.

### `GET /api/export/leads`

Exporta os leads visíveis da sessão em CSV. Exige login.

## Eventos internos

O CRM registra no histórico e dispara notificações para:

- `lead.created`
- `lead.stage_changed`
- `lead.won`
- `lead.lost`
- `lead.assigned`
- `followup.created`
- `task.completed`
- `proposal.created`
- `proposal.status_changed`

Follow-ups e tarefas atrasados geram aviso no sino ao abrir o app.
