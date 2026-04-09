import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  openDays: z.array(z.string()).optional(),
});

async function getOrgId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });
  return user?.organizationId ?? null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const orgId = await getOrgId(session.user.id);
  if (!orgId) return NextResponse.json({ error: "Sem organização" }, { status: 403 });

  const unit = await prisma.unit.findFirst({
    where: { id, organizationId: orgId },
    include: { schedules: { orderBy: { dayOfWeek: "asc" } } },
  });

  if (!unit) return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 });
  return NextResponse.json(unit);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const orgId = await getOrgId(session.user.id);
  if (!orgId) return NextResponse.json({ error: "Sem organização" }, { status: 403 });

  // Verify unit belongs to org
  const existing = await prisma.unit.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 422 });
  }

  const { name, slug, address, phone, openTime, closeTime, openDays } = parsed.data;

  // Check slug uniqueness if changing
  if (slug && slug !== existing.slug) {
    const taken = await prisma.unit.findUnique({ where: { slug } });
    if (taken) return NextResponse.json({ error: "Este link já está em uso." }, { status: 409 });
  }

  // Build update data
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (slug !== undefined) updateData.slug = slug;
  if (address !== undefined) updateData.address = address;
  if (phone !== undefined) updateData.phone = phone;

  const unit = await prisma.$transaction(async (tx) => {
    const updated = await tx.unit.update({ where: { id }, data: updateData });

    // Update schedules if provided
    if (openTime !== undefined || closeTime !== undefined || openDays !== undefined) {
      const schedules = await tx.unitSchedule.findMany({ where: { unitId: id } });
      for (const schedule of schedules) {
        await tx.unitSchedule.update({
          where: { id: schedule.id },
          data: {
            isOpen: openDays ? openDays.includes(schedule.dayOfWeek) : schedule.isOpen,
            openTime: openTime ?? schedule.openTime,
            closeTime: closeTime ?? schedule.closeTime,
          },
        });
      }
    }

    return updated;
  });

  const full = await prisma.unit.findUnique({
    where: { id: unit.id },
    include: { schedules: { orderBy: { dayOfWeek: "asc" } } },
  });

  return NextResponse.json(full);
}
