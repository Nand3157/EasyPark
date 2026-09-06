/**
 * User locating with graceful degradation:
 *   1. Device GPS (retried: precise first, then fast coarse fix)
 *   2. IP-based approximation (ipwho.is, free + CORS-enabled)
 * Explicit denial / unsupported browsers are respected (no silent IP locate);
 * every other failure surfaces a human-readable message.
 */

export interface UserPosition {
  lat: number;
  lng: number;
  /** GPS fix accuracy in meters, or null for IP approximations. */
  accuracy: number | null;
  method: "gps" | "ip";
  /** City hint from the IP lookup, when available. */
  city?: string;
}

export type LocateOutcome = "ok" | "blocked";

export class LocationError extends Error {
  code: "unsupported" | "denied" | "unavailable" | "timeout";
  constructor(code: LocationError["code"], message: string) {
    super(message);
    this.name = "LocationError";
    this.code = code;
  }
}

function gpsOnce(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(
        new LocationError("unsupported", "Geolocation is not supported by this browser.")
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, (err) => {
      if (err.code === err.PERMISSION_DENIED) {
        reject(
          new LocationError(
            "denied",
            "Location access is blocked. Allow it in your browser's site settings (lock icon in the address bar), then tap the locate button again."
          )
        );
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        reject(
          new LocationError(
            "unavailable",
            "Your device couldn't get a fix. Turn on Wi-Fi or move near a window, then try again."
          )
        );
      } else {
        reject(
          new LocationError(
            "timeout",
            "Locating timed out. Make sure Wi-Fi/location services are on, then try again."
          )
        );
      }
    }, options);
  });
}

async function getGpsPosition(precise: boolean): Promise<UserPosition> {
  // Manual taps get a precise attempt plus a coarse retry; the automatic
  // first-visit attempt goes straight for the fast coarse fix.
  const attempts: PositionOptions[] = precise
    ? [
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
      ]
    : [{ enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }];

  let lastError: unknown = null;
  for (const options of attempts) {
    try {
      const pos = await gpsOnce(options);
      return {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? null,
        method: "gps",
      };
    } catch (err) {
      lastError = err;
      // Don't retry (or IP-locate) an explicit denial / unsupported browser.
      if (
        err instanceof LocationError &&
        (err.code === "denied" || err.code === "unsupported")
      ) {
        throw err;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Unable to determine your location.");
}

interface IpWhoResponse {
  success?: boolean;
  latitude?: number;
  longitude?: number;
  city?: string;
  message?: string;
}

async function getIpPosition(): Promise<UserPosition> {
  const res = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`IP lookup failed (${res.status})`);
  const json = (await res.json()) as IpWhoResponse;
  if (
    json.success === false ||
    typeof json.latitude !== "number" ||
    typeof json.longitude !== "number"
  ) {
    throw new Error(json.message ?? "IP lookup returned no coordinates.");
  }
  return {
    lat: json.latitude,
    lng: json.longitude,
    accuracy: null,
    method: "ip",
    city: json.city || undefined,
  };
}

export function isBlockedError(err: unknown): boolean {
  return (
    err instanceof LocationError && (err.code === "denied" || err.code === "unsupported")
  );
}

/**
 * Resolve the user's position: GPS first, IP approximation as fallback for
 * transient GPS failures (timeout / unavailable). Throws LocationError with
 * a user-facing message when nothing works.
 */
export async function resolveUserPosition(precise: boolean): Promise<UserPosition> {
  try {
    return await getGpsPosition(precise);
  } catch (gpsErr) {
    if (isBlockedError(gpsErr)) throw gpsErr;
    try {
      return await getIpPosition();
    } catch {
      throw gpsErr;
    }
  }
}
