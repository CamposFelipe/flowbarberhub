import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Users, Crown, Shield, Scissors } from "lucide-react";
import { InviteDialog } from "./invite-dialog";

const ROLE_CONFIG = {
  OWNER:  { label: "Proprietário", icon: Crown,   classes: "bg-amber-50 text-amber-700" },
  ADMIN:  { label: "Administrador", icon: Shield,  classes: "bg-blue-50 text-blue-700" },
  BARBER: { label: "Barbeiro",       icon: Scissors, classes: "bg-violet-50 text-violet-700" },
};

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/onboarding");

  const [members, units] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        barberProfile: {
          include: { units: { include: { unit: { select: { name: true } } } } },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.unit.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true },
    }),
  ]);

  const isOwner = session.user.role === "OWNER" || session.user.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipe</h1>
          <p className="text-sm text-muted-foreground">{members.length} membro{members.length !== 1 ? "s" : ""} na organização</p>
        </div>
        {isOwner && <InviteDialog units={units} />}
      </div>

      <div className="rounded-xl border bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">Membros</h2>
        </div>
        {members.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhum membro ainda</p>
          </div>
        ) : (
          <div className="divide-y">
            {members.map((member) => {
              const role = ROLE_CONFIG[member.role];
              const RoleIcon = role.icon;
              const assignedUnits = member.barberProfile?.units.map((bu) => bu.unit.name) ?? [];

              return (
                <div key={member.id} className="flex items-center justify-between gap-4 px-4 py-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {member.name?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{member.name}</p>
                        {member.id === session.user.id && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">você</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                      {assignedUnits.length > 0 && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Unidades: {assignedUnits.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${role.classes}`}>
                    <RoleIcon className="h-3 w-3" />
                    {role.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
