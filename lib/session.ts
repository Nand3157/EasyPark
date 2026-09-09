/** Parking session model: a "park now" timer with an expiry reminder. */

export interface ParkingSession {
  spotId: number;
  spotName: string;
  lat: number;
  lng: number;
  startedAt: number;
  endsAt: number;
  /** Fired the 15-minute warning already (survives reloads). */
  warned: boolean;
}

export const SESSION_KEY = "easypark:session";

export const SESSION_DURATIONS_MIN = [30, 60, 120, 240] as const;

export const WARNING_MS = 15 * 60 * 1000;

export function isParkingSession(v: unknown): v is ParkingSession {
  if (typeof v !== "object" || v === null) return false;
  const s = v as Record<string, unknown>;
  return (
    typeof s.spotId === "number" &&
    typeof s.spotName === "string" &&
    typeof s.lat === "number" &&
    typeof s.lng === "number" &&
    typeof s.startedAt === "number" &&
    typeof s.endsAt === "number" &&
    typeof s.warned === "boolean" &&
    s.endsAt > s.startedAt
  );
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return "Expired";
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m left`;
  return `${h}h ${m.toString().padStart(2, "0")}m left`;
}
