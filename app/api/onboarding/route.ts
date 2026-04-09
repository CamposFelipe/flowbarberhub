import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { PlanStatus } from "@prisma/client";

const schema = z.object({
  orgName: z.string().min(2),
  unitName: z.string().min(2),
  unitSlug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  openTime: z.string(),
  closeTime: z.string(),
  openDays: z.array(z.string()),
  barberName: z.string().optional(),
  barberEmail: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = schema.safeParse(body);
  if (!data.success) return NextResponse.json({ error: data.error.flatten() }, { status: 422 });

  const { orgName, unitName, unitSlug, openTime, closeTime, openDays, barberName, barberEmail } = data.data;

  // Check slug availability
  const existing = await prisma.unit.findUnique({ where: { slug: unitSlug } });
  if (existing) return NextResponse.json({ error: "Esse link já está em uso. Escolha outro." }, { status: 409 });

  // Read fresh state from DB — JWT can be stale after webhook creates org
  const freshUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true, pendingPriceId: true },
  });

  const STARTER_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ?? "";

  try {
  await prisma.$transaction(async (tx) => {
    // Find or create Organization
    let org = freshUser?.organizationId
      ? await tx.organization.findUnique({ where: { id: freshUser.organizationId } })
      : null;

    if (!org) {
      // Determine if this is a paid plan user (webhook may not have fired yet)
      const isPaidPlan =
        !!freshUser?.pendingPriceId &&
        freshUser.pendingPriceId !== STARTER_PRICE_ID;

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 15);

      org = await tx.organization.create({
        data: {
          name: orgName,
          slug: `org-${session.user.id.slice(0, 8)}-${Date.now()}`,
          // Paid plan users get ACTIVE status (webhook will upsert subscription later).
          // Starter users get TRIAL with 15-day window.
          trialEndsAt: isPaidPlan
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            : trialEndsAt,
          planStatus: isPaidPlan ? PlanStatus.ACTIVE : PlanStatus.TRIAL,
        },
      });
      await tx.user.update({
        where: { id: session.user.id },
        data: { organizationId: org.id },
      });
    } else {
      // Org already exists (created by webhook or trial API) — just update the name
      await tx.organization.update({ where: { id: org.id }, data: { name: orgName } });
    }

    // Guard: onboarding should only create the first unit.
    // Prevents unlimited unit creation via repeated onboarding submissions.
    const existingUnitCount = await tx.unit.count({ where: { organizationId: org.id } });
    if (existingUnitCount > 0) {
      throw Object.assign(new Error("Sua primeira unidade já foi cadastrada."), { status: 409 });
    }

    // Create Unit with schedules
    const unit = await tx.unit.create({
      data: {
        organizationId: org.id,
        name: unitName,
        slug: unitSlug,
        schedules: {
          createMany: {
            data: ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"].map((day) => ({
              dayOfWeek: day as any,
              isOpen: openDays.includes(day),
              openTime,
              closeTime,
            })),
          },
        },
      },
    });

    // Optionally create first barber
    if (barberEmail) {
      const barberUser = await tx.user.upsert({
        where: { email: barberEmail },
        update: {},
        create: {
          name: barberName ?? barberEmail.split("@")[0],
          email: barberEmail,
          role: "BARBER",
          organizationId: org.id,
        },
      });

      const barber = await tx.barber.upsert({
        where: { userId: barberUser.id },
        update: {},
        create: { userId: barberUser.id, organizationId: org.id },
      });

      await tx.barberUnit.create({ data: { barberId: barber.id, unitId: unit.id } });
    }
  });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    if (e?.status === 409) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}
