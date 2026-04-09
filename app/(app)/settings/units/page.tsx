import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MapPin, Clock, Plus, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import UnitsClient from "./units-client";

const DAY_NAMES: Record<string, string> = {
  MONDAY: "Seg", TUESDAY: "Ter", WEDNESDAY: "Qua",
  THURSDAY: "Qui", FRIDAY: "Sex", SATURDAY: "Sáb", SUNDAY: "Dom",
};
const DAY_ORDER = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];

const PLAN_UNIT_LIMITS: Record<string, number> = {
  Starter: 1,
  "Básico": 1,
  Pro: 1,
  Business: 3,
};

export default async function UnitsPage() {
  const session = await auth();

  // Get fresh org from DB
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          organizationId: true,
          organization: { include: { subscription: { select: { planName: true } } } },
        },
      })
    : null;

  if (!user?.organizationId || !user.organization) redirect("/onboarding");

  const org = user.organization;
  const planName = org.subscription?.planName ?? null;
  const maxUnits = planName ? (PLAN_UNIT_LIMITS[planName] ?? 1) : 1;

  const units = await prisma.unit.findMany({
    where: { organizationId: user.organizationId },
    include: {
      schedules: { orderBy: { dayOfWeek: "asc" } },
      _count: { select: { barbers: true, services: true, appointments: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Unidades</h1>
          <p className="text-sm text-muted-foreground">
            {units.length} de {maxUnits} unidade{maxUnits !== 1 ? "s" : ""} · plano {planName ?? "Trial"}
          </p>
        </div>
        <UnitsClient
          units={units as any}
          canCreate={units.length < maxUnits}
          maxUnits={maxUnits}
          planName={planName}
        />
      </div>

      {units.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <MapPin className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">Nenhuma unidade cadastrada</p>
          <p className="mt-1 text-xs text-muted-foreground">Adicione sua primeira unidade para começar.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {units.map((unit) => {
            const sortedSchedules = [...unit.schedules].sort(
              (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek)
            );
            const openDays = sortedSchedules.filter((s) => s.isOpen);

            return (
              <div key={unit.id} className="rounded-xl border bg-card p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{unit.name}</p>
                      <a
                        href={`/${unit.slug}`}
                        target="_blank"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        /{unit.slug}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                  <UnitsClient
                    units={units as any}
                    canCreate={units.length < maxUnits}
                    maxUnits={maxUnits}
                    planName={planName}
                    editUnit={unit as any}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-2.5 text-center text-xs">
                  <div>
                    <p className="font-semibold">{unit._count.barbers}</p>
                    <p className="text-muted-foreground">barbeiros</p>
                  </div>
                  <div>
                    <p className="font-semibold">{unit._count.services}</p>
                    <p className="text-muted-foreground">serviços</p>
                  </div>
                  <div>
                    <p className="font-semibold">{unit._count.appointments}</p>
                    <p className="text-muted-foreground">agendamentos</p>
                  </div>
                </div>

                {unit.address && (
                  <p className="text-xs text-muted-foreground">{unit.address}</p>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Horários</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {sortedSchedules.map((s) => (
                      <span
                        key={s.dayOfWeek}
                        className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                          s.isOpen
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-muted text-muted-foreground/50"
                        }`}
                      >
                        {DAY_NAMES[s.dayOfWeek]}
                      </span>
                    ))}
                  </div>
                  {openDays.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {openDays[0].openTime} — {openDays[0].closeTime}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {units.length >= maxUnits && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Você atingiu o limite de {maxUnits} unidade{maxUnits !== 1 ? "s" : ""} do plano{" "}
          <strong>{planName ?? "Starter"}</strong>.{" "}
          {maxUnits < 3 && "Faça upgrade para o plano Business para adicionar até 3 unidades."}
        </div>
      )}
    </div>
  );
}
