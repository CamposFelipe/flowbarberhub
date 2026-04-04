import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { TransactionType } from "@prisma/client";

const schema = z.object({
  products: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1),
  })).optional().default([]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 422 });

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      service: true,
      barber: true,
      unit: { select: { organizationId: true } },
    },
  });

  if (!appointment) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
  if (appointment.status === "COMPLETED") return NextResponse.json({ error: "Já finalizado" }, { status: 409 });

  const { products } = parsed.data;

  await prisma.$transaction(async (tx) => {
    // Mark appointment as completed
    await tx.appointment.update({
      where: { id: appointment.id },
      data: { status: "COMPLETED" },
    });

    // Service transaction
    const serviceTx = await tx.transaction.create({
      data: {
        unitId: appointment.unitId,
        barberId: appointment.barberId,
        appointmentId: appointment.id,
        type: TransactionType.SERVICE,
        amount: appointment.service.price,
        description: appointment.service.name,
      },
    });

    // Product transactions + stock decrement
    for (const item of products) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) continue;

      const productTx = await tx.transaction.create({
        data: {
          unitId: appointment.unitId,
          barberId: appointment.barberId,
          appointmentId: appointment.id,
          type: TransactionType.PRODUCT,
          amount: Number(product.price) * item.quantity,
          description: `${product.name} x${item.quantity}`,
        },
      });

      await tx.transactionItem.create({
        data: {
          transactionId: productTx.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.price,
        },
      });

      // Decrement stock
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
