"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Filter, X } from "lucide-react";

type Barber = { id: string; name: string };

export function FinanceFilters({ barbers }: { barbers: Barber[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const [type, setType] = useState(searchParams.get("type") ?? "");
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");
  const [barberId, setBarberId] = useState(searchParams.get("barberId") ?? "");

  const hasFilters = !!(searchParams.get("type") || searchParams.get("from") || searchParams.get("to") || searchParams.get("barberId"));

  function applyFilters() {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (barberId) params.set("barberId", barberId);
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  function clearFilters() {
    setType(""); setFrom(""); setTo(""); setBarberId("");
    router.push(pathname);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-muted ${hasFilters ? "border-primary text-primary" : ""}`}
      >
        <Filter className="h-3.5 w-3.5" />
        Filtrar
        {hasFilters && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">!</span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 w-72 rounded-xl border bg-white p-4 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Filtros</p>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tipo</label>
              <select
                value={type} onChange={(e) => setType(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todos</option>
                <option value="SERVICE">Serviços</option>
                <option value="PRODUCT">Produtos</option>
              </select>
            </div>

            {barbers.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Barbeiro</label>
                <select
                  value={barberId} onChange={(e) => setBarberId(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Todos</option>
                  {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">De</label>
                <input
                  type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Até</label>
                <input
                  type="date" value={to} onChange={(e) => setTo(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              {hasFilters && (
                <button onClick={clearFilters} className="flex-1 rounded-lg border py-2 text-sm font-medium hover:bg-muted">
                  Limpar
                </button>
              )}
              <button
                onClick={applyFilters}
                className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-white hover:bg-primary/90"
              >
                Aplicar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
