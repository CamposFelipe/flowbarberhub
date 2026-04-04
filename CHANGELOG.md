# Changelog

Todas as mudanças notáveis neste projeto serão documentadas aqui.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

## [0.1.0] — 2026-04-04

### Added

#### Infraestrutura & Autenticação
- Scaffold Next.js 15 com App Router e TypeScript
- Tailwind CSS v4 com sistema de design 60-30-10 (branco / azul-profundo / azul-elétrico)
- Schema Prisma com 16 models: `Organization`, `Unit`, `UnitSchedule`, `User`, `Account`, `Session`, `Barber`, `BarberUnit`, `Client`, `Service`, `Product`, `Appointment`, `Transaction`, `TransactionItem`, `Subscription`, `VerificationToken`
- Auth.js v5 com estratégia JWT e Credentials provider (bcrypt)
- Middleware de proteção de rotas com trial enforcement (bloqueia após 15 dias)
- Extensão de tipos NextAuth (`types/next-auth.d.ts`) com `role` e `organizationId`

#### Landing Page & Onboarding
- Landing page com hero, grid de features (6 cards) e tabela de preços (5 planos)
- Fluxo de checkout via Stripe Checkout Session com trial de 15 dias
- Wizard de onboarding em 3 etapas: Empresa → Unidade → Equipe
- Auto-geração de slug a partir do nome da organização

#### Dashboard & App Shell
- Layout com sidebar azul-profundo, navegação em 6 itens e logout via Server Action
- Dashboard com métricas de receita (hoje / 7 dias / mês) e próximos agendamentos
- Página de agendamentos com tabs de status (Todos / Agendados / Concluídos / Cancelados)
- Botões Concluir e Cancelar com confirmação inline e atualização sem reload

#### Financeiro & Produtos
- Página financeira com cards de receita e histórico de transações (serviços + produtos)
- Página de produtos com badges de estoque (baixo ≤ 3 / zerado)
- Modal de criação de produtos com validação de preço, estoque e unidade

#### Equipe & Configurações
- Página de equipe com badges de role (OWNER / ADMIN / BARBER)
- Modal de convite para adicionar membros com senha inicial e atribuição de unidade
- Página de configurações com info da org, plano, unidade e horários de funcionamento

#### Agendamento Público
- Página pública de agendamento por slug da unidade (`/[unit-slug]`)
- Wizard em 4 etapas: Serviço → Barbeiro → Data/Hora → Confirmação
- Geração de slots de horário a partir da grade de `UnitSchedule`
- Suporte a clientes anônimos (captura nome, telefone e e-mail)

#### APIs
- `POST /api/appointments` — criar agendamento com validação de conflito
- `POST /api/appointments/[id]/complete` — concluir + criar Transaction + decrementar estoque
- `POST /api/appointments/[id]/cancel` — cancelar agendamento
- `POST /api/onboarding` — criar Org + Unit + UnitSchedule + Barber em transação atômica
- `POST /api/checkout` — Stripe Checkout Session
- `POST /api/webhooks/stripe` — handlers para `checkout.session.completed`, `subscription.updated`, `subscription.deleted`
- `POST /api/products` — criar produto
- `POST /api/team` — criar User + Barber + BarberUnit em transação atômica

#### Dev Tools
- Script `scripts/stripe-listen.js` para webhook local via Stripe CLI
- Script `npm run dev:local` com `concurrently` (Next.js + Stripe listener)
- `.env.example` com todas as variáveis documentadas

---

[Unreleased]: https://github.com/brascode/flowbarberhub/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/brascode/flowbarberhub/releases/tag/v0.1.0
