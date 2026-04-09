"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function TrialButtonClient() {
  const { update } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleTrial() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payment/trial", { method: "POST" });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Erro ao ativar trial.");
        return;
      }

      // Refresh JWT so middleware sees the new organizationId and cleared pendingPriceId
      await update();
      window.location.href = "/onboarding";
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <button
        onClick={handleTrial}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-600 bg-white py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 transition-all"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Começar trial grátis (Starter — 15 dias)"
        )}
      </button>
    </div>
  );
}
