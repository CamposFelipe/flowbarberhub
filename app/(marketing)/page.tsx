import Link from "next/link";
import { Check, Scissors, BarChart3, Calendar, Package, Users, Zap, Shield, ChevronRight } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    price: "R$ 29,99",
    period: "/mês",
    description: "Ideal para o profissional solo",
    features: ["1 unidade", "1 barbeiro", "100 agendamentos/mês", "Link de agendamento", "Controle financeiro"],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
    highlight: false,
  },
  {
    name: "Básico",
    price: "R$ 49,99",
    period: "/mês",
    description: "Para barbearias em crescimento",
    features: ["1 unidade", "Até 3 barbeiros", "500 agendamentos/mês", "Link de agendamento", "Controle financeiro", "Gestão de produtos"],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC,
    highlight: true,
  },
  {
    name: "Pro",
    price: "R$ 89,99",
    period: "/mês",
    description: "Para barbearias estabelecidas",
    features: ["1 unidade", "Até 10 barbeiros", "1.500 agendamentos/mês", "Link personalizado", "Dashboard avançado", "Gestão de estoque", "Permissões por módulo"],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
    highlight: false,
  },
  {
    name: "Business",
    price: "R$ 149,99",
    period: "/mês",
    description: "Para redes de barbearias",
    features: ["Até 3 unidades", "Até 10 barbeiros/unidade", "Agendamentos ilimitados", "Visão consolidada CEO", "Dashboard multi-unidade", "Relatórios completos", "Suporte prioritário"],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS,
    highlight: false,
  },
  {
    name: "Personalizado",
    price: "Sob consulta",
    period: "",
    description: "Para grandes redes e franquias",
    features: ["Unidades ilimitadas", "Barbeiros ilimitados", "Agendamentos ilimitados", "White-label", "Integrações customizadas", "SLA dedicado", "Gerente de conta"],
    priceId: null,
    highlight: false,
  },
];

const FEATURES = [
  { icon: Calendar, title: "Agendamento inteligente", description: "Link público por unidade. Clientes agendam sem criar conta. Horários validados automaticamente." },
  { icon: BarChart3, title: "Dashboard financeiro", description: "Visualize receita em tempo real por barbeiro, unidade ou período. Exporte relatórios completos." },
  { icon: Package, title: "Controle de estoque", description: "Cadastre produtos, gerencie quantidades e baixe automaticamente ao finalizar atendimentos." },
  { icon: Users, title: "Multi-equipe", description: "Permissões granulares por módulo para cada barbeiro. CEO com visão 360° de todas as unidades." },
  { icon: Zap, title: "Finalize em segundos", description: "Um clique para encerrar o serviço. O sistema registra tudo: financeiro, estoque e histórico." },
  { icon: Shield, title: "Seus dados, sua conta", description: "Dados isolados por barbearia. Segurança enterprise sem pagar enterprise." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Scissors className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">FlowBarberHub</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Entrar
            </Link>
            <Link
              href="#planos"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[hsl(224,71%,18%)] to-[hsl(221,83%,35%)] py-24 sm:py-32">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/90">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            15 dias grátis · sem cartão de crédito
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Gestão completa para<br />
            <span className="text-blue-300">barbearias modernas</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
            Agendamento online, controle financeiro, gestão de estoque e muito mais.
            Tudo em uma plataforma feita para o seu negócio crescer.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="#planos"
              className="flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary shadow-lg hover:bg-white/90 transition-all"
            >
              Começar teste grátis <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="#funcionalidades"
              className="rounded-xl border border-white/20 px-8 py-3.5 text-base font-medium text-white hover:bg-white/10 transition-all"
            >
              Ver funcionalidades
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section id="funcionalidades" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Tudo que você precisa em um lugar</h2>
            <p className="mt-4 text-lg text-muted-foreground">Do agendamento ao financeiro, sem complicação.</p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="planos" className="bg-muted/50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Planos para todos os tamanhos</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Comece com 15 dias grátis no plano Starter. Sem cartão de crédito.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  plan.highlight
                    ? "border-primary bg-primary shadow-xl shadow-primary/20 text-white"
                    : "border-border bg-card"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1 text-xs font-bold text-primary shadow">
                    MAIS POPULAR
                  </div>
                )}
                <div>
                  <p className={`text-sm font-medium ${plan.highlight ? "text-blue-100" : "text-muted-foreground"}`}>
                    {plan.name}
                  </p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold">{plan.price}</span>
                    {plan.period && (
                      <span className={`text-sm ${plan.highlight ? "text-blue-100" : "text-muted-foreground"}`}>
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p className={`mt-1 text-xs ${plan.highlight ? "text-blue-100" : "text-muted-foreground"}`}>
                    {plan.description}
                  </p>
                </div>

                <ul className="my-6 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className={`h-4 w-4 shrink-0 ${plan.highlight ? "text-blue-200" : "text-primary"}`} />
                      <span className={plan.highlight ? "text-white/90" : ""}>{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.priceId ? (
                  <form action="/api/checkout" method="POST">
                    <input type="hidden" name="priceId" value={plan.priceId} />
                    <button
                      type="submit"
                      className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${
                        plan.highlight
                          ? "bg-white text-primary hover:bg-white/90"
                          : "bg-primary text-white hover:bg-primary/90"
                      }`}
                    >
                      {plan.name === "Starter" ? "Começar grátis" : `Assinar ${plan.name}`}
                    </button>
                  </form>
                ) : (
                  <Link
                    href="mailto:contato@flowbarberhub.com.br"
                    className="block w-full rounded-xl border border-border py-2.5 text-center text-sm font-semibold hover:bg-muted transition-all"
                  >
                    Falar com vendas
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <Scissors className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-semibold">FlowBarberHub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} FlowBarberHub. Todos os direitos reservados.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">Privacidade</Link>
              <Link href="/terms" className="hover:text-foreground">Termos</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
