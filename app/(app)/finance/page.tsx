import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DollarSign, TrendingUp, ShoppingBag } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { FinanceFilters } from "./finance-filters";

function fmt(val: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; from?: string; to?: string; barberId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/onboarding");

  const { type, from, to, barberId } = await searchParams;

  const where: Prisma.TransactionWhereInput = {
    unit: { organizationId: session.user.organizationId },
  };
  if (type === "SERVICE" || type === "PRODUCT") where.type = type;
  if (barberId) where.barberId = barberId;
  if (from || to) {
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      dateFilter.lte = toDate;
    }
    where.createdAt = dateFilter;
  }

  const [transactions, barbers] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        barber: { include: { user: { select: { name: true } } } },
        appointment: { include: { service: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.barber.findMany({
      where: { organizationId: session.user.organizationId },
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);

  const totalServices = transactions.filter((t) => t.type === "SERVICE").reduce((s, t) => s + Number(t.amount), 0);
  const totalProducts = transactions.filter((t) => t.type === "PRODUCT").reduce((s, t) => s + Number(t.amount), 0);

  const stats = [
    { label: "Total serviços", value: fmt(totalServices), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total produtos",  value: fmt(totalProducts), icon: ShoppingBag, color: "text-blue-600",    bg: "bg-blue-50" },
    { label: "Receita total",   value: fmt(totalServices + totalProducts), icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50" },
  ];

  const barberOptions = barbers.map((b) => ({ id: b.id, name: b.user.name ?? "—" }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Histórico de todas as transações</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <div className={`rounded-lg p-2 ${s.bg}`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
            </div>
            <p className="mt-2 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-semibold">
            Transações
            {transactions.length > 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">({transactions.length})</span>
            )}
          </h2>
          <FinanceFilters barbers={barberOptions} />
        </div>

        <div className="divide-y">
          {transactions.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Nenhuma transação encontrada</p>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    tx.type === "SERVICE" ? "bg-emerald-50" : "bg-blue-50"
                  }`}>
                    {tx.type === "SERVICE"
                      ? <DollarSign className="h-4 w-4 text-emerald-600" />
                      : <ShoppingBag className="h-4 w-4 text-blue-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {tx.description ?? tx.appointment?.service?.name ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.barber.user.name} · {new Date(tx.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${tx.type === "SERVICE" ? "text-emerald-600" : "text-blue-600"}`}>
                  +{fmt(Number(tx.amount))}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
