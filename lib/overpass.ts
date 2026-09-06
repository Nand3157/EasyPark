import type { ParkingSpot } from "./parking";
import { formatDistance, haversineKm, walkTimeFor } from "./geo";

/**
 * Real nearby parking via OpenStreetMap's Overpass API (no key required).
 * Returns mapped `amenity=parking` lots around a coordinate. Private lots
 * are excluded server-side. Note: OSM has locations + capacity, but NOT
 * live availability — call sites must not invent occupancy numbers.
 */

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const RADIUS_METERS = 3000;
const RESULT_LIMIT = 40;
const REQUEST_TIMEOUT_MS = 15000;

interface OverpassTags {
  name?: string;
  operator?: string;
  capacity?: string;
  fee?: string;
  charge?: string;
  parking?: string;
  access?: string;
  [key: string]: string | undefined;
}

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: OverpassTags;
}

function parseCapacity(raw?: string): number | null {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseFee(tags: OverpassTags): "free" | "paid" | null {
  if (tags.fee === "no") return "free";
  if (tags.fee === "yes" || tags.charge) return "paid";
  return null;
}

function toSpot(
  el: OverpassElement,
  index: number,
  originLat: number,
  originLng: number
): ParkingSpot | null {
  const lat = el.type === "node" ? el.lat : el.center?.lat;
  const lng = el.type === "node" ? el.lon : el.center?.lon;
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const tags = el.tags ?? {};
  const operator = tags.operator?.trim() || undefined;
  const name = tags.name?.trim() || (operator ? `${operator} Parking` : "Public Parking");

  const distKm = haversineKm(originLat, originLng, lat, lng);
  const features: string[] = [];
  if (tags.parking === "multi-storey" || tags.parking === "underground") {
    features.push("Covered");
  }

  return {
    id: 1000 + index,
    name,
    distance: formatDistance(distKm),
    walkTime: walkTimeFor(distKm),
    hourly: "—",
    // No real price feed: sort priced demo spots first under "Cheapest".
    hourlyNum: Number.POSITIVE_INFINITY,
    daily: "—",
    rating: 0,
    available: 0,
    total: 0,
    features,
    lat,
    lng,
    source: "live",
    capacity: parseCapacity(tags.capacity),
    fee: parseFee(tags),
    operator,
  };
}

function buildQuery(lat: number, lng: number): string {
  const area = `(around:${RADIUS_METERS},${lat},${lng})`;
  const filter = `["amenity"="parking"]["access"!~"^(private|no)$"]`;
  return `[out:json][timeout:20];(node${filter}${area};way${filter}${area};);out center ${RESULT_LIMIT};`;
}

export async function fetchLiveParking(lat: number, lng: number): Promise<ParkingSpot[]> {
  const query = buildQuery(lat, lng);
  let lastError: unknown = null;

  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        // Form-encoded body: required by overpass-api.de, and CORS-safelisted
        // so browsers skip the preflight.
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`Overpass responded with ${res.status}`);
      const json = (await res.json()) as { elements?: OverpassElement[] };
      const spots: { spot: ParkingSpot; distKm: number }[] = [];
      for (const [index, el] of (json.elements ?? []).entries()) {
        const spot = toSpot(el, index, lat, lng);
        if (spot) spots.push({ spot, distKm: haversineKm(lat, lng, spot.lat, spot.lng) });
      }
      spots.sort((a, b) => a.distKm - b.distKm);
      return spots.map((s) => s.spot);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Live parking lookup failed");
}
