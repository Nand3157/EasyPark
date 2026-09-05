"use client";

import { Accessibility, BatteryCharging, Clock, Globe, Heart, LocateFixed, MapPin, Navigation, Shield, Star, Warehouse } from "lucide-react";
import type { ParkingSpot } from "@/lib/parking";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SpotCardProps {
  spot: ParkingSpot;
  isSelected: boolean;
  isFavorite: boolean;
  isReserved: boolean;
  onToggleFavorite: () => void;
  onFocus: () => void;
  onReserve: () => void;
}

const FEATURE_ICONS = [
  { key: "EV", label: "EV charging", Icon: BatteryCharging, tone: "bg-blue-600/10 text-blue-600 dark:text-blue-400" },
  { key: "Covered", label: "Covered parking", Icon: Warehouse, tone: "bg-purple-600/10 text-purple-600 dark:text-purple-400" },
  { key: "Secure", label: "24/7 security", Icon: Shield, tone: "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400" },
  { key: "Handicap", label: "Handicap access", Icon: Accessibility, tone: "bg-amber-600/10 text-amber-600 dark:text-amber-400" },
];

/** Single parking listing: identity, pricing, availability, features, actions. */
export function SpotCard({ spot, isSelected, isFavorite, isReserved, onToggleFavorite, onFocus, onReserve }: SpotCardProps) {
  const lowAvailability = spot.available < 10;

  return (
    <Card
      className={cn(
        "group flex h-full flex-col p-6",
        isSelected && "border-blue-600/60 ring-1 ring-blue-600/40 dark:border-blue-400/60 dark:ring-blue-400/40"
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-950 transition-colors group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-400">
            {spot.name}
          </h3>
          <p className="t-tertiary mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1">
              <MapPin size={14} aria-hidden /> {spot.distance}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={14} aria-hidden /> {spot.walkTime}
            </span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              <Globe size={12} aria-hidden /> Google Maps
            </a>
          </p>
        </div>
        <button
          onClick={onToggleFavorite}
          aria-label={isFavorite ? `Remove ${spot.name} from favorites` : `Save ${spot.name} to favorites`}
          aria-pressed={isFavorite}
          className={cn(
            "cursor-pointer rounded-full p-1 transition-colors",
            isFavorite ? "text-red-500" : "text-slate-300 hover:text-red-500 dark:text-white/20"
          )}
        >
          <Heart size={22} fill={isFavorite ? "currentColor" : "none"} aria-hidden />
        </button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-950/8 bg-slate-950/[0.03] p-3 dark:border-white/8 dark:bg-white/5">
          <p className="t-tertiary mb-1 text-[10px] tracking-wider uppercase">Hourly</p>
          <p className="text-lg font-bold text-slate-950 dark:text-white">
            {spot.hourly}
            <span className="t-tertiary text-xs font-normal">/hr</span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-950/8 bg-slate-950/[0.03] p-3 dark:border-white/8 dark:bg-white/5">
          <p className="t-tertiary mb-1 text-[10px] tracking-wider uppercase">Full day</p>
          <p className="text-lg font-bold text-slate-950 dark:text-white">
            {spot.daily}
            <span className="t-tertiary text-xs font-normal">/day</span>
          </p>
        </div>
      </div>

      <div className="mb-5 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-bold text-slate-950 dark:text-white">
          <Star size={16} className="text-amber-500" fill="currentColor" aria-hidden />
          {spot.rating}
          <span className="sr-only">out of 5</span>
        </p>
        <p
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            lowAvailability
              ? "bg-red-500/15 text-red-600 dark:text-red-400"
              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
          )}
        >
          {spot.available} / {spot.total} available
        </p>
      </div>

      {spot.features.length > 0 && (
        <ul aria-label={`${spot.name} amenities`} className="mb-6 flex flex-wrap gap-2">
          {FEATURE_ICONS.filter((f) => spot.features.includes(f.key)).map(({ key, label, Icon, tone }) => (
            <li key={key} title={label} className={cn("rounded-lg p-2", tone)}>
              <Icon size={16} aria-hidden />
              <span className="sr-only">{label}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto grid grid-cols-3 gap-2">
        <Button variant="outline" size="sm" onClick={onFocus} className="px-2">
          <LocateFixed size={14} aria-hidden /> Focus
        </Button>
        <Button
          variant="ghost"
          size="sm"
          href={`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2 text-emerald-700 hover:text-emerald-600 dark:text-emerald-300"
        >
          <Navigation size={13} aria-hidden /> Maps
        </Button>
        <Button
          variant={isReserved ? "success" : "secondary"}
          size="sm"
          onClick={onReserve}
          aria-live="polite"
          className="px-2"
        >
          {isReserved ? "✓ Reserved" : "Reserve"}
        </Button>
      </div>
    </Card>
  );
}
