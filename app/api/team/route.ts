import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "BARBER"]),
  unitId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "BARBER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", fields: parsed.error.flatten().fieldErrors }, { status: 422 });

  const { name, email, password, role, unitId } = parsed.data;

  // Check email uniqueness
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "E-mail já está em uso." }, { status: 409 });

  // Verify unit belongs to org
  const unit = await prisma.unit.findFirst({
    where: { id: unitId, organizationId: session.user.organizationId },
  });
  if (!unit) return NextResponse.json({ error: "Unidade inválida." }, { status: 400 });

  const hashed = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashed,
        role,
        organizationId: session.user.organizationId!,
      },
    });

    const barber = await tx.barber.create({
      data: {
        userId: user.id,
        organizationId: session.user.organizationId!,
      },
    });

    await tx.barberUnit.create({
      data: { barberId: barber.id, unitId },
    });
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
