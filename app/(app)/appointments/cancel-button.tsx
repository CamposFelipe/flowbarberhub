"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle, Loader2 } from "lucide-react";

export function CancelButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    setLoading(true);
    await fetch(`/api/appointments/${appointmentId}/cancel`, { method: "POST" });
    setLoading(false);
    setConfirm(false);
    router.refresh();
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Sim"}
        </button>
        <button onClick={() => setConfirm(false)} className="rounded-lg border px-2.5 py-1 text-xs hover:bg-muted">
          Não
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
    >
      <XCircle className="h-3.5 w-3.5" /> Cancelar
    </button>
  );
}
