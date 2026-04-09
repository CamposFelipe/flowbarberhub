"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Loader2, X } from "lucide-react";

const DAYS = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];
const DAY_VALUES = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];

type Schedule = { dayOfWeek: string; isOpen: boolean; openTime: string; closeTime: string };
type Unit = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  schedules: Schedule[];
};

interface Props {
  units: Unit[];
  canCreate: boolean;
  maxUnits: number;
  planName: string | null;
  editUnit?: Unit;
}

function slugify(v: string) {
  return v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function UnitsClient({ canCreate, maxUnits, planName, editUnit }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState(editUnit?.name ?? "");
  const [slug, setSlug] = useState(editUnit?.slug ?? "");
  const [address, setAddress] = useState(editUnit?.address ?? "");
  const [phone, setPhone] = useState(editUnit?.phone ?? "");
  const [openTime, setOpenTime] = useState(editUnit?.schedules.find(s => s.isOpen)?.openTime ?? "09:00");
  const [closeTime, setCloseTime] = useState(editUnit?.schedules.find(s => s.isOpen)?.closeTime ?? "18:00");
  const [openDays, setOpenDays] = useState<string[]>(
    editUnit
      ? editUnit.schedules.filter(s => s.isOpen).map(s => s.dayOfWeek)
      : ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"]
  );

  function openDialog() {
    if (editUnit) {
      setName(editUnit.name);
      setSlug(editUnit.slug);
      setAddress(editUnit.address ?? "");
      setPhone(editUnit.phone ?? "");
      const openSched = editUnit.schedules.find(s => s.isOpen);
      setOpenTime(openSched?.openTime ?? "09:00");
      setCloseTime(openSched?.closeTime ?? "18:00");
      setOpenDays(editUnit.schedules.filter(s => s.isOpen).map(s => s.dayOfWeek));
    } else {
      setName(""); setSlug(""); setAddress(""); setPhone("");
      setOpenTime("09:00"); setCloseTime("18:00");
      setOpenDays(["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"]);
    }
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = { name, slug, address: address || null, phone: phone || null, openTime, closeTime, openDays };

    try {
      const res = await fetch(
        editUnit ? `/api/units/${editUnit.id}` : "/api/units",
        {
          method: editUnit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao salvar.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {editUnit ? (
        <button
          onClick={openDialog}
          className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
        >
          <Pencil className="h-3 w-3" />
          Editar
        </button>
      ) : (
        <button
          onClick={canCreate ? openDialog : undefined}
          disabled={!canCreate}
          title={!canCreate ? `Limite de ${maxUnits} unidade${maxUnits !== 1 ? "s" : ""} do plano ${planName ?? "atual"}` : undefined}
          className="flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova unidade
        </button>
      )}

      {/* Dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="font-semibold">{editUnit ? "Editar unidade" : "Nova unidade"}</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Nome da unidade</label>
                  <input
                    required value={name}
                    onChange={(e) => { setName(e.target.value); if (!editUnit) setSlug(slugify(e.target.value)); }}
                    placeholder="Ex: Unidade Centro"
                    className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Link de agendamento</label>
                  <div className="flex items-center rounded-lg border border-input overflow-hidden">
                    <span className="bg-muted px-2 py-2 text-xs text-muted-foreground border-r">/</span>
                    <input
                      required value={slug}
                      onChange={(e) => setSlug(slugify(e.target.value))}
                      placeholder="unidade-centro"
                      className="flex-1 bg-transparent px-2 text-sm focus:outline-none h-9"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Endereço</label>
                  <input
                    value={address} onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, número..."
                    className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Telefone</label>
                  <input
                    value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Abertura</label>
                  <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Fechamento</label>
                  <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Dias de funcionamento</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day, i) => (
                    <button
                      key={day} type="button"
                      onClick={() => setOpenDays(prev =>
                        prev.includes(DAY_VALUES[i])
                          ? prev.filter(d => d !== DAY_VALUES[i])
                          : [...prev, DAY_VALUES[i]]
                      )}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        openDays.includes(DAY_VALUES[i])
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border py-2.5 text-sm font-medium hover:bg-muted">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editUnit ? "Salvar alterações" : "Criar unidade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
