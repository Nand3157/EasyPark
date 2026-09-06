"use client";

import dynamic from "next/dynamic";
import { Accessibility, Clock, Loader2, LocateFixed, TrendingUp, Warehouse, X, Zap } from "lucide-react";
import type { ParkingSpot } from "@/lib/parking";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";

const ParkingMap = dynamic(() => import("@/components/ParkingMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <p className="t-tertiary flex items-center gap-2 text-sm">
        <Loader2 className="animate-spin" size={18} aria-hidden /> Loading map…
      </p>
    </div>
  ),
});

interface MapPanelProps {
  mapCenter: [number, number];
  mapZoom: number;
  filteredSpots: ParkingSpot[];
  selectedSpotId: number | null;
  onSelectSpot: (id: number | null) => void;
  locationName: string;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
  onLocate: () => void;
  locating: boolean;
  dataSource: "demo" | "live" | "demo-fallback";
}

const TOOLBAR_ACTIONS = [
  { Icon: Zap, filter: "EV Charging", label: "Filter: EV charging" },
  { Icon: Warehouse, filter: "Covered Parking", label: "Filter: covered parking" },
  { Icon: Accessibility, filter: "Handicap Access", label: "Filter: handicap access" },
  { Icon: TrendingUp, filter: "Cheapest", label: "Sort: cheapest first" },
  { Icon: Clock, filter: "24 Hours", label: "Filter: open 24 hours" },
];

/** Live map panel: toolbar shortcuts, markers, selection overlay, result banner. */
export function MapPanel({
  mapCenter,
  mapZoom,
  filteredSpots,
  selectedSpotId,
  onSelectSpot,
  locationName,
  activeFilter,
  onSelectFilter,
  onLocate,
  locating,
  dataSource,
}: MapPanelProps) {
  const selectedSpot = selectedSpotId
    ? filteredSpots.find((s) => s.id === selectedSpotId) ?? null
    : null;

  return (
    <section id="map" aria-label="Live parking map" className="relative mb-20 scroll-mt-28 md:mb-24">
      <Reveal>
        <div className="relative h-[480px] overflow-hidden rounded-4xl border border-slate-950/10 bg-white/60 shadow-xl shadow-slate-950/5 md:h-[550px] md:rounded-5xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/40">
          <ParkingMap
            mapCenter={mapCenter}
            mapZoom={mapZoom}
            filteredSpots={filteredSpots}
            selectedSpotId={selectedSpotId}
            setSelectedSpotId={(id: number) => onSelectSpot(id)}
          />

          <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2.5 md:top-6 md:left-6">
            <button
              title="Locate my position"
              aria-label="Use my current location"
              aria-busy={locating}
              onClick={onLocate}
              className="flex size-11 cursor-pointer items-center justify-center rounded-2xl border border-slate-950/10 bg-white/90 text-slate-800 shadow-lg backdrop-blur-xl transition-transform hover:scale-105 md:size-12 dark:border-white/10 dark:bg-slate-950/70 dark:text-white"
            >
              {locating ? (
                <Loader2 size={20} className="animate-spin text-blue-500" aria-hidden />
              ) : (
                <LocateFixed size={20} className="text-blue-500" aria-hidden />
              )}
            </button>
            {TOOLBAR_ACTIONS.map(({ Icon, filter, label }) => {
              const active = activeFilter === filter;
              return (
                <button
                  key={filter}
                  title={label}
                  aria-label={label}
                  aria-pressed={active}
                  onClick={() => onSelectFilter(filter)}
                  className={cn(
                    "flex size-11 cursor-pointer items-center justify-center rounded-2xl border shadow-md backdrop-blur-xl transition-all hover:scale-105 md:size-12",
                    active
                      ? "border-blue-600 bg-blue-600 text-white shadow-blue-600/30"
                      : "border-slate-950/10 bg-white/90 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-slate-950/70 dark:text-white/80 dark:hover:text-white"
                  )}
                >
                  <Icon size={20} aria-hidden />
                </button>
              );
            })}
          </div>

          {selectedSpot && (
            <div className="absolute top-4 right-4 z-[400] w-full max-w-xs p-1 md:top-6 md:right-6 md:max-w-sm">
              <div className="rounded-3xl border border-slate-950/10 bg-white/95 p-5 shadow-2xl backdrop-blur-xl dark:border-white/20 dark:bg-slate-950/85">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-blue-600 uppercase dark:text-blue-400">
                      Selected spot
                    </p>
                    <h3 className="mt-0.5 text-base font-bold text-slate-950 md:text-lg dark:text-white">
                      {selectedSpot.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => onSelectSpot(null)}
                    aria-label="Close selected spot details"
                    className="t-tertiary rounded-full p-1.5 transition-colors hover:bg-slate-950/5 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <X size={18} aria-hidden />
                  </button>
                </div>
                <p className="t-secondary mb-4 text-xs">
                  {selectedSpot.distance} away
                  {selectedSpot.source === "live" ? (
                    <>
                      {" • "}
                      {selectedSpot.fee === "free"
                        ? "Free"
                        : selectedSpot.fee === "paid"
                          ? "Paid parking"
                          : "Fee unknown"}
                      {selectedSpot.capacity != null && ` • ${selectedSpot.capacity} spaces`}
                    </>
                  ) : (
                    <>
                      {" • "}
                      {selectedSpot.hourly} / hr •{" "}
                      <strong className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {selectedSpot.available} available
                      </strong>
                    </>
                  )}
                </p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedSpot.lat},${selectedSpot.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition-colors hover:bg-emerald-500"
                >
                  Open Google Maps ↗
                </a>
              </div>
            </div>
          )}

          <div className="pointer-events-none absolute right-4 bottom-4 left-4 z-[400] flex justify-center md:right-6 md:bottom-6 md:left-6">
            <p className="flex items-center gap-2 rounded-full border border-slate-950/10 bg-white/90 px-5 py-2.5 text-xs font-medium text-slate-700 shadow-xl backdrop-blur-md md:text-sm dark:border-white/15 dark:bg-slate-950/70 dark:text-white/90">
              {dataSource === "live" ? (
                <span>
                  Showing <strong className="text-slate-950 dark:text-white">{filteredSpots.length}</strong>{" "}
                  real parking lots near{" "}
                  <strong className="max-w-40 truncate text-slate-950 sm:max-w-none dark:text-white">
                    {locationName}
                  </strong>{" "}
                  · OpenStreetMap
                </span>
              ) : dataSource === "demo-fallback" ? (
                <span>
                  Live data unreachable —{" "}
                  <strong className="text-slate-950 dark:text-white">{filteredSpots.length}</strong> demo
                  spots near{" "}
                  <strong className="max-w-40 truncate text-slate-950 sm:max-w-none dark:text-white">
                    {locationName}
                  </strong>
                </span>
              ) : (
                <span>
                  Showing <strong className="text-slate-950 dark:text-white">{filteredSpots.length}</strong>{" "}
                  demo spots in{" "}
                  <strong className="max-w-40 truncate text-slate-950 sm:max-w-none dark:text-white">
                    {locationName}
                  </strong>
                </span>
              )}
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
