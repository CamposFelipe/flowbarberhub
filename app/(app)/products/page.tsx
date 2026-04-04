import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Package, AlertTriangle } from "lucide-react";
import { ProductDialog } from "./product-dialog";
import { DeleteProductButton } from "./delete-product-button";

function fmt(val: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
}

export default async function ProductsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/onboarding");

  const units = await prisma.unit.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      products: { where: { isActive: true }, orderBy: { name: "asc" } },
    },
  });

  const allProducts = units.flatMap((u) => u.products.map((p) => ({ ...p, unitName: u.name })));
  const unitOptions = units.map((u) => ({ id: u.id, name: u.name }));
  const canEdit = session.user.role !== "BARBER";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            {allProducts.length} produto{allProducts.length !== 1 ? "s" : ""} em estoque
          </p>
        </div>
        {canEdit && <ProductDialog units={unitOptions} />}
      </div>

      <div className="rounded-xl border bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">Estoque atual</h2>
        </div>
        {allProducts.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhum produto cadastrado</p>
            <p className="text-xs text-muted-foreground">Adicione produtos para controlar o estoque</p>
          </div>
        ) : (
          <div className="divide-y">
            {allProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.unitName} · {fmt(Number(p.price))}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.stock > 0 && p.stock <= 3 && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      <AlertTriangle className="h-3 w-3" /> Baixo
                    </span>
                  )}
                  <span className={`rounded-lg px-3 py-1 text-sm font-semibold ${
                    p.stock === 0 ? "bg-destructive/10 text-destructive" :
                    p.stock <= 3 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                  }`}>
                    {p.stock} un.
                  </span>
                  {canEdit && (
                    <>
                      <ProductDialog
                        units={unitOptions}
                        product={{ id: p.id, name: p.name, price: Number(p.price), stock: p.stock, description: p.description, unitId: p.unitId }}
                      />
                      <DeleteProductButton productId={p.id} />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
