import type { ParkingSpot } from "@/lib/parking";

export interface SharedSpotParams {
  spotId: number;
  lat: number;
  lng: number;
  zoom: number;
}

/** Deep link to a spot: `?spot=<id>&lat=<..>&lng=<..>&z=16`. */
export function buildSpotUrl(spot: Pick<ParkingSpot, "id" | "lat" | "lng">, zoom = 16): string {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href.split("?")[0]);
  url.searchParams.set("spot", String(spot.id));
  url.searchParams.set("lat", String(spot.lat));
  url.searchParams.set("lng", String(spot.lng));
  url.searchParams.set("z", String(zoom));
  return url.toString();
}

/** Parse a shared spot URL back into params (null when absent/invalid). */
export function parseSpotParams(search: string): SharedSpotParams | null {
  try {
    const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
    const spotId = Number(params.get("spot"));
    const lat = Number(params.get("lat"));
    const lng = Number(params.get("lng"));
    const zoom = Number(params.get("z") ?? 16);
    if (!Number.isFinite(spotId) || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return { spotId, lat, lng, zoom: Number.isFinite(zoom) ? zoom : 16 };
  } catch {
    return null;
  }
}

/** Copy text with a textarea fallback for non-secure contexts. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path.
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
