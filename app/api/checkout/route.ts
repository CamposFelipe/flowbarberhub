import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url), 303);
  }

  const formData = await req.formData();
  const priceId = formData.get("priceId") as string;

  if (!priceId) return NextResponse.json({ error: "Price ID required" }, { status: 400 });

  // Read fresh org state — determines success redirect
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // If user already has an org (subscribe/renewal flow) → go to dashboard after payment
  // If new user (no org yet) → go to onboarding to set up their barbershop
  const successUrl = user?.organizationId
    ? `${appUrl}/dashboard?subscribed=true`
    : `${appUrl}/onboarding?session_id={CHECKOUT_SESSION_ID}`;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: user?.organizationId ? `${appUrl}/subscribe` : `${appUrl}/payment`,
    customer_email: session.user.email ?? undefined,
    metadata: {
      userId: session.user.id,
    },
    locale: "pt-BR",
  });

  return NextResponse.redirect(checkoutSession.url!, 303);
}
