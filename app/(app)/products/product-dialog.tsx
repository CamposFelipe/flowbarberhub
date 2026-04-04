"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";

type Unit = { id: string; name: string };

export function ProductDialog({ units }: { units: Unit[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    description: "",
    unitId: units[0]?.id ?? "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function reset() {
    setForm({ name: "", price: "", stock: "", description: "", unitId: units[0]?.id ?? "" });
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
        description: form.description || undefined,
        unitId: form.unitId,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao salvar produto.");
      return;
    }

    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" /> Novo produto
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-semibold">Novo produto</h2>
              <button onClick={() => { setOpen(false); reset(); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nome do produto</label>
                <input
                  required value={form.name} onChange={(e) => set("name", e.target.value)}
                  placeholder="Ex: Pomada Modeladora"
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
                  <label className="text-sm font-medium">Estoque inicial</label>
                  <input
                    type="number" min="0" required
                    value={form.stock} onChange={(e) => set("stock", e.target.value)}
                    placeholder="0"
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
                  placeholder="Descrição do produto..."
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
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
