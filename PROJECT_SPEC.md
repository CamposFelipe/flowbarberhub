# FlowBarberHub — Project Specification (Consolidated)

## Overview

FlowBarberHub is a multi-tenant SaaS platform initially targeting barbershops, designed to expand to salons, tattoo studios, and other service businesses. Each business is an **Organization** (type: `BARBER` initially), which operates one or more **Units** (physical locations).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Component Library | Shadcn/UI |
| ORM | Prisma |
| Database | PostgreSQL (Neon — free tier, scale to paid) |
| Authentication | Auth.js v5 (NextAuth) — own tables on Neon |
| Payments | Stripe |
| Hosting | Vercel (free tier → Vercel Pro or Hostinger on scale) |

---

## Architecture: Multi-Tenancy

- **Tenant = Organization** — generic entity to support future niches.
- `Organization.type` enum: `BARBER` (first implementation), future: `SALON`, `TATTOO`, etc.
- An Organization has **1–N Units** (physical locations), each with its own public booking link.
- All data scoped via `organizationId`. Units are sub-scopes.
- Tenant isolation enforced at application layer on every query.

---

## User Roles & Permissions

```
OWNER (CEO — Organization level)
 └── ADMIN (Unit manager — one or more Units)
      └── BARBER (Professional — one or more Units)
           └── Client (books via public link, may or may not have an account)
```

| Role | Scope | Key Permissions |
|---|---|---|
| **OWNER** | Organization | Full access to all units, billing, staff, financial data (all units combined or per unit) |
| **ADMIN** | Unit | Manage staff, schedule, services, products, booking link slug |
| **BARBER** | Unit | Own schedule, own appointments, finalize services; permissions are **per-module and configurable** |
| **Client** | Unit | Book appointments (with or without account) |

### Permission Rules

- `Role` enum on `User`: `OWNER`, `ADMIN`, `BARBER`.
- BARBER permissions are **granular per module** (e.g., can access financial: yes/no, can edit services: yes/no). Stored as a JSON/flags field on the `Barber` or `UserUnit` join entity.
- An OWNER can optionally appear in the barber list (`showAsBarber: Boolean` on User or Barber).
- A Barber can be linked to **one or more Units** within the same Organization.

---

## Subscription Plans

15-day free trial on Organization creation (`trialEndsAt = createdAt + 15 days`). After expiry with no active plan → access blocked, redirect to upgrade page.

| # | Price (BRL/month) | Units | Barbers/Unit | Appointments/month |
|---|---|---|---|---|
| 1 | R$ 29,99 | 1 | 1 | 100 |
| 2 | R$ 49,99 | 1 | up to 3 | 500 |
| 3 | R$ 89,99 | 1 | up to 10 | 1.500 |
| 4 | R$ 149,99 | up to 3 | up to 10/unit | Unlimited |
| 5 | Custom | Custom | Custom | Unlimited |

### Trial & Plan Enforcement (Middleware)

Every authenticated request checks:
1. `Organization.planStatus === 'ACTIVE'` → allow
2. Else: `now < Organization.trialEndsAt` → allow (trial)
3. Else: redirect to `/subscribe` (blocked page)

---

## Core Domain Entities

### Organization
- `id`, `name`, `type` (enum: `BARBER`…), `slug`
- `trialEndsAt`, `planStatus` (enum: `TRIAL`, `ACTIVE`, `BLOCKED`)
- Relations: Units, Users, Subscription

### Unit
- `id`, `organizationId`, `name`, `slug` (editable booking link)
- Operating hours: open/close time, days of week, optional break intervals
- When closed (day or time slot) → not shown in booking calendar
- Relations: Barbers, Services, Products, Appointments

### User (Auth.js v5 tables)
- `id`, `name`, `email`, `role` (enum: `OWNER`, `ADMIN`, `BARBER`)
- `organizationId`
- `showAsBarber` (Boolean — OWNER can opt into barber list)
- Standard Auth.js tables: `Account`, `Session`, `VerificationToken`

### Barber (extends User assignment to Units)
- Links a User (role BARBER or OWNER with showAsBarber) to one or more Units
- `modulePermissions` (JSON) — granular per-module access flags
- Relations: Appointments, Unit

### Service
- `id`, `unitId`, `name`, `price`, `durationMinutes`
- Used to block calendar slots during booking

### Product
- `id`, `unitId`, `name`, `price`, `stock` (quantity)
- Decremented when consumed during service finalization

### Appointment
- `id`, `unitId`, `barberId`, `serviceId`
- `clientId` (nullable — anonymous booking allowed)
- `clientPhone`, `clientEmail` (captured for anonymous bookings)
- `startsAt`, `endsAt` (derived from service duration)
- `status` (enum: `SCHEDULED`, `COMPLETED`, `CANCELLED`)

### Client
- `id`, `name`, `phone`, `email`
- Self-registered or created anonymously during booking
- Anonymous bookings can be merged by phone/email if client creates account later

### Transaction
- `id`, `unitId`, `barberId`, `appointmentId`
- `type` (enum: `SERVICE`, `PRODUCT`)
- `amount`, `createdAt`
- Created automatically on service finalization

### Subscription
- `id`, `organizationId`
- `stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId`
- `planName`, `status`, `currentPeriodEnd`

---

## Key Features & Flows

### Landing Page
- Marketing page with plan comparison table
- Stripe Checkout integration — on successful payment, triggers Organization creation and onboarding flow

### Onboarding (Post-Signup)
- Step 1: Create Organization (name, type)
- Step 2: Create first Unit (name, slug, operating hours)
- Step 3: Invite or create first Barber

### Public Booking Link
- Route: `/[unit-slug]`
- Flow: Select Service → Select Barber → Select available time slot → Confirm
- If not logged in: capture phone + email
- Backend validates against Unit operating hours and existing appointments
- Booking link slug is editable by ADMIN/OWNER

### Dashboard (Authenticated)
- Financial summary: revenue today / week / month
- OWNER sees all units combined or filtered per unit
- ADMIN/BARBER sees own unit or own appointments
- Calendar view: Day / Week / Month modes
- Upcoming appointments list

### Service Finalization (Barber flow)
1. Barber marks appointment as completed
2. Modal opens: "Did the client purchase any product?"
3. If yes: select product(s) and quantity (default: 1)
4. System: creates `Transaction` records (service + optional products), decrements product stock
5. Dashboard financial data updates in real time

### Financial Module
- Detailed list of all transactions
- Filter by date, barber, unit, type (service/product)
- Export to CSV/PDF

### Products & Inventory
- CRUD for products per Unit
- Stock quantity tracked; alert on low stock (future)
- Consumed on service finalization

---

## Non-Functional Requirements

- **Security**: `organizationId` scope on all DB queries; no cross-tenant leakage.
- **Scalability**: Neon serverless Postgres + Vercel Edge-compatible middleware.
- **Accessibility**: Shadcn/UI WCAG 2.1 AA baseline.
- **Real-time**: Dashboard financial data reflects service finalization immediately (SWR revalidation or server actions).

---

## Implementation Phases

### Phase 1 — Foundation (Sequential, required first)
- [ ] Prisma schema (all entities above)
- [ ] Next.js scaffold + Auth.js v5 + trial/plan middleware

### Phase 2 — Parallel Implementation
- [ ] Landing page + Stripe integration
- [ ] Organization & Unit onboarding flow
- [ ] Public booking page `/[unit-slug]`
- [ ] Dashboard (financial summary + calendar)
- [ ] Service finalization + Transaction/financial module
- [ ] Products & inventory module
