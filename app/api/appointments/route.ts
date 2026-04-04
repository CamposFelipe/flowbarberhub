import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  unitId: z.string(),
  serviceId: z.string(),
  barberId: z.string(),
  date: z.string(),
  time: z.string(),
  name: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 422 });

  const { unitId, serviceId, barberId, date, time, name, phone, email } = parsed.data;

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });

  const [h, m] = time.split(":").map(Number);
  const startsAt = new Date(`${date}T${time}:00`);
  const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60 * 1000);

  // Check for conflicts
  const conflict = await prisma.appointment.findFirst({
    where: {
      barberId,
      status: "SCHEDULED",
      OR: [
        { startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
      ],
    },
  });
  if (conflict) return NextResponse.json({ error: "Horário já ocupado. Escolha outro." }, { status: 409 });

  // Upsert client
  const client = await prisma.client.upsert({
    where: { id: (await prisma.client.findFirst({ where: { phone } }))?.id ?? "none" },
    update: { name, email },
    create: {
      name, phone, email,
      organization: { connect: { id: (await prisma.unit.findUnique({ where: { id: unitId }, select: { organizationId: true } }))!.organizationId } },
    },
  });

  await prisma.appointment.create({
    data: {
      unitId, serviceId, barberId,
      clientId: client.id,
      clientName: name, clientPhone: phone, clientEmail: email,
      startsAt, endsAt,
      status: "SCHEDULED",
    },
  });

  return NextResponse.json({ ok: true });
}
