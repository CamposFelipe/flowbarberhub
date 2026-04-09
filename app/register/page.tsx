"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Scissors, Check, Eye, EyeOff, Loader2, ChevronDown } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    price: "R$ 29,99/mês",
    description: "Ideal para o profissional solo",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ?? "",
    isFree: true,
  },
  {
    name: "Básico",
    price: "R$ 49,99/mês",
    description: "Para barbearias em crescimento",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC ?? "",
    isFree: false,
  },
  {
    name: "Pro",
    price: "R$ 89,99/mês",
    description: "Para barbearias estabelecidas",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? "",
    isFree: false,
  },
  {
    name: "Business",
    price: "R$ 149,99/mês",
    description: "Para redes de barbearias",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS ?? "",
    isFree: false,
  },
];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedPriceId, setSelectedPriceId] = useState<string>("");
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const planParam = searchParams.get("plan");
    const defaultPlan = PLANS[0].priceId;
    const matched = PLANS.find((p) => p.priceId === planParam);
    setSelectedPriceId(matched ? matched.priceId : defaultPlan);
  }, [searchParams]);

  const selectedPlan = PLANS.find((p) => p.priceId === selectedPriceId) ?? PLANS[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, priceId: selectedPriceId }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Erro ao criar conta. Tente novamente.");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(224,71%,18%)] to-[hsl(221,83%,35%)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Scissors className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">FlowBarberHub</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white p-8 shadow-2xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Criar sua conta</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Comece grátis. Sem cartão para o plano Starter.
            </p>
          </div>

          {/* Plan selector */}
          <div>
            <label className="text-sm font-medium block mb-1.5">Plano escolhido</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPlanPicker((v) => !v)}
                className="w-full flex items-center justify-between rounded-lg border border-input bg-muted/50 px-3 py-2.5 text-sm hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedPlan.name}</span>
                  <span className="text-muted-foreground">— {selectedPlan.price}</span>
                  {selectedPlan.isFree && (
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      15 dias grátis
                    </span>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showPlanPicker ? "rotate-180" : ""}`} />
              </button>

              {showPlanPicker && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg overflow-hidden">
                  {PLANS.map((plan) => (
                    <button
                      key={plan.priceId}
                      type="button"
                      onClick={() => {
                        setSelectedPriceId(plan.priceId);
                        setShowPlanPicker(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{plan.name}</span>
                        <span className="text-muted-foreground">— {plan.price}</span>
                        {plan.isFree && (
                          <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-0.5 rounded-full">
                            15 dias grátis
                          </span>
                        )}
                      </div>
                      {selectedPriceId === plan.priceId && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {selectedPlan.isFree
                ? "Você poderá acessar o sistema imediatamente após o cadastro."
                : "Você será redirecionado para o pagamento após fazer login."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome completo</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="João Silva"
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">E-mail</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joao@barbearia.com"
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Senha</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Confirmar senha</label>
              <input
                required
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Criar conta"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
