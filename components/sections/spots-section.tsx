"use client";

import { ChevronRight } from "lucide-react";
import type { ParkingSpot } from "@/lib/parking";
import { scrollToSection } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";
import { SpotCard } from "@/components/parking/spot-card";

interface SpotsSectionProps {
  spots: ParkingSpot[];
  locationName: string;
  activeFilter: string;
  selectedId: number | null;
  favorites: number[];
  reservedIds: number[];
  onToggleFavorite: (id: number) => void;
  onFocusSpot: (spot: ParkingSpot) => void;
  onReserve: (id: number) => void;
  dataSource: "demo" | "live" | "demo-fallback";
}

/** Results grid: section head, empty state, spot cards. */
export function SpotsSection({
  spots,
  locationName,
  activeFilter,
  selectedId,
  favorites,
  reservedIds,
  onToggleFavorite,
  onFocusSpot,
  onReserve,
  dataSource,
}: SpotsSectionProps) {
  const city = locationName.split(",")[0];

  return (
    <section id="spots" aria-label="Nearby parking spots" className="mb-20 scroll-mt-28 md:mb-28">
      <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
        <div>
          <p className="mb-2 text-xs font-bold tracking-[0.2em] text-blue-600 uppercase dark:text-blue-400">
            Results
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Nearby parking
          </h2>
          <p className="t-tertiary mt-1.5 text-sm md:text-base">Available spots around {city}</p>
        </div>
        <button
          onClick={() => scrollToSection("map")}
          className="t-secondary flex cursor-pointer items-center gap-1.5 text-sm font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400"
        >
          View on map ({spots.length}) <ChevronRight size={16} aria-hidden />
        </button>
      </Reveal>

      {spots.length === 0 ? (
        <div className="surface t-tertiary p-12 text-center text-sm" role="status">
          {dataSource === "live" ? (
            <>
              No mapped parking lots found within 3 km of {city}. OpenStreetMap coverage varies by
              area — try a city center, or another filter.
            </>
          ) : (
            <>
              No parking spots match “{activeFilter}”. Try selecting “Nearby” or another filter.
            </>
          )}
        </div>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {spots.map((spot, i) => (
            <Reveal key={spot.id} delay={Math.min(i * 0.06, 0.3)} className="h-full">
              <li className="h-full">
                <SpotCard
                  spot={spot}
                  isSelected={selectedId === spot.id}
                  isFavorite={favorites.includes(spot.id)}
                  isReserved={reservedIds.includes(spot.id)}
                  onToggleFavorite={() => onToggleFavorite(spot.id)}
                  onFocus={() => onFocusSpot(spot)}
                  onReserve={() => onReserve(spot.id)}
                />
              </li>
            </Reveal>
          ))}
        </ul>
      )}
    </section>
  );
}
