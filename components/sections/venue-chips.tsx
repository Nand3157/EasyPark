"use client";

import { Building2, Landmark, Plane, TrainFront } from "lucide-react";
import { VENUE_PRESETS, VENUE_TYPE_LABEL, type Venue } from "@/lib/venues";

const TYPE_ICON: Record<Venue["type"], React.ComponentType<{ size?: number; className?: string }>> = {
  airport: Plane,
  station: TrainFront,
  stadium: Landmark,
  mall: Building2,
};

export function VenueChips({ onPick }: { onPick: (v: Venue) => void }) {
  return (
    <div className="mx-auto mt-6 max-w-5xl">
      <p className="t-tertiary mb-2 text-center text-[10px] font-bold tracking-[0.18em] uppercase">Venues</p>
      <div className="hide-scrollbar flex gap-2 overflow-x-auto px-2 py-1">
        {VENUE_PRESETS.map((v) => {
          const Icon = TYPE_ICON[v.type];
          return (
            <button
              key={v.name}
              onClick={() => onPick(v)}
              className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-slate-950/10 bg-white/70 px-3.5 py-2 text-xs font-semibold whitespace-nowrap text-slate-700 shadow-sm transition-colors hover:border-blue-500 hover:text-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:border-white/20 dark:hover:text-white"
              title={`${v.name}, ${v.city} — ${VENUE_TYPE_LABEL[v.type]}`}
            >
              <Icon size={14} className="text-blue-500" aria-hidden />
              {v.name}
              <span className="rounded-full bg-slate-950/5 px-2 py-0.5 text-[10px] font-bold dark:bg-white/10">{v.city}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
