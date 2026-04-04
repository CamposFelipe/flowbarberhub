"use client";
import { useState } from "react";
import { ChevronRight, ChevronLeft, Check, Loader2, Clock, DollarSign } from "lucide-react";

type Service = { id: string; name: string; price: number; durationMinutes: number };
type Barber = { id: string; name: string; image: string | null };
type Schedule = { dayOfWeek: string; isOpen: boolean; openTime: string; closeTime: string };

const DAY_MAP: Record<string, number> = {
  SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
};

function generateSlots(openTime: string, closeTime: string, durationMins: number): string[] {
  const slots: string[] = [];
  const [oh, om] = openTime.split(":").map(Number);
  const [ch, cm] = closeTime.split(":").map(Number);
  let current = oh * 60 + om;
  const end = ch * 60 + cm;
  while (current + durationMins <= end) {
    const h = Math.floor(current / 60).toString().padStart(2, "0");
    const m = (current % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    current += durationMins;
  }
  return slots;
}

function fmt(val: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
}

export default function BookingForm({
  unit, services, barbers, schedules,
}: {
  unit: { id: string; name: string; slug: string };
  services: Service[];
  barbers: Barber[];
  schedules: Schedule[];
}) {
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState("");
  const [barberId, setBarberId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const service = services.find((s) => s.id === serviceId);

  const availableSlots = (() => {
    if (!date || !service) return [];
    const d = new Date(date + "T00:00:00");
    const dayOfWeek = Object.entries(DAY_MAP).find(([, v]) => v === d.getDay())?.[0];
    const sched = schedules.find((s) => s.dayOfWeek === dayOfWeek);
    if (!sched?.isOpen) return [];
    return generateSlots(sched.openTime, sched.closeTime, service.durationMinutes);
  })();

  async function handleConfirm() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId: unit.id, serviceId, barberId, date, time, name, phone, email }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erro ao agendar");
      }
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold">Agendamento confirmado!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Você receberá uma confirmação em <strong>{email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white shadow-2xl">
      {/* Progress */}
      <div className="flex border-b">
        {["Serviço", "Barbeiro", "Horário", "Confirmação"].map((label, i) => (
          <div key={label} className={`flex-1 py-3 text-center text-xs font-medium transition-colors ${
            step === i + 1 ? "border-b-2 border-primary text-primary" :
            step > i + 1 ? "text-emerald-600" : "text-muted-foreground"
          }`}>
            {step > i + 1 ? <Check className="mx-auto h-3.5 w-3.5" /> : label}
          </div>
        ))}
      </div>

      <div className="p-6">
        {/* Step 1: Serviço */}
        {step === 1 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Escolha o serviço</h3>
            {services.map((s) => (
              <button key={s.id} onClick={() => setServiceId(s.id)}
                className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${
                  serviceId === s.id ? "border-primary bg-primary/5" : "hover:border-primary/40 hover:bg-muted/50"
                }`}>
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {s.durationMinutes} min
                  </p>
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold text-primary">
                  <DollarSign className="h-3.5 w-3.5" />{fmt(s.price).replace("R$\u00a0", "")}
                </span>
              </button>
            ))}
            <button onClick={() => setStep(2)} disabled={!serviceId}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-40">
              Continuar <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step 2: Barbeiro */}
        {step === 2 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Escolha o barbeiro</h3>
            {barbers.map((b) => (
              <button key={b.id} onClick={() => setBarberId(b.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                  barberId === b.id ? "border-primary bg-primary/5" : "hover:border-primary/40 hover:bg-muted/50"
                }`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {b.name.charAt(0)}
                </div>
                <span className="font-medium">{b.name}</span>
                {barberId === b.id && <Check className="ml-auto h-4 w-4 text-primary" />}
              </button>
            ))}
            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 flex items-center justify-center gap-1 rounded-xl border py-2.5 text-sm font-medium hover:bg-muted">
                <ChevronLeft className="h-4 w-4" /> Voltar
              </button>
              <button onClick={() => setStep(3)} disabled={!barberId}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-40">
                Continuar <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Data e horário */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Escolha data e horário</h3>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Data</label>
              <input type="date" value={date} min={new Date().toISOString().split("T")[0]}
                onChange={(e) => { setDate(e.target.value); setTime(""); }}
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            {date && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Horário disponível</label>
                {availableSlots.length === 0 ? (
                  <p className="rounded-lg bg-muted py-3 text-center text-sm text-muted-foreground">Sem horários disponíveis nesse dia</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <button key={slot} onClick={() => setTime(slot)}
                        className={`rounded-lg py-2 text-sm font-medium transition-all ${
                          time === slot ? "bg-primary text-white" : "bg-muted hover:bg-primary/10 hover:text-primary"
                        }`}>
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(2)}
                className="flex-1 flex items-center justify-center gap-1 rounded-xl border py-2.5 text-sm font-medium hover:bg-muted">
                <ChevronLeft className="h-4 w-4" /> Voltar
              </button>
              <button onClick={() => setStep(4)} disabled={!date || !time}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-40">
                Continuar <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Dados + Confirmar */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Seus dados</h3>
            <div className="rounded-xl bg-muted/50 p-4 text-sm space-y-1">
              <p><span className="text-muted-foreground">Serviço:</span> {service?.name}</p>
              <p><span className="text-muted-foreground">Data:</span> {new Date(date + "T00:00:00").toLocaleDateString("pt-BR")} às {time}</p>
            </div>
            {[
              { label: "Nome completo", val: name, set: setName, type: "text", placeholder: "João Silva" },
              { label: "Telefone (WhatsApp)", val: phone, set: setPhone, type: "tel", placeholder: "(51) 99999-9999" },
              { label: "E-mail", val: email, set: setEmail, type: "email", placeholder: "joao@email.com" },
            ].map((f) => (
              <div key={f.label} className="space-y-1.5">
                <label className="text-sm font-medium">{f.label}</label>
                <input type={f.type} value={f.val} onChange={(e) => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            ))}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setStep(3)}
                className="flex-1 flex items-center justify-center gap-1 rounded-xl border py-2.5 text-sm font-medium hover:bg-muted">
                <ChevronLeft className="h-4 w-4" /> Voltar
              </button>
              <button onClick={handleConfirm} disabled={loading || !name || !phone || !email}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-40">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Confirmar</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
