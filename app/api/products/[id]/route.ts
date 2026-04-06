import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).optional(),
  price: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

async function getProductOrFail(id: string, organizationId: string) {
  return prisma.product.findFirst({
    where: { id, unit: { organizationId } },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "BARBER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const product = await getProductOrFail(id, session.user.organizationId);
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", fields: parsed.error.flatten().fieldErrors }, { status: 422 });

  const updated = await prisma.product.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "BARBER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const product = await getProductOrFail(id, session.user.organizationId);
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  await prisma.product.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
