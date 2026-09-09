"use client";

import { ChevronRight } from "lucide-react";
import type { ParkingSpot } from "@/lib/parking";
import { parkingSearchUrl } from "@/lib/maps";
import { scrollToSection } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";
import { SpotCard } from "@/components/parking/spot-card";

interface SpotsSectionProps {
  spots: ParkingSpot[];
  locationName: string;
  mapCenter: [number, number];
  activeFilter: string;
  selectedId: number | null;
  favorites: number[];
  reservedIds: number[];
  onToggleFavorite: (id: number) => void;
  onFocusSpot: (spot: ParkingSpot) => void;
  onReserve: (id: number) => void;
  onStartSession: (spot: ParkingSpot) => void;
  dataSource: "demo" | "live" | "demo-fallback";
}

/** Results grid: section head, empty state, spot cards. */
export function SpotsSection({
  spots,
  locationName,
  mapCenter,
  selectedId,
  favorites,
  reservedIds,
  onToggleFavorite,
  onFocusSpot,
  onReserve,
  onStartSession,
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
          <p className="mx-auto mb-5 max-w-md">
            {dataSource === "live" ? (
              <>
                No mapped parking lots found within 3 km of {city}. OpenStreetMap coverage varies by
                area — Google has real results:
              </>
            ) : (
              <>Live data unreachable — find real parking near {city} on Google Maps:</>
            )}
          </p>
          <a
            href={parkingSearchUrl(mapCenter[0], mapCenter[1])}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-500"
          >
            Search parking on Google Maps ↗
          </a>
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
                  onStartSession={() => onStartSession(spot)}
                />
              </li>
            </Reveal>
          ))}
        </ul>
      )}
    </section>
  );
}
