import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DollarSign, Calendar, TrendingUp, Clock } from "lucide-react";

async function getDashboardData(organizationId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 7);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todayRevenue, weekRevenue, monthRevenue, upcomingAppointments, recentTransactions] =
    await Promise.all([
      prisma.transaction.aggregate({
        where: { unit: { organizationId }, createdAt: { gte: today } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { unit: { organizationId }, createdAt: { gte: weekStart } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { unit: { organizationId }, createdAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      prisma.appointment.findMany({
        where: {
          unit: { organizationId },
          startsAt: { gte: new Date() },
          status: "SCHEDULED",
        },
        include: {
          service: { select: { name: true } },
          barber: { include: { user: { select: { name: true } } } },
        },
        orderBy: { startsAt: "asc" },
        take: 5,
      }),
      prisma.transaction.findMany({
        where: { unit: { organizationId } },
        include: {
          barber: { include: { user: { select: { name: true } } } },
          appointment: { include: { service: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

  return { todayRevenue, weekRevenue, monthRevenue, upcomingAppointments, recentTransactions };
}

function fmt(val: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
}

function fmtTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date);
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/onboarding");

  const data = await getDashboardData(session.user.organizationId);

  const stats = [
    {
      label: "Receita hoje",
      value: fmt(Number(data.todayRevenue._sum.amount ?? 0)),
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Últimos 7 dias",
      value: fmt(Number(data.weekRevenue._sum.amount ?? 0)),
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Este mês",
      value: fmt(Number(data.monthRevenue._sum.amount ?? 0)),
      icon: Calendar,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Próximos agendamentos",
      value: String(data.upcomingAppointments.length),
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral da sua barbearia</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Próximos agendamentos */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-semibold">Próximos agendamentos</h2>
          {data.upcomingAppointments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum agendamento pendente</p>
          ) : (
            <div className="space-y-3">
              {data.upcomingAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{apt.clientName ?? "Cliente"}</p>
                    <p className="text-xs text-muted-foreground">{apt.service.name} · {apt.barber.user.name}</p>
                  </div>
                  <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    {fmtTime(apt.startsAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimas transações */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-semibold">Últimas transações</h2>
          {data.recentTransactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma transação ainda</p>
          ) : (
            <div className="space-y-3">
              {data.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{tx.appointment.service.name}</p>
                    <p className="text-xs text-muted-foreground">{tx.barber.user.name}</p>
                  </div>
                  <span className={`text-sm font-semibold ${tx.type === "SERVICE" ? "text-emerald-600" : "text-blue-600"}`}>
                    +{fmt(Number(tx.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
