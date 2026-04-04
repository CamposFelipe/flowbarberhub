"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export function AppointmentActions({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"complete" | "cancel" | null>(null);
  const [confirm, setConfirm] = useState<"complete" | "cancel" | null>(null);

  async function handleComplete() {
    setLoading("complete");
    await fetch(`/api/appointments/${appointmentId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: [] }),
    });
    setLoading(null);
    setConfirm(null);
    router.refresh();
  }

  async function handleCancel() {
    setLoading("cancel");
    await fetch(`/api/appointments/${appointmentId}/cancel`, { method: "POST" });
    setLoading(null);
    setConfirm(null);
    router.refresh();
  }

  if (confirm === "complete") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Concluir atendimento?</span>
        <button
          onClick={handleComplete}
          disabled={!!loading}
          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading === "complete" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Sim"}
        </button>
        <button
          onClick={() => setConfirm(null)}
          className="rounded-lg border px-2.5 py-1 text-xs hover:bg-muted"
        >
          Não
        </button>
      </div>
    );
  }

  if (confirm === "cancel") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Cancelar agendamento?</span>
        <button
          onClick={handleCancel}
          disabled={!!loading}
          className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {loading === "cancel" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Sim"}
        </button>
        <button
          onClick={() => setConfirm(null)}
          className="rounded-lg border px-2.5 py-1 text-xs hover:bg-muted"
        >
          Não
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => setConfirm("complete")}
        className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
      >
        <CheckCircle className="h-3.5 w-3.5" /> Concluir
      </button>
      <button
        onClick={() => setConfirm("cancel")}
        className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
      >
        <XCircle className="h-3.5 w-3.5" /> Cancelar
      </button>
    </div>
  );
}
