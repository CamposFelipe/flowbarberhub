"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, ChevronDown, Check } from "lucide-react";
import { setActiveUnit } from "./unit-actions";

interface Unit {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  units: Unit[];
  activeUnitId: string | null;
}

export default function UnitSwitcher({ units, activeUnitId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const active = units.find((u) => u.id === activeUnitId) ?? units[0];

  if (units.length === 0) return null;
  if (units.length === 1) {
    return (
      <div className="flex items-center gap-2 px-1 py-1.5">
        <MapPin className="h-3.5 w-3.5 text-white/50 shrink-0" />
        <span className="truncate text-xs font-medium text-white/80">{active?.name}</span>
      </div>
    );
  }

  function select(unitId: string) {
    setOpen(false);
    startTransition(async () => {
      await setActiveUnit(unitId);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10 transition-colors"
      >
        <MapPin className="h-3.5 w-3.5 text-white/50 shrink-0" />
        <span className="flex-1 truncate text-left">{active?.name ?? "Selecionar unidade"}</span>
        <ChevronDown className={`h-3 w-3 text-white/50 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 z-20 mt-1 rounded-lg border border-white/20 bg-[hsl(224,71%,14%)] shadow-xl overflow-hidden">
            {units.map((unit) => (
              <button
                key={unit.id}
                onClick={() => select(unit.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/80 hover:bg-white/10 transition-colors"
              >
                <span className="flex-1 truncate text-left">{unit.name}</span>
                {unit.id === (activeUnitId ?? units[0]?.id) && (
                  <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
