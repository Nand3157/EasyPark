import { formatDistance, haversineKm, walkTimeFor } from "./geo";

export interface ChargingStation {
  id: number;
  name: string;
  lat: number;
  lng: number;
  distKm: number;
  distance: string;
  walkTime: string;
  operator?: string;
  connectors: string[];
  fee: "free" | "paid" | null;
  source: "osm_charging" | "ocm";
}

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const RADIUS_METERS = 3000;
const RESULT_LIMIT = 25;
const REQUEST_TIMEOUT_MS = 12000;

interface OverpassTags {
  name?: string;
  operator?: string;
  fee?: string;
  charge?: string;
  "socket:type2"?: string;
  "socket:ccs"?: string;
  "socket:chademo"?: string;
  "socket:type1"?: string;
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

function parseFee(tags: OverpassTags): "free" | "paid" | null {
  if (tags.fee === "no") return "free";
  if (tags.fee === "yes" || tags.charge) return "paid";
  return null;
}

function parseConnectors(tags: OverpassTags): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(tags)) {
    if (k.startsWith("socket:") && v != null && v !== "0" && v !== "no") {
      const label = k.replace("socket:", "").toUpperCase();
      out.push(`${label}×${v}`);
    }
  }
  // Some mappers tag `socket` generic.
  if (out.length === 0 && tags.socket) out.push(tags.socket.toUpperCase());
  return out;
}

function toStation(el: OverpassElement, index: number, originLat: number, originLng: number): ChargingStation | null {
  const lat = el.type === "node" ? el.lat : el.center?.lat;
  const lng = el.type === "node" ? el.lon : el.center?.lon;
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const tags = el.tags ?? {};
  const operator = tags.operator?.trim() || undefined;
  const name = tags.name?.trim() || (operator ? `${operator} Charger` : "EV Charging Station");
  const distKm = haversineKm(originLat, originLng, lat, lng);
  return {
    id: 5000 + index,
    name,
    lat,
    lng,
    distKm,
    distance: formatDistance(distKm),
    walkTime: walkTimeFor(distKm),
    operator,
    connectors: parseConnectors(tags),
    fee: parseFee(tags),
    source: "osm_charging",
  };
}

function buildQuery(lat: number, lng: number): string {
  const area = `(around:${RADIUS_METERS},${lat},${lng})`;
  const filter = `["amenity"="charging_station"]`;
  return `[out:json][timeout:15];(node${filter}${area};way${filter}${area};);out center ${RESULT_LIMIT};`;
}

// Optional OpenChargeMap — works without a key at low volume, but prefers
// NEXT_PUBLIC_OCM_KEY when present. Failures silently fall back to OSM.
async function fetchOcmStations(lat: number, lng: number): Promise<ChargingStation[] | null> {
  try {
    const key = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_OCM_KEY as string | undefined) : undefined;
    const url = new URL("https://api.openchargemap.io/v3/poi");
    url.searchParams.set("output", "json");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lng));
    url.searchParams.set("distance", "3");
    url.searchParams.set("distanceunit", "KM");
    url.searchParams.set("maxresults", "20");
    url.searchParams.set("compact", "true");
    url.searchParams.set("verbose", "false");
    if (key) url.searchParams.set("key", key);
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{
      ID: number;
      Title?: string;
      OperatorInfo?: { Title?: string };
      AddressInfo?: { Title?: string; Town?: string; Latitude: number; Longitude: number };
      Connections?: Array<{ ConnectionType?: { Title?: string } }>;
      UsageType?: { Title?: string };
    }>;
    if (!Array.isArray(data) || data.length === 0) return null;
    const stations: ChargingStation[] = [];
    for (const [idx, poi] of data.entries()) {
      const aLat = poi.AddressInfo?.Latitude;
      const aLng = poi.AddressInfo?.Longitude;
      if (typeof aLat !== "number" || typeof aLng !== "number") continue;
      const distKm = haversineKm(lat, lng, aLat, aLng);
      const title = poi.Title?.trim() || poi.AddressInfo?.Title?.trim() || "EV Charging Station";
      const operator = poi.OperatorInfo?.Title?.trim();
      const connectors = Array.from(
        new Set((poi.Connections ?? []).map((c) => c.ConnectionType?.Title?.trim()).filter((v): v is string => Boolean(v)))
      ).slice(0, 4);
      stations.push({
        id: 6000 + (poi.ID ?? idx),
        name: title,
        lat: aLat,
        lng: aLng,
        distKm,
        distance: formatDistance(distKm),
        walkTime: walkTimeFor(distKm),
        operator: operator || undefined,
        connectors,
        fee: null,
        source: "ocm",
      });
    }
    stations.sort((a, b) => a.distKm - b.distKm);
    return stations;
  } catch {
    return null;
  }
}

export async function fetchChargingStations(lat: number, lng: number): Promise<ChargingStation[]> {
  // Prefer OCM when available (often has live status), otherwise OSM is reliable and keyless.
  const ocm = await fetchOcmStations(lat, lng);
  if (ocm && ocm.length > 0) return ocm;

  const query = buildQuery(lat, lng);
  let lastError: unknown = null;
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`Overpass responded with ${res.status}`);
      const json = (await res.json()) as { elements?: OverpassElement[] };
      const stations: ChargingStation[] = [];
      for (const [index, el] of (json.elements ?? []).entries()) {
        const s = toStation(el, index, lat, lng);
        if (s) stations.push(s);
      }
      stations.sort((a, b) => a.distKm - b.distKm);
      return stations;
    } catch (err) {
      lastError = err;
    }
  }
  // No chargers mapped is not an error — return empty so parking still renders.
  if (lastError) console.warn("EV charging lookup failed, no chargers shown:", lastError);
  return [];
}
