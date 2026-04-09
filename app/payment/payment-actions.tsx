"use client";

import { CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";

interface PaymentActionsProps {
  priceId: string;
  planName: string;
}

export default function PaymentActions({ priceId, planName }: PaymentActionsProps) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    // Submit form-style POST to checkout API
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/checkout";
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "priceId";
    input.value = priceId;
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-all"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <CreditCard className="h-4 w-4" />
          Pagar e ativar plano {planName}
        </>
      )}
    </button>
  );
}
