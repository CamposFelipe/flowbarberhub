"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Scissors, Building2, MapPin, User, Check, ChevronRight, Loader2 } from "lucide-react";

const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const DAY_VALUES = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

type Step = 1 | 2 | 3;

function OnboardingForm() {
  const searchParams = useSearchParams();
  const { update } = useSession();

  // When arriving from a Stripe payment success URL (?session_id=...) the JWT
  // still holds the old pendingPriceId. Refresh it so middleware passes correctly.
  useEffect(() => {
    if (searchParams.get("session_id")) {
      update();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [orgName, setOrgName] = useState("");
  const [unitName, setUnitName] = useState("");
  const [unitSlug, setUnitSlug] = useState("");
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("18:00");
  const [openDays, setOpenDays] = useState([0, 1, 2, 3, 4, 5]);
  const [barberName, setBarberName] = useState("");
  const [barberEmail, setBarberEmail] = useState("");

  function slugify(val: string) {
    return val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  function toggleDay(idx: number) {
    setOpenDays((prev) => prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx]);
  }

  async function handleFinish() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName,
          unitName,
          unitSlug,
          openTime,
          closeTime,
          openDays: openDays.map((i) => DAY_VALUES[i]),
          barberName: barberName || undefined,
          barberEmail: barberEmail || undefined,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Erro ao salvar. Tente novamente.");
      }
      // Refresh JWT so middleware sees the new organizationId, planStatus and hasUnit.
      // Use hard navigation (not router.push) so the browser sends the updated
      // cookie on the next request — same pattern used by the login page.
      await update();
      window.location.href = "/dashboard";
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
      setLoading(false);
    }
  }

  const steps = [
    { num: 1, label: "Empresa", icon: Building2 },
    { num: 2, label: "Unidade", icon: MapPin },
    { num: 3, label: "Equipe", icon: User },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[hsl(224,71%,18%)] to-[hsl(221,83%,35%)] p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Scissors className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">FlowBarberHub</span>
        </div>

        {/* Stepper */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                step > s.num ? "bg-emerald-400 text-white" : step === s.num ? "bg-white text-primary" : "bg-white/20 text-white/60"
              }`}>
                {step > s.num ? <Check className="h-4 w-4" /> : s.num}
              </div>
              <span className={`text-sm ${step === s.num ? "font-medium text-white" : "text-white/50"}`}>{s.label}</span>
              {i < steps.length - 1 && <div className="mx-2 h-px w-8 bg-white/20" />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white p-8 shadow-2xl">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">Conte sobre sua empresa</h2>
                <p className="text-sm text-muted-foreground">Como se chama sua barbearia?</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nome da barbearia</label>
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Ex: Barbearia do João"
                  className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!orgName.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
              >
                Continuar <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">Configure sua unidade</h2>
                <p className="text-sm text-muted-foreground">Dados da sua primeira loja</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nome da unidade</label>
                <input
                  value={unitName}
                  onChange={(e) => { setUnitName(e.target.value); setUnitSlug(slugify(e.target.value)); }}
                  placeholder="Ex: Unidade Centro"
                  className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Link de agendamento</label>
                <div className="flex items-center rounded-lg border border-input overflow-hidden">
                  <span className="bg-muted px-3 py-2 text-xs text-muted-foreground border-r">flowbarberhub.com.br/</span>
                  <input
                    value={unitSlug}
                    onChange={(e) => setUnitSlug(slugify(e.target.value))}
                    placeholder="minha-unidade"
                    className="flex-1 bg-transparent px-3 text-sm focus:outline-none h-10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Abertura</label>
                  <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Fechamento</label>
                  <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Dias de funcionamento</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day, i) => (
                    <button key={day} onClick={() => toggleDay(i)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        openDays.includes(i) ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border py-2.5 text-sm font-medium hover:bg-muted">
                  Voltar
                </button>
                <button onClick={() => setStep(3)} disabled={!unitName.trim() || !unitSlug.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
                  Continuar <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">Adicione um barbeiro</h2>
                <p className="text-sm text-muted-foreground">Opcional — você pode adicionar depois</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nome</label>
                <input value={barberName} onChange={(e) => setBarberName(e.target.value)}
                  placeholder="Ex: Carlos Silva"
                  className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">E-mail</label>
                <input type="email" value={barberEmail} onChange={(e) => setBarberEmail(e.target.value)}
                  placeholder="carlos@email.com"
                  className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep(2)}
                  className="flex-1 rounded-xl border py-2.5 text-sm font-medium hover:bg-muted">
                  Voltar
                </button>
                <button onClick={handleFinish} disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Finalizar</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingForm />
    </Suspense>
  );
}
