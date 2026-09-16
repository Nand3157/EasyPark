import type { ParkingSpot } from "./parking";
import type { ChargingStation } from "./charging";

export interface RecentSearch {
  query: string;
  label: string;
  lat: number;
  lng: number;
  at: number;
}

export const RECENT_KEY = "easypark:recentSearches";
export const CACHE_KEY = "easypark:lastLive";
export const MAX_RECENT = 5;

export interface LiveCache {
  lat: number;
  lng: number;
  label: string;
  spots: ParkingSpot[];
  chargers: ChargingStation[];
  at: number;
}

export function isRecentSearch(v: unknown): v is RecentSearch {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.query === "string" &&
    typeof r.label === "string" &&
    typeof r.lat === "number" &&
    typeof r.lng === "number" &&
    typeof r.at === "number"
  );
}

export function isRecentList(v: unknown): v is RecentSearch[] {
  return Array.isArray(v) && v.every((item) => isRecentSearch(item));
}

export function isLiveCache(v: unknown): v is LiveCache {
  if (typeof v !== "object" || v === null) return false;
  const c = v as Record<string, unknown>;
  return (
    typeof c.lat === "number" && typeof c.lng === "number" && typeof c.label === "string" && Array.isArray(c.spots) && typeof c.at === "number"
  );
}
