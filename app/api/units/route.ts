import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Plan → max units allowed
const PLAN_UNIT_LIMITS: Record<string, number> = {
  Starter: 1,
  "Básico": 1,
  Pro: 1,
  Business: 3,
};

function getMaxUnits(planName: string | null | undefined): number {
  if (!planName) return 1;
  return PLAN_UNIT_LIMITS[planName] ?? 1;
}

const createSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens"),
  address: z.string().optional(),
  phone: z.string().optional(),
  openTime: z.string().default("09:00"),
  closeTime: z.string().default("18:00"),
  openDays: z.array(z.string()).default(["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"]),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get fresh organizationId from DB
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });
  if (!user?.organizationId) return NextResponse.json({ error: "Sem organização" }, { status: 403 });

  const units = await prisma.unit.findMany({
    where: { organizationId: user.organizationId },
    include: {
      schedules: { orderBy: { dayOfWeek: "asc" } },
      _count: { select: { barbers: true, services: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(units);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get fresh org + subscription from DB
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      organizationId: true,
      organization: {
        include: { subscription: { select: { planName: true } } },
      },
    },
  });

  if (!user?.organizationId || !user.organization) {
    return NextResponse.json({ error: "Sem organização" }, { status: 403 });
  }

  const org = user.organization;
  const planName = org.subscription?.planName ?? null;
  const maxUnits = getMaxUnits(planName);

  const currentCount = await prisma.unit.count({ where: { organizationId: user.organizationId } });
  if (currentCount >= maxUnits) {
    return NextResponse.json(
      { error: `Seu plano ${planName ?? "Starter"} permite no máximo ${maxUnits} unidade${maxUnits > 1 ? "s" : ""}. Faça upgrade para adicionar mais.` },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 422 });
  }

  const { name, slug, address, phone, openTime, closeTime, openDays } = parsed.data;

  const existing = await prisma.unit.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Este link já está em uso." }, { status: 409 });
  }

  const unit = await prisma.unit.create({
    data: {
      organizationId: user.organizationId,
      name,
      slug,
      address: address || null,
      phone: phone || null,
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
    include: { schedules: true },
  });

  return NextResponse.json(unit, { status: 201 });
}
