/** Google Maps universal URLs — no API key needed, always real data. */

/** Real parking results near a coordinate (Google Maps search). */
export function parkingSearchUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=parking+near+${lat},${lng}`;
}

/** Real parking results near a place name (fallback when coords missing). */
export function parkingSearchUrlForPlace(label: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`parking near ${label}`)}`;
}

/** Turn-by-turn directions to a coordinate. */
export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
