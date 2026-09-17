# CRM · JBDev

CRM comercial white-label para times de venda: uma base de código, várias empresas, cada uma com a própria identidade. Sem cadastro público e sem cobrança — produto para operação e para o portfólio da JBDev.

Objetivo: centralizar leads, organizar o funil, emitir propostas e não deixar venda cair por falta de follow-up.

## O que o produto cobre

- Leads, funil kanban, clientes, empresas, oportunidades e produtos
- Propostas com itens, status e documento para imprimir/PDF
- Tarefas, follow-ups e agenda da semana
- Dashboard, relatórios, busca e notificações de atraso
- Usuários (admin, gestor, vendedor) e aparência por workspace
- Importação/exportação CSV e API/webhook para captar leads

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui + Lucide
- React Hook Form + Zod
- TanStack Query
- Prisma ORM + PostgreSQL
- Autenticação por sessão (cookie httpOnly + hash)

## Como instalar

```bash
npm install
cp .env.example .env
```

Suba o PostgreSQL com Docker (`npm run db:up`) ou use um Postgres local na porta 5432. Crie o banco e o usuário `crm` se ainda não existirem:

```bash
createdb crm
```

Depois:

```bash
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

```env
DATABASE_URL="postgresql://crm:crm@localhost:5432/crm?schema=public"
AUTH_SECRET="uma-chave-longa-e-aleatoria"
NEXT_PUBLIC_APP_NAME="CRM"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Banco

PostgreSQL 16 via Docker Compose.

```bash
npm run db:up      # sobe o banco
npm run db:down    # para o banco
npm run db:studio  # Prisma Studio
```

## Prisma

```bash
npx prisma migrate dev
npx prisma generate
npm run db:seed
```

Todas as tabelas de negócio possuem `workspaceId`. Toda query valida o workspace da sessão. O frontend nunca define o tenant.

## Workspaces de demonstração

São apenas dados de exemplo, isolados entre si. Não fazem parte da identidade do produto.

| Workspace | Login | Admin | Senha |
|-----------|-------|-------|-------|
| NovaTech Comercial | `/login?w=novatech` | admin@novatech.com | Demo@1234 |
| Atlas Serviços | `/login?w=atlas` | admin@atlas.com | Demo@1234 |

A página `/login` sem `?w=` apresenta o produto e os acessos de demo.

## Arquitetura

```
src/
  actions/          # Server Actions (regras de negócio)
  app/              # Rotas, layouts e APIs
  components/       # UI reutilizável e composições
  lib/auth/         # Sessão, senha e permissões
  lib/events/       # Histórico interno e notificações
  lib/queries/      # Leituras com escopo de workspace
  lib/validations/  # Zod
prisma/             # Schema e seed
docs/api.md         # Contratos de API/webhook
```

Perfis:

- **Admin**: acesso total, usuários, etapas, API keys e configurações
- **Gestor**: vê todos os leads, equipe e relatórios; redistribui responsáveis
- **Vendedor**: vê e atualiza apenas os próprios leads

## Personalização sem mudar código

Em **Configurações > Aparência** o administrador altera nome, logo, cores e tema. A identidade vale só para aquele workspace.

Também é possível ajustar etapas do funil, origens, tags, motivos de perda, usuários e chaves de API.

## API e webhook

Os endpoints `GET/POST /api/leads` e `POST /api/webhooks/leads` exigem sessão ou API key gerada em Configurações. Veja `docs/api.md`.

## Deploy (Railway)

O projeto sobe com PostgreSQL. Variáveis necessárias:

```env
DATABASE_URL=
AUTH_SECRET=
NEXT_PUBLIC_APP_NAME="CRM"
NEXT_PUBLIC_APP_URL=
```

Depois do primeiro deploy, rode o seed uma vez para criar os workspaces de demonstração:

```bash
npx railway run npm run db:seed
```
