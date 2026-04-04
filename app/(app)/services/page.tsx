import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Scissors, Clock, Tag } from "lucide-react";
import { ServiceDialog } from "./service-dialog";
import { DeleteServiceButton } from "./delete-service-button";

function fmt(val: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
}

export default async function ServicesPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/onboarding");

  const units = await prisma.unit.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      services: { where: { isActive: true }, orderBy: { name: "asc" } },
    },
  });

  const allServices = units.flatMap((u) =>
    u.services.map((s) => ({ ...s, unitName: u.name }))
  );
  const unitOptions = units.map((u) => ({ id: u.id, name: u.name }));
  const canEdit = session.user.role !== "BARBER";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Serviços</h1>
          <p className="text-sm text-muted-foreground">
            {allServices.length} serviço{allServices.length !== 1 ? "s" : ""} cadastrado{allServices.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canEdit && <ServiceDialog units={unitOptions} />}
      </div>

      <div className="rounded-xl border bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">Serviços ativos</h2>
        </div>

        {allServices.length === 0 ? (
          <div className="py-16 text-center">
            <Scissors className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado</p>
            <p className="text-xs text-muted-foreground">
              Adicione serviços para que apareçam na página de agendamento
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {allServices.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-4 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-50">
                    <Scissors className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{s.name}</p>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" /> {fmt(Number(s.price))}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {s.durationMinutes} min
                      </span>
                      {units.length > 1 && <span>{s.unitName}</span>}
                    </div>
                    {s.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p>
                    )}
                  </div>
                </div>

                {canEdit && (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <ServiceDialog
                      units={unitOptions}
                      service={{
                        id: s.id,
                        name: s.name,
                        price: Number(s.price),
                        durationMinutes: s.durationMinutes,
                        description: s.description,
                        unitId: s.unitId,
                      }}
                    />
                    <DeleteServiceButton serviceId={s.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
