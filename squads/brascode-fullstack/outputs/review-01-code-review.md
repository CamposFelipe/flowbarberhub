# Code Review — FlowBarberHub Bugs
**Agente:** Cris — Code Reviewer
**Data:** 2026-04-07
**Foco:** Correção de bugs e segurança no fluxo de cadastro/pagamento

---

## Resumo Geral: Aprovado com Correções ✅

3 bugs críticos identificados e corrigidos.

---

## Issues Críticos (corrigidos)

### 1. JWT Stale → Loop Infinito após Onboarding
**Arquivo:** `app/(app)/onboarding/page.tsx:65`
**Problema:** Após `POST /api/onboarding` bem-sucedido, o código chamava `router.push("/dashboard")` sem atualizar o JWT. O middleware lê `organizationId` do JWT — que ainda era `null` — e redirecionava de volta para `/onboarding`. Ciclo infinito.
**Correção:** Adicionado `await update()` antes de `router.push("/dashboard")`.

### 2. Empty String Salvo como `pendingPriceId`
**Arquivo:** `app/api/register/route.ts:43`
**Problema:** `pendingPriceId: priceId ?? null` — o operador `??` só substitui `null`/`undefined`. Se `priceId === ""` (string vazia, quando env vars não estão configuradas), era salvo como `""`. A função `isPaidPlan("")` retorna `false` pois `!!""` é falso — todos os usuários eram tratados como Starter e redirecionados para onboarding em vez de `/payment`.
**Correção:** Alterado para `priceId || null` (trata string vazia como nulo).

### 3. Org TRIAL Criada para Usuários de Plano Pago
**Arquivo:** `app/api/onboarding/route.ts`
**Problema:** Quando o webhook do Stripe ainda não tinha disparado ao momento da submissão do onboarding, a API criava a org com `planStatus: TRIAL` mesmo para usuários que escolheram plano pago.
**Correção:** Adicionada verificação de `freshUser.pendingPriceId`. Se for um plano pago (≠ Starter), cria a org como `ACTIVE`. O webhook do Stripe atualiza a subscription depois.

### 4. Criação Ilimitada de Unidades via Onboarding
**Arquivo:** `app/api/onboarding/route.ts`
**Problema:** A API de onboarding não verificava se a org já tinha unidades. Com o JWT stale, o usuário podia resubmeter o form ilimitadas vezes criando múltiplas unidades sem passar pelos limites do plano.
**Correção:** Adicionada verificação de `unit.count` antes de criar a unidade. Retorna 409 se já existe unidade.

---

## Pontos Positivos
- Middleware bem estruturado com separação clara de rotas públicas
- API `/api/units` já tem server-side enforcement de limites por plano ✅
- Webhook do Stripe bem organizado com casos distintos para novo usuário vs renovação ✅
- Leitura de DB fresco (não confiar no JWT) já é padrão em várias APIs ✅
