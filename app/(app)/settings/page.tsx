import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Building2, MapPin, Clock, CreditCard, CheckCircle, AlertCircle } from "lucide-react";

const DAY_NAMES: Record<string, string> = {
  MONDAY: "Segunda", TUESDAY: "Terça", WEDNESDAY: "Quarta",
  THURSDAY: "Quinta", FRIDAY: "Sexta", SATURDAY: "Sábado", SUNDAY: "Domingo",
};

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/onboarding");

  const [org, unit] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      include: { subscription: true },
    }),
    prisma.unit.findFirst({
      where: { organizationId: session.user.organizationId },
      include: { schedules: { orderBy: { dayOfWeek: "asc" } } },
    }),
  ]);

  if (!org) redirect("/onboarding");

  const trialDaysLeft = org.planStatus === "TRIAL"
    ? Math.max(0, Math.ceil((org.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const sortedSchedules = unit?.schedules.sort(
    (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek)
  ) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie as informações da sua barbearia</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Organização */}
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Organização</h2>
          </div>
          <dl className="space-y-3">
            <Row label="Nome" value={org.name} />
            <Row label="Identificador (slug)" value={org.slug} mono />
            <Row label="Tipo" value="Barbearia" />
          </dl>
        </div>

        {/* Plano */}
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Plano e assinatura</h2>
          </div>
          <dl className="space-y-3">
            <Row label="Status">
              <PlanBadge status={org.planStatus} />
            </Row>
            {trialDaysLeft !== null && (
              <Row label="Trial expira em">
                <span className={`text-sm font-medium ${trialDaysLeft <= 3 ? "text-red-600" : "text-amber-600"}`}>
                  {trialDaysLeft} dia{trialDaysLeft !== 1 ? "s" : ""}
                </span>
              </Row>
            )}
            {org.subscription && (
              <>
                <Row label="Plano" value={org.subscription.planName ?? "—"} />
                {org.subscription.currentPeriodEnd && (
                  <Row
                    label="Próxima cobrança"
                    value={new Date(org.subscription.currentPeriodEnd).toLocaleDateString("pt-BR")}
                  />
                )}
              </>
            )}
          </dl>
        </div>

        {/* Unidade */}
        {unit && (
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Unidade — {unit.name}</h2>
            </div>
            <dl className="space-y-3">
              <Row label="Link de agendamento" mono>
                <a
                  href={`/${unit.slug}`}
                  target="_blank"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  /{unit.slug}
                </a>
              </Row>
              {unit.address && <Row label="Endereço" value={unit.address} />}
              {unit.phone && <Row label="Telefone" value={unit.phone} />}
            </dl>
          </div>
        )}

        {/* Horários */}
        {sortedSchedules.length > 0 && (
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Horários de funcionamento</h2>
            </div>
            <div className="space-y-2">
              {sortedSchedules.map((s) => (
                <div key={s.id} className="flex items-center justify-between">
                  <span className="text-sm">{DAY_NAMES[s.dayOfWeek]}</span>
                  {s.isOpen ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-sm text-muted-foreground">
                        {s.openTime} — {s.closeTime}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
                      <span className="text-sm text-muted-foreground/50">Fechado</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  children,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={`text-right text-sm font-medium ${mono ? "font-mono text-xs" : ""}`}>
        {children ?? value ?? "—"}
      </dd>
    </div>
  );
}

function PlanBadge({ status }: { status: string }) {
  const config = {
    TRIAL:   { label: "Trial",   classes: "bg-amber-50 text-amber-700" },
    ACTIVE:  { label: "Ativo",   classes: "bg-emerald-50 text-emerald-700" },
    BLOCKED: { label: "Bloqueado", classes: "bg-red-50 text-red-700" },
  }[status] ?? { label: status, classes: "bg-slate-100 text-slate-600" };

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.classes}`}>
      {config.label}
    </span>
  );
}
