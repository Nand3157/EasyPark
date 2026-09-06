# EasyPark — Smart Parking Discovery

Find, compare, and navigate to parking spots with live maps, real-time availability vibes, and a premium liquid-glass UI.

![Next.js](https://img.shields.io/badge/Next.js-15-black) ![React](https://img.shields.io/badge/React-19-blue) ![Leaflet](https://img.shields.io/badge/Maps-Leaflet%20%2B%20OpenStreetMap-green) ![Tailwind](https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8)

## What it does

- **Location search** — type any city/place (e.g. "Vadodara", "Mumbai", "London"). Instant matches for popular Indian cities + worldwide geocoding via OpenStreetMap Nominatim.
- **GPS locate-me** — one click centers the map on your current position using the browser geolocation API.
- **Interactive live map** — Leaflet + react-leaflet with custom markers, popups, auto re-centering, and external navigation links (Google Maps).
- **Smart filters & sorting** — Nearby, Cheapest, Open Now, EV Charging, Covered, Handicap Access, 24 Hours, Valet, Secure.
- **Spot cards** — demo spots show hourly/daily pricing (₹), ratings and availability; real OSM lots show fee status, capacity and operator instead. Favorites and reservations persist in localStorage.
- **Dark / light mode** — full theme switcher with animated gradients, glowing orbs, dot-field canvas background, and video backdrop.
- **Motion-rich UI** — spring hover cards, scroll reveals, animated borders (BorderGlow), custom DotField canvas.

> **Data:** on first visit the app asks for your location and loads **real nearby lots from OpenStreetMap** (Overpass API, `lib/overpass.ts`) — names, positions, capacity and fee tags within 3 km. OSM has no live occupancy feed, so availability counts appear only on demo spots; if the live lookup fails you'll see clearly-labelled demo placeholders (`generateSpotsForLocation` in `lib/parking.ts`).

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Maps | Leaflet + react-leaflet, OSM tiles, Nominatim geocoding |
| Styling | Tailwind CSS 4, custom liquid-glass utilities, tw-animate-css |
| Motion | `motion` (framer-motion successor), canvas DotField |
| Icons | lucide-react |
| AI SDK (installed, optional) | `@google/genai` — env-plumbed but no AI features wired in the UI yet |

## Getting started

**Prerequisites:** Node.js 20+ and npm.

```bash
# 1. Install dependencies
npm install

# 2. Configure env (optional for now)
cp .env.example .env.local
# edit .env.local — see "Environment variables" below

# 3. Run dev server
npm run dev
```

Open http://localhost:3000

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |

## Environment variables

| Variable | Required? | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | No (future) | Reserved for Gemini AI calls; SDK is installed but unused in current UI. AI Studio injects this at runtime when enabled. |
| `APP_URL` | No | Base URL for callbacks/links when hosted (e.g. Cloud Run). |

See [.env.example](.env.example).

## Project structure

```
app/
  layout.tsx      # metadata, global CSS
  page.tsx        # renders ClientApp
  globals.css     # Tailwind + glass utilities
components/
  ParkSmartApp.tsx # main app: search, filters, spots, theme
  ParkingMap.tsx   # Leaflet map (client-only, dynamically imported)
  ClientApp.tsx    # SSR-safe dynamic wrapper with loader
  DotField.tsx     # interactive canvas background
  BorderGlow.tsx   # animated gradient border wrapper
hooks/ lib/        # small utilities (mobile hook, cn helper)
```

Key flows:
- `handleSearch()` → preset match → else Nominatim fetch → `generateSpotsForLocation()` → updates `mapCenter` + cards.
- `handleCurrentLocation()` → `navigator.geolocation` → same mock-spot generation.
- Map is `ssr: false` via `next/dynamic` to avoid window/Leaflet SSR issues.

## Deploy

Standard Next.js app — deploy anywhere Node runs:

```bash
npm run build
npm run start
```

Works on Vercel, Cloud Run, or any Node host. No server secrets required for the current feature set.

## License

No license specified yet. Add one (e.g. MIT) if you plan to open-source.
