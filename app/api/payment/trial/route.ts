import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlanStatus } from "@prisma/client";

const STARTER_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ?? "__starter__";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Read fresh state — never trust JWT
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, pendingPriceId: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  // Guard: user must have a paid pendingPriceId and no org yet
  if (user.organizationId) {
    return NextResponse.json({ error: "Você já possui uma organização ativa." }, { status: 409 });
  }

  if (!user.pendingPriceId || user.pendingPriceId === STARTER_PRICE_ID) {
    return NextResponse.json({ error: "Nenhum plano pago pendente encontrado." }, { status: 400 });
  }

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 15);

  // Create org with TRIAL status and link user — all in one transaction
  await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: "Minha Barbearia",
        slug: `org-${userId.slice(0, 8)}-${Date.now()}`,
        trialEndsAt,
        planStatus: PlanStatus.TRIAL,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        organizationId: org.id,
        pendingPriceId: null,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
