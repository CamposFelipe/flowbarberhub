"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, Pencil } from "lucide-react";

type Unit = { id: string; name: string };
type Service = {
  id: string; name: string; price: number; durationMinutes: number;
  description: string | null; unitId: string;
};

interface Props {
  units: Unit[];
  service?: Service; // se passado, é edição
}

export function ServiceDialog({ units, service }: Props) {
  const router = useRouter();
  const isEdit = !!service;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: service?.name ?? "",
    price: service?.price?.toString() ?? "",
    durationMinutes: service?.durationMinutes?.toString() ?? "30",
    description: service?.description ?? "",
    unitId: service?.unitId ?? units[0]?.id ?? "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function reset() {
    if (!isEdit) {
      setForm({ name: "", price: "", durationMinutes: "30", description: "", unitId: units[0]?.id ?? "" });
    }
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body = {
      name: form.name,
      price: parseFloat(form.price),
      durationMinutes: parseInt(form.durationMinutes, 10),
      description: form.description || undefined,
      unitId: form.unitId,
    };

    const res = await fetch(
      isEdit ? `/api/services/${service!.id}` : "/api/services",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao salvar serviço.");
      return;
    }

    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <>
      {isEdit ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        >
          <Pencil className="h-3 w-3" /> Editar
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Novo serviço
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-semibold">{isEdit ? "Editar serviço" : "Novo serviço"}</h2>
              <button onClick={() => { setOpen(false); reset(); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nome do serviço</label>
                <input
                  required value={form.name} onChange={(e) => set("name", e.target.value)}
                  placeholder="Ex: Corte + Barba"
                  className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Preço (R$)</label>
                  <input
                    type="number" step="0.01" min="0" required
                    value={form.price} onChange={(e) => set("price", e.target.value)}
                    placeholder="0,00"
                    className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Duração (min)</label>
                  <input
                    type="number" min="5" step="5" required
                    value={form.durationMinutes} onChange={(e) => set("durationMinutes", e.target.value)}
                    placeholder="30"
                    className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {units.length > 1 && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Unidade</label>
                  <select
                    value={form.unitId} onChange={(e) => set("unitId", e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Descrição <span className="text-muted-foreground">(opcional)</span></label>
                <textarea
                  rows={2} value={form.description} onChange={(e) => set("description", e.target.value)}
                  placeholder="Descreva o serviço..."
                  className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setOpen(false); reset(); }}
                  className="flex-1 rounded-xl border py-2.5 text-sm font-medium hover:bg-muted">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEdit ? "Salvar" : "Criar serviço")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
