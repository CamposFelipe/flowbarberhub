import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  price: z.number().min(0),
  stock: z.number().int().min(0),
  description: z.string().optional(),
  unitId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "BARBER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 422 });

  const { name, price, stock, description, unitId } = parsed.data;

  const unit = await prisma.unit.findFirst({
    where: { id: unitId, organizationId: session.user.organizationId },
  });
  if (!unit) return NextResponse.json({ error: "Unidade inválida." }, { status: 400 });

  const product = await prisma.product.create({
    data: { name, price, stock, description, unitId },
  });

  return NextResponse.json(product, { status: 201 });
}
