import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BookingForm from "./booking-form";
import { Scissors } from "lucide-react";

export default async function BookingPage({ params }: { params: Promise<{ "unit-slug": string }> }) {
  const { "unit-slug": unitSlug } = await params;
  const unit = await prisma.unit.findUnique({
    where: { slug: unitSlug },
    include: {
      organization: { select: { name: true } },
      services: { where: { isActive: true }, orderBy: { name: "asc" } },
      barbers: {
        include: {
          barber: { include: { user: { select: { id: true, name: true, image: true } } } },
        },
      },
      schedules: true,
    },
  });

  if (!unit) notFound();

  const barbers = unit.barbers.map((bu) => ({
    id: bu.barber.id,
    name: bu.barber.user.name ?? "Barbeiro",
    image: bu.barber.user.image,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(224,71%,18%)] to-[hsl(221,83%,35%)]">
      {/* Header */}
      <header className="border-b border-white/10 px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
            <Scissors className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-white/60">Agendamento online</p>
            <p className="text-sm font-semibold text-white">{unit.organization.name} — {unit.name}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <BookingForm
          unit={{ id: unit.id, name: unit.name, slug: unit.slug }}
          services={unit.services.map((s) => ({
            id: s.id, name: s.name,
            price: Number(s.price),
            durationMinutes: s.durationMinutes,
          }))}
          barbers={barbers}
          schedules={unit.schedules.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            isOpen: s.isOpen,
            openTime: s.openTime,
            closeTime: s.closeTime,
          }))}
        />
      </div>
    </div>
  );
}
