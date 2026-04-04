import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });

export async function POST(req: NextRequest) {
  const session = await auth();
  const formData = await req.formData();
  const priceId = formData.get("priceId") as string;

  if (!priceId) return NextResponse.json({ error: "Price ID required" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/#planos`,
    customer_email: session?.user?.email ?? undefined,
    metadata: {
      userId: session?.user?.id ?? "",
    },
    subscription_data: {
      trial_period_days: 15,
    },
    locale: "pt-BR",
  });

  return NextResponse.redirect(checkoutSession.url!, 303);
}
