import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { PlanStatus, SubscriptionStatus } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Webhook signature invalid" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") break;

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0].price.id;
      const userId = session.metadata?.userId;

      // Cria Organization + Subscription para o novo assinante
      if (userId) {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 15);

        const org = await prisma.organization.create({
          data: {
            name: "Minha Barbearia",
            slug: `org-${userId.slice(0, 8)}`,
            trialEndsAt,
            planStatus: PlanStatus.ACTIVE,
            subscription: {
              create: {
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: subscription.id,
                stripePriceId: priceId,
                planName: getPlanName(priceId),
                status: SubscriptionStatus.ACTIVE,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              },
            },
          },
        });

        await prisma.user.update({
          where: { id: userId },
          data: { organizationId: org.id },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          status: mapSubStatus(sub.status),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          stripePriceId: sub.items.data[0].price.id,
          planName: getPlanName(sub.items.data[0].price.id),
        },
      });

      // Sincroniza planStatus da Organization
      const subscription = await prisma.subscription.findFirst({ where: { stripeSubscriptionId: sub.id } });
      if (subscription) {
        await prisma.organization.update({
          where: { id: subscription.organizationId },
          data: { planStatus: sub.status === "active" ? PlanStatus.ACTIVE : PlanStatus.BLOCKED },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { status: SubscriptionStatus.CANCELED },
      });
      const subscription = await prisma.subscription.findFirst({ where: { stripeSubscriptionId: sub.id } });
      if (subscription) {
        await prisma.organization.update({
          where: { id: subscription.organizationId },
          data: { planStatus: PlanStatus.BLOCKED },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

function getPlanName(priceId: string): string {
  const map: Record<string, string> = {
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER!]: "Starter",
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC!]: "Básico",
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!]: "Pro",
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS!]: "Business",
  };
  return map[priceId] ?? "Personalizado";
}

function mapSubStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const map: Record<string, SubscriptionStatus> = {
    trialing: SubscriptionStatus.TRIALING,
    active: SubscriptionStatus.ACTIVE,
    past_due: SubscriptionStatus.PAST_DUE,
    canceled: SubscriptionStatus.CANCELED,
    unpaid: SubscriptionStatus.UNPAID,
  };
  return map[status] ?? SubscriptionStatus.UNPAID;
}
