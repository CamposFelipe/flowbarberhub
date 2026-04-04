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

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 15);

  const slug = `org-${session.user.id.slice(0, 8)}-${Date.now()}`;

  await prisma.$transaction(async (tx) => {
    // Create or update Organization
    let org = await tx.organization.findFirst({ where: { id: session.user.organizationId ?? "" } });

    if (!org) {
      org = await tx.organization.create({
        data: {
          name: orgName,
          slug,
          trialEndsAt,
          planStatus: PlanStatus.TRIAL,
        },
      });
      await tx.user.update({
        where: { id: session.user.id },
        data: { organizationId: org.id },
      });
    } else {
      await tx.organization.update({ where: { id: org.id }, data: { name: orgName } });
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

    // Optionally create first barber invite (placeholder user)
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

  return NextResponse.json({ ok: true });
}
