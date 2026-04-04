import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { unit: { select: { organizationId: true } } },
  });

  if (!appointment) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (appointment.unit.organizationId !== session.user.organizationId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (appointment.status !== "SCHEDULED")
    return NextResponse.json({ error: "Só é possível cancelar agendamentos pendentes" }, { status: 409 });

  await prisma.appointment.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ ok: true });
}
