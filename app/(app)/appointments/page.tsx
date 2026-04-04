import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Calendar, Clock, User } from "lucide-react";
import { CompleteDialog } from "./complete-dialog";
import { CancelButton } from "./cancel-button";
import Link from "next/link";

type Status = "ALL" | "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

const STATUS_TABS: { label: string; value: Status }[] = [
  { label: "Todos", value: "ALL" },
  { label: "Agendados", value: "SCHEDULED" },
  { label: "Concluídos", value: "COMPLETED" },
  { label: "Cancelados", value: "CANCELLED" },
];

const STATUS_BADGE: Record<string, { label: string; classes: string }> = {
  SCHEDULED: { label: "Agendado",         classes: "bg-blue-50 text-blue-700" },
  COMPLETED: { label: "Concluído",         classes: "bg-emerald-50 text-emerald-700" },
  CANCELLED: { label: "Cancelado",         classes: "bg-red-50 text-red-700" },
  NO_SHOW:   { label: "Não compareceu",    classes: "bg-amber-50 text-amber-700" },
};

function fmtDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
function fmtTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date);
}
function fmt(val: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/onboarding");

  const { status } = await searchParams;
  const activeTab = (STATUS_TABS.find((t) => t.value === status?.toUpperCase())?.value ?? "ALL") as Status;
  const whereStatus = activeTab !== "ALL" ? { status: activeTab } : {};

  const [appointments, unitProducts] = await Promise.all([
    prisma.appointment.findMany({
      where: { unit: { organizationId: session.user.organizationId }, ...whereStatus },
      include: {
        service: { select: { name: true, price: true } },
        barber: { include: { user: { select: { name: true } } } },
        unit: { select: { name: true, id: true } },
      },
      orderBy: { startsAt: "desc" },
      take: 100,
    }),
    // Carregar produtos por unidade para o modal de conclusão
    prisma.unit.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        products: {
          where: { isActive: true, stock: { gt: 0 } },
          orderBy: { name: "asc" },
        },
      },
    }),
  ]);

  const productsByUnit = Object.fromEntries(
    unitProducts.map((u) => [
      u.id,
      u.products.map((p) => ({ id: p.id, name: p.name, price: Number(p.price), stock: p.stock })),
    ])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agendamentos</h1>
        <p className="text-sm text-muted-foreground">Gerencie todos os atendimentos</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "ALL" ? "/appointments" : `/appointments?status=${tab.value}`}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* List */}
      <div className="rounded-xl border bg-card">
        {appointments.length === 0 ? (
          <div className="py-16 text-center">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhum agendamento encontrado</p>
          </div>
        ) : (
          <div className="divide-y">
            {appointments.map((apt) => {
              const badge = STATUS_BADGE[apt.status];
              const unitProds = productsByUnit[apt.unit.id] ?? [];

              return (
                <div key={apt.id} className="flex items-center justify-between gap-4 px-4 py-4">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{apt.clientName ?? "Cliente"}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.classes}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{apt.service.name}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />{fmtDate(apt.startsAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />{fmtTime(apt.startsAt)} — {fmtTime(apt.endsAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />{apt.barber.user.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-sm font-semibold text-emerald-600">
                      {fmt(Number(apt.service.price))}
                    </span>
                    {apt.status === "SCHEDULED" && (
                      <div className="flex items-center gap-1.5">
                        <CompleteDialog
                          appointmentId={apt.id}
                          unitId={apt.unit.id}
                          products={unitProds}
                        />
                        <CancelButton appointmentId={apt.id} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
