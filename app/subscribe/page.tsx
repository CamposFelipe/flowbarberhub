import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assinatura Necessária",
};

type Plan = {
  name: string;
  price: string;
  description: string;
  priceId: string | null | undefined;
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Starter",
    price: "R$ 29,99",
    description: "1 unidade · 1 barbeiro · 100 agendamentos/mês",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
  },
  {
    name: "Básico",
    price: "R$ 49,99",
    description: "1 unidade · até 3 barbeiros · 500 agendamentos/mês",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC,
    highlight: true,
  },
  {
    name: "Pro",
    price: "R$ 89,99",
    description: "1 unidade · até 10 barbeiros · 1.500 agendamentos/mês",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
  },
  {
    name: "Business",
    price: "R$ 149,99",
    description: "até 3 unidades · até 10 barbeiros/unidade · ilimitado",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS,
  },
  {
    name: "Personalizado",
    price: "Sob consulta",
    description: "Cadeias grandes · white-label · suporte dedicado",
    priceId: null,
  },
] as const;

export default function SubscribePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-4xl w-full text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive text-sm font-medium px-4 py-2 rounded-full">
          <span>⚠️</span>
          <span>Seu período de teste encerrou</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          Escolha um plano para continuar
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Seu trial de 15 dias expirou. Assine um plano para retomar o acesso à
          sua barbearia no FlowBarberHub.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-full max-w-6xl">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-xl border p-6 flex flex-col gap-4 ${
              plan.highlight
                ? "border-primary shadow-lg bg-primary/5"
                : "border-border bg-card"
            }`}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                Mais popular
              </span>
            )}
            <div>
              <h2 className="text-lg font-bold">{plan.name}</h2>
              <p className="text-2xl font-extrabold mt-1">{plan.price}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {plan.description}
              </p>
            </div>

            {plan.priceId ? (
              <form action="/api/checkout" method="POST" className="mt-auto">
                <input type="hidden" name="priceId" value={plan.priceId} />
                <button
                  type="submit"
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                    plan.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border hover:bg-muted"
                  }`}
                >
                  Assinar {plan.name}
                </button>
              </form>
            ) : (
              <Link
                href="mailto:contato@flowbarberhub.com"
                className="mt-auto w-full py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted text-center transition-colors"
              >
                Entrar em contato
              </Link>
            )}
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Dúvidas?{" "}
        <Link
          href="mailto:contato@flowbarberhub.com"
          className="underline hover:text-foreground"
        >
          Fale conosco
        </Link>
      </p>
    </div>
  );
}
