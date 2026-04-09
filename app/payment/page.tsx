import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Scissors, ShieldCheck, Gift } from "lucide-react";
import PaymentActions from "./payment-actions";

const PLAN_DETAILS: Record<string, { name: string; price: string; description: string; features: string[] }> = {
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC ?? ""]: {
    name: "Básico",
    price: "R$ 49,99/mês",
    description: "Para barbearias em crescimento",
    features: ["1 unidade", "Até 3 barbeiros", "500 agendamentos/mês", "Controle financeiro", "Gestão de produtos"],
  },
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? ""]: {
    name: "Pro",
    price: "R$ 89,99/mês",
    description: "Para barbearias estabelecidas",
    features: ["1 unidade", "Até 10 barbeiros", "1.500 agendamentos/mês", "Link personalizado", "Dashboard avançado", "Permissões por módulo"],
  },
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS ?? ""]: {
    name: "Business",
    price: "R$ 149,99/mês",
    description: "Para redes de barbearias",
    features: ["Até 3 unidades", "Até 10 barbeiros/unidade", "Agendamentos ilimitados", "Visão consolidada CEO", "Relatórios completos", "Suporte prioritário"],
  },
};

export default async function PaymentPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Always read fresh state — middleware already enforces this page is only for
  // authenticated users with no org and a paid pendingPriceId, but we double-check here.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true, pendingPriceId: true },
  });

  if (!user) redirect("/login");

  // If they already have an org, they've paid — send to dashboard
  if (user.organizationId) redirect("/dashboard");

  // If no pendingPriceId or it's starter, they shouldn't be here
  const STARTER_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ?? "";
  if (!user.pendingPriceId || user.pendingPriceId === STARTER_PRICE_ID) {
    redirect("/onboarding");
  }

  const plan = PLAN_DETAILS[user.pendingPriceId];

  // Unknown price — send to onboarding as fallback
  if (!plan) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(224,71%,18%)] to-[hsl(221,83%,35%)] flex items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Scissors className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">FlowBarberHub</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white p-8 shadow-2xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Ative seu plano</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Escolha como quer começar — você pode mudar de plano a qualquer momento.
            </p>
          </div>

          {/* Selected plan summary */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Plano selecionado</p>
                <p className="text-xl font-bold mt-0.5">{plan.name}</p>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <p className="text-lg font-extrabold text-primary">{plan.price}</p>
            </div>
            <ul className="grid grid-cols-2 gap-1.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
            <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              O sistema só ficará ativo após a confirmação do pagamento. Seus dados estão seguros e criptografados.
            </p>
          </div>

          {/* Actions — client component */}
          <PaymentActions priceId={user.pendingPriceId} planName={plan.name} />

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Trial option */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Começar com o plano Starter (trial grátis)</p>
                <p className="text-xs text-emerald-700">15 dias grátis · sem cartão de crédito · sem compromisso</p>
              </div>
            </div>
            <p className="text-xs text-emerald-700">
              Comece a usar o FlowBarberHub agora mesmo com o plano Starter. Após 15 dias você pode assinar qualquer plano para continuar.
            </p>
            <TrialButtonClient />
          </div>
        </div>

        <p className="text-center text-xs text-white/60">
          Ao prosseguir você concorda com os{" "}
          <a href="/terms" className="underline hover:text-white/90">Termos de Uso</a>{" "}
          e a{" "}
          <a href="/privacy" className="underline hover:text-white/90">Política de Privacidade</a>.
        </p>
      </div>
    </div>
  );
}

import TrialButtonClient from "./trial-button";
