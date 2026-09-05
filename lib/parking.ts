export interface ParkingSpot {
  id: number;
  name: string;
  distance: string;
  walkTime: string;
  hourly: string;
  hourlyNum: number;
  daily: string;
  rating: number;
  available: number;
  total: number;
  features: string[];
  lat: number;
  lng: number;
}

export interface PresetLocation {
  lat: number;
  lng: number;
  name: string;
}

/** Instant matches so popular cities resolve without a network round-trip. */
export const PRESET_LOCATIONS: Record<string, PresetLocation> = {
  vadodara: { lat: 22.3072, lng: 73.1812, name: "Vadodara, Gujarat, India" },
  mumbai: { lat: 19.076, lng: 72.8777, name: "Mumbai, Maharashtra, India" },
  bengaluru: { lat: 12.9716, lng: 77.5946, name: "Bengaluru, Karnataka, India" },
  bangalore: { lat: 12.9716, lng: 77.5946, name: "Bengaluru, Karnataka, India" },
  delhi: { lat: 28.6139, lng: 77.209, name: "New Delhi, India" },
  ahmedabad: { lat: 23.0225, lng: 72.5714, name: "Ahmedabad, Gujarat, India" },
  pune: { lat: 18.5204, lng: 73.8567, name: "Pune, Maharashtra, India" },
  hyderabad: { lat: 17.385, lng: 78.4867, name: "Hyderabad, Telangana, India" },
  london: { lat: 51.5074, lng: -0.1278, name: "London, United Kingdom" },
  "new york": { lat: 40.7128, lng: -74.006, name: "New York, NY, USA" },
};

export const INITIAL_SPOTS: ParkingSpot[] = [
  { id: 1, name: "Central Plaza Parking", distance: "0.4 km", walkTime: "5 min", hourly: "₹40", hourlyNum: 40, daily: "₹250", rating: 4.8, available: 18, total: 120, features: ["EV", "Covered", "24h"], lat: 12.9716, lng: 77.5946 },
  { id: 2, name: "Skyview Garage", distance: "0.8 km", walkTime: "10 min", hourly: "₹60", hourlyNum: 60, daily: "₹400", rating: 4.5, available: 5, total: 80, features: ["Valet", "Secure"], lat: 12.975, lng: 77.59 },
  { id: 3, name: "Green Park Lot", distance: "1.2 km", walkTime: "15 min", hourly: "₹30", hourlyNum: 30, daily: "₹200", rating: 4.2, available: 45, total: 150, features: ["EV", "Handicap"], lat: 12.968, lng: 77.599 },
  { id: 4, name: "Metro Station Hub", distance: "0.2 km", walkTime: "2 min", hourly: "₹50", hourlyNum: 50, daily: "₹300", rating: 4.9, available: 12, total: 200, features: ["Secure", "24h"], lat: 12.972, lng: 77.593 },
  { id: 5, name: "The Grand Mall", distance: "1.5 km", walkTime: "18 min", hourly: "₹70", hourlyNum: 70, daily: "₹500", rating: 4.7, available: 32, total: 300, features: ["Valet", "Covered", "EV"], lat: 12.978, lng: 77.596 },
  { id: 6, name: "Business District B1", distance: "0.6 km", walkTime: "8 min", hourly: "₹45", hourlyNum: 45, daily: "₹280", rating: 4.4, available: 8, total: 50, features: ["Secure", "Handicap"], lat: 12.97, lng: 77.591 },
];

export const FILTERS = [
  "Nearby",
  "Cheapest",
  "Open Now",
  "EV Charging",
  "Covered Parking",
  "Handicap Access",
  "24 Hours",
  "Valet",
  "Secure Parking",
];

export const POPULAR_CITIES = ["Vadodara", "Mumbai", "Delhi", "Bengaluru", "London", "New York"];

interface SpotTemplate {
  title: string;
  dist: string;
  walk: string;
  hourly: number;
  daily: number;
  feat: string[];
  avail: number;
  total: number;
  offLat: number;
  offLng: number;
}

const SPOT_TEMPLATES: SpotTemplate[] = [
  { title: "Central Plaza", dist: "0.3 km", walk: "4 min", hourly: 40, daily: 250, feat: ["EV", "Covered", "24h"], avail: 18, total: 100, offLat: 0.002, offLng: 0.003 },
  { title: "Metro Hub Parking", dist: "0.5 km", walk: "6 min", hourly: 35, daily: 220, feat: ["Secure", "24h"], avail: 24, total: 150, offLat: -0.003, offLng: 0.002 },
  { title: "Skyline Tower Garage", dist: "0.8 km", walk: "10 min", hourly: 60, daily: 400, feat: ["Valet", "Secure", "EV"], avail: 8, total: 80, offLat: 0.005, offLng: -0.004 },
  { title: "Grand Galleria Parking", dist: "1.1 km", walk: "14 min", hourly: 50, daily: 320, feat: ["Covered", "Handicap"], avail: 32, total: 200, offLat: -0.004, offLng: -0.005 },
  { title: "Station Express Park", dist: "0.2 km", walk: "3 min", hourly: 30, daily: 180, feat: ["24h", "Secure"], avail: 4, total: 60, offLat: 0.001, offLng: -0.002 },
  { title: "Civic Center Underground", dist: "1.4 km", walk: "17 min", hourly: 45, daily: 280, feat: ["EV", "Covered", "Handicap"], avail: 50, total: 250, offLat: -0.006, offLng: 0.006 },
];

/**
 * Demo inventory generator: deterministic mock listings around a coordinate.
 * Swap with a real parking API later — call sites only depend on ParkingSpot[].
 */
export function generateSpotsForLocation(lat: number, lng: number, placeName: string): ParkingSpot[] {
  const cityName = placeName.split(",")[0].trim();
  return SPOT_TEMPLATES.map((s, idx) => ({
    id: idx + 101,
    name: `${cityName} ${s.title}`,
    distance: s.dist,
    walkTime: s.walk,
    hourly: `₹${s.hourly}`,
    hourlyNum: s.hourly,
    daily: `₹${s.daily}`,
    rating: Number((4.3 + ((idx * 0.1) % 0.6)).toFixed(1)),
    available: s.avail,
    total: s.total,
    features: s.feat,
    lat: lat + s.offLat,
    lng: lng + s.offLng,
  }));
}

export function applySpotFilter(spots: ParkingSpot[], activeFilter: string): ParkingSpot[] {
  const filtered = spots.filter((spot) => {
    if (activeFilter === "EV Charging") return spot.features.includes("EV");
    if (activeFilter === "Covered Parking") return spot.features.includes("Covered");
    if (activeFilter === "Handicap Access") return spot.features.includes("Handicap");
    if (activeFilter === "24 Hours") return spot.features.includes("24h");
    if (activeFilter === "Valet") return spot.features.includes("Valet");
    if (activeFilter === "Secure Parking") return spot.features.includes("Secure");
    if (activeFilter === "Open Now") return spot.available > 0;
    return true;
  });
  if (activeFilter === "Cheapest") return [...filtered].sort((a, b) => a.hourlyNum - b.hourlyNum);
  return filtered;
}
