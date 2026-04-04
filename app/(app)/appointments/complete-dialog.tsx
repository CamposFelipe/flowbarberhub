"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, X, Plus, Minus, Package } from "lucide-react";

type Product = { id: string; name: string; price: number; stock: number };

interface Props {
  appointmentId: string;
  unitId: string;
  products: Product[];
}

type SelectedProduct = { productId: string; quantity: number };

export function CompleteDialog({ appointmentId, products }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SelectedProduct[]>([]);

  function toggleProduct(productId: string) {
    setSelected((prev) =>
      prev.find((p) => p.productId === productId)
        ? prev.filter((p) => p.productId !== productId)
        : [...prev, { productId, quantity: 1 }]
    );
  }

  function changeQty(productId: string, delta: number) {
    setSelected((prev) =>
      prev.map((p) =>
        p.productId === productId
          ? { ...p, quantity: Math.max(1, p.quantity + delta) }
          : p
      )
    );
  }

  async function handleComplete() {
    setLoading(true);
    await fetch(`/api/appointments/${appointmentId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: selected }),
    });
    setLoading(false);
    setOpen(false);
    setSelected([]);
    router.refresh();
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
      >
        <CheckCircle className="h-3.5 w-3.5" /> Concluir
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-semibold">Concluir atendimento</h2>
                <p className="text-xs text-muted-foreground">Algum produto foi utilizado ou vendido?</p>
              </div>
              <button onClick={() => { setOpen(false); setSelected([]); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              {products.length === 0 ? (
                <div className="py-6 text-center">
                  <Package className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Nenhum produto disponível nesta unidade</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {products.map((p) => {
                    const sel = selected.find((s) => s.productId === p.id);
                    const isSelected = !!sel;

                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleProduct(p.id)}
                        className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        } ${p.stock === 0 ? "opacity-40 pointer-events-none" : "cursor-pointer"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isSelected ? "bg-primary/10" : "bg-muted"}`}>
                            <Package className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{fmt(p.price)} · {p.stock} em estoque</p>
                          </div>
                        </div>

                        {isSelected && (
                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => changeQty(p.id, -1)}
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-muted hover:bg-muted/80"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold">{sel.quantity}</span>
                            <button
                              onClick={() => changeQty(p.id, 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-muted hover:bg-muted/80"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {selected.length > 0 && (
                <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  {selected.length} produto{selected.length !== 1 ? "s" : ""} selecionado{selected.length !== 1 ? "s" : ""}
                  {" · "}Total:{" "}
                  {fmt(
                    selected.reduce((sum, s) => {
                      const p = products.find((p) => p.id === s.productId);
                      return sum + (p ? p.price * s.quantity : 0);
                    }, 0)
                  )}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => { setOpen(false); setSelected([]); }}
                  className="flex-1 rounded-xl border py-2.5 text-sm font-medium hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      {selected.length > 0 ? "Concluir com produtos" : "Concluir"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
