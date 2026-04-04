# FlowBarberHub

SaaS multi-tenant para barbearias — agendamento online, gestão de equipe, financeiro e controle de estoque.

## Tecnologias

| Camada | Stack |
|--------|-------|
| Framework | Next.js 15 (App Router) + TypeScript |
| Autenticação | Auth.js v5 (NextAuth) — JWT + Credentials |
| Banco de dados | PostgreSQL via Neon (serverless) |
| ORM | Prisma 6 |
| Pagamentos | Stripe (Checkout Sessions + Webhooks) |
| Estilo | Tailwind CSS v4 + CSS Variables |
| UI | Lucide React + Radix UI |
| Deploy | Vercel |

## Arquitetura Multi-Tenant

```
Organization (tenant raiz)
└── Unit (unidade física / filial)
    ├── Barbers  → atendentes com permissões por módulo
    ├── Services → serviços com preço e duração
    ├── Products → estoque de produtos
    └── Appointments → agendamentos (público ou autenticado)
```

## Pré-requisitos

- Node.js 20+
- PostgreSQL (recomendado: [Neon](https://neon.tech))
- Conta Stripe (modo teste para desenvolvimento)
- [Stripe CLI](https://stripe.com/docs/stripe-cli) (para webhook local)

## Instalação

```bash
git clone https://github.com/brascode/flowbarberhub.git
cd flowbarberhub
npm install
```

## Configuração

Copie o arquivo de exemplo e preencha as variáveis:

```bash
cp .env.example .env.local
```

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string do PostgreSQL (Neon) |
| `AUTH_SECRET` | Segredo JWT — gere com `openssl rand -base64 32` |
| `STRIPE_SECRET_KEY` | `sk_test_...` do Stripe |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` do Stripe |
| `STRIPE_WEBHOOK_SECRET` | Gerado pelo `stripe listen` |
| `STRIPE_PRICE_ID_*` | IDs dos preços criados no Stripe Dashboard |
| `NEXTAUTH_URL` | URL base da aplicação (ex: `http://localhost:3000`) |

Crie também um `.env` apenas com `DATABASE_URL` para o Prisma CLI:

```bash
echo "DATABASE_URL=..." > .env
```

## Banco de dados

```bash
# Aplicar o schema no banco
npm run db:push

# (opcional) Abrir Prisma Studio
npm run db:studio
```

## Como rodar

```bash
# Desenvolvimento com Stripe listener local
npm run dev:local

# Apenas Next.js
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

## Estrutura do projeto

```
app/
├── (marketing)/          # Landing page pública
├── (app)/                # Dashboard autenticado (sidebar layout)
│   ├── dashboard/        # Métricas e visão geral
│   ├── appointments/     # Gestão de agendamentos
│   ├── finance/          # Histórico financeiro
│   ├── products/         # Estoque de produtos
│   ├── team/             # Gestão de equipe
│   └── settings/         # Configurações da organização
├── (booking)/[unit-slug] # Página pública de agendamento
├── api/
│   ├── appointments/     # CRUD + complete + cancel
│   ├── auth/             # Auth.js handlers
│   ├── checkout/         # Stripe Checkout Session
│   ├── onboarding/       # Setup inicial da org
│   ├── products/         # CRUD de produtos
│   ├── team/             # CRUD de membros
│   └── webhooks/stripe/  # Eventos Stripe
├── login/                # Página de login
└── subscribe/            # Página de upgrade de plano
lib/
├── auth.ts               # Configuração Auth.js v5
├── prisma.ts             # Singleton PrismaClient
└── utils.ts              # Funções utilitárias
middleware.ts             # Proteção de rotas + trial enforcement
prisma/schema.prisma      # Schema completo com 16 models
```

## API Reference

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/appointments` | Criar agendamento (público) |
| `POST` | `/api/appointments/[id]/complete` | Concluir atendimento |
| `POST` | `/api/appointments/[id]/cancel` | Cancelar agendamento |
| `POST` | `/api/onboarding` | Setup inicial da organização |
| `POST` | `/api/checkout` | Criar Stripe Checkout Session |
| `POST` | `/api/webhooks/stripe` | Webhook Stripe |
| `POST` | `/api/products` | Criar produto |
| `POST` | `/api/team` | Adicionar membro à equipe |

## Planos

| Plano | Preço | Unidades | Barbeiros |
|-------|-------|----------|-----------|
| Trial | Grátis (15 dias) | 1 | 2 |
| Básico | R$ 79/mês | 1 | 3 |
| Profissional | R$ 149/mês | 2 | 8 |
| Premium | R$ 249/mês | 5 | 20 |
| Enterprise | R$ 499/mês | Ilimitado | Ilimitado |

## Testes

```bash
npx tsc --noEmit    # Verificação de tipos
npm run lint        # ESLint
```

## Contribuição

Projeto privado — BRASCODE. Para contribuições, abra uma issue ou PR seguindo os padrões de [Conventional Commits](https://www.conventionalcommits.org/).

## Licença

Proprietário — © 2026 BRASCODE / Felipe Campos. Todos os direitos reservados.
