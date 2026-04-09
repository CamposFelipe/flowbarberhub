# FlowBarberHub — Project Spec

## Overview
SaaS multi-tenant para barbearias.
Organization → Units → recursos.
Cada Unit tem booking público `/[unit-slug]`.

## Stack
Next.js 15, TypeScript, Prisma, PostgreSQL (Neon), Auth.js v5, Stripe, Tailwind v4

## Regras críticas
- Next.js 15: `await params`
- Auth.js v5: signOut via Server Action
- Tailwind v4: config via CSS (`@theme inline`)
- Zod: erros estruturados (422)
- Se org sem Unit → redirecionar `/onboarding`

## Multi-tenancy
Sempre filtrar por `organizationId` (ou via Unit)

## Roles
OWNER (global), ADMIN (unit), BARBER (restrito)

## Fluxo de cadastro e pagamento
1. Landing page → clique no plano → `/register?plan=<priceId>`
2. `/register` → cria usuário com `pendingPriceId`, redireciona para `/login?registered=true`
3. Login → middleware lê estado fresco do DB:
   - Sem org + plano pago (Básico/Pro/Business) → `/payment`
   - Sem org + Starter/null → `/onboarding`
4. `/payment` → pagar via Stripe OU ativar trial Starter grátis (15 dias)
   - Trial: `POST /api/payment/trial` → cria org com TRIAL, redireciona para `/onboarding`
   - Stripe: `POST /api/checkout` → webhook cria org com ACTIVE → `/onboarding`
5. `/onboarding` → configura Unit/equipe → `/dashboard`

## Planos
- Starter: trial 15 dias (sem cartão), sem pagamento inicial
- Básico/Pro/Business: exige pagamento antes do acesso
- Trial expirado / BLOCKED → `/subscribe`

## Segurança de pagamento
- `User.pendingPriceId` armazena plano escolhido no cadastro
- Middleware sempre lê DB (nunca JWT stale) para checar org/plano
- Usuário com plano pago e sem org fica bloqueado em `/payment`
- Sistema só fica ativo após webhook confirmar pagamento OU ativação do trial

## Domínio principal
Organization
Unit
Barber
Service
Product
Appointment
Transaction

## Funcionalidades atuais (alto nível)
- Dashboard (métricas + onboarding redirect)
- Appointments (criar, concluir, cancelar)
- Services (CRUD)
- Products (CRUD)
- Team (adicionar membros)
- Finance (transações)
- Booking público
- Stripe checkout + webhooks
- Registro com seleção de plano (`/register`)
- Página de pagamento isolada (`/payment`) com opção trial ou Stripe

## Limites de unidades por plano
- Starter / Básico / Pro: 1 unidade
- Business: 3 unidades
- Validado em POST /api/units e na página /settings/units

## Multi-unidade
- Cookie `activeUnitId` armazena unidade ativa do usuário
- UnitSwitcher no sidebar (exibido apenas se org tiver > 1 unidade)
- Server Action `setActiveUnit` em app/(app)/unit-actions.ts

## Regras importantes
- Soft delete para serviços/produtos
- Concluir appointment → gera Transaction + baixa estoque
- Middleware bloqueia acesso sem plano ativo
- JWT.organizationId é mantido fresco: quando null, auth.ts busca do DB (corrige loop de onboarding)
- /onboarding bloqueado pelo middleware se user já tem org + unidades → redireciona para /settings/units

## Dev
npm install
npm run db:push
npm run dev:local