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

## Planos
Trial 15 dias → após expirar → `/subscribe`

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

## Regras importantes
- Soft delete para serviços/produtos
- Concluir appointment → gera Transaction + baixa estoque
- Middleware bloqueia acesso sem plano ativo

## Dev
npm install
npm run db:push
npm run dev:local