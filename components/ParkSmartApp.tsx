'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import DotField from './DotField';
import { SiteHeader } from './layout/site-header';
import { SiteFooter } from './layout/site-footer';
import { HeroSearch } from './sections/hero-search';
import { MapPanel } from './sections/map-panel';
import { SpotsSection } from './sections/spots-section';
import { Features } from './sections/features';
import { Process } from './sections/process';
import { Closing } from './sections/closing';
import { useIsMobile } from '@/hooks/use-mobile';
import { isNumberArray, isTheme, usePersistentState } from '@/hooks/use-persistent-state';
import { useParkingSession } from '@/hooks/use-parking-session';
import { useCrowd } from '@/hooks/use-crowd';
import { SessionBanner } from '@/components/parking/session-banner';
import {
  PRESET_LOCATIONS,
  applySpotFilter,
  type ParkingSpot,
} from '@/lib/parking';
import { haversineKm } from '@/lib/geo';
import { scrollToSection } from '@/lib/utils';
import { buildSpotUrl, parseSpotParams } from '@/lib/share';
import { fetchLiveParking } from '@/lib/overpass';
import { fetchChargingStations, type ChargingStation } from '@/lib/charging';
import { isBlockedError, resolveUserPosition, type LocateOutcome } from '@/lib/location';
import { CACHE_KEY, isLiveCache, isRecentList, MAX_RECENT, RECENT_KEY, type LiveCache, type RecentSearch } from '@/lib/recent';
// Venue type used via HeroSearch prop — keep import for rsc compatibility
import type { Venue } from '@/lib/venues';

export default function EasyParkApp() {
  const [theme, setTheme] = usePersistentState<'dark' | 'light'>('easypark:theme', 'dark', isTheme);
  const [searchQuery, setSearchQuery] = useState("");
  // Shared spot links (`?spot=<id>&lat&lng&z`) seed the initial view so no
  // effect-time setState is needed to honor them.
  const [sharedParams] = useState(() =>
    typeof window === "undefined" ? null : parseSpotParams(window.location.search)
  );
  const [currentLocationName, setCurrentLocationName] = useState("Bengaluru, Karnataka, India");
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    sharedParams ? [sharedParams.lat, sharedParams.lng] : [12.9716, 77.5946]
  );
  const [mapZoom, setMapZoom] = useState(sharedParams?.zoom ?? 14);
  const [parkingData, setParkingData] = useState<ParkingSpot[]>([]);
  const [activeFilter, setActiveFilter] = useState("Nearby");
  const [favorites, setFavorites] = usePersistentState<number[]>('easypark:favorites', [], isNumberArray);
  const [reservedIds, setReservedIds] = usePersistentState<number[]>('easypark:reservations', [], isNumberArray);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(sharedParams?.spotId ?? null);
  const [dataSource, setDataSource] = useState<"demo" | "live" | "demo-fallback">("live");
  const [chargingStations, setChargingStations] = useState<ChargingStation[]>([]);
  const { crowdMap, report: reportCrowd, now: crowdNow } = useCrowd();
  const [recentSearches, setRecentSearches] = usePersistentState<RecentSearch[]>(RECENT_KEY, [], isRecentList);
  const [liveCache] = usePersistentState<LiveCache | null>(CACHE_KEY, null, isLiveCache);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  // Heavy canvas ambience runs on desktop only, and never under reduced motion.
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();
  const showAmbience = !isMobile && !reduceMotion;
  const parkingSession = useParkingSession();

  const startParkingSession = useCallback(
    (spot: ParkingSpot) => {
      parkingSession.startSession(spot, 120);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parkingSession.startSession]
  );

  const toggleFavorite = (id: number) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const reserveSpot = (id: number) => {
    setReservedIds(prev => (prev.includes(id) ? prev : [...prev, id]));
  };

  const focusSpot = (spot: ParkingSpot) => {
    setMapCenter([spot.lat, spot.lng]);
    setMapZoom(16);
    setSelectedSpotId(spot.id);
    try {
      window.history.replaceState(null, "", buildSpotUrl(spot, 16));
    } catch {
      // URL update is best-effort.
    }
    scrollToSection("map");
  };

  const goToFilter = (filter: string) => {
    setActiveFilter(filter);
    scrollToSection("spots");
  };

  const pushRecent = useCallback((query: string, label: string, lat: number, lng: number) => {
    if (!query.trim()) return;
    setRecentSearches((prev) => {
      const next: RecentSearch[] = [{ query: query.trim(), label, lat, lng, at: Date.now() }, ...prev.filter((r) => r.query.toLowerCase() !== query.trim().toLowerCase())];
      return next.slice(0, MAX_RECENT);
    });
  }, [setRecentSearches]);

  // Load spots for an area: real OpenStreetMap lots + EV chargers together.
  // No fake inventory — on failure we try a cached result, else empty + Google CTA.
  const loadSpots = useCallback(async (lat: number, lng: number, label: string, zoom = 14, queryForRecent?: string) => {
    setMapCenter([lat, lng]);
    setMapZoom(zoom);
    setCurrentLocationName(label);
    setOfflineNotice(null);
    if (queryForRecent) pushRecent(queryForRecent, label, lat, lng);
    try {
      const [live, chargers] = await Promise.all([
        fetchLiveParking(lat, lng),
        fetchChargingStations(lat, lng),
      ]);
      setParkingData(live);
      setChargingStations(chargers);
      setDataSource("live");
      try {
        const cache: LiveCache = { lat, lng, label, spots: live, chargers, at: Date.now() };
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      } catch {
        // Cache is best-effort.
      }
    } catch (err) {
      console.error("Live parking lookup failed:", err);
      // Offline fallback: reuse cached live result if it's nearby (≈ within 2km).
      try {
        const raw = window.localStorage.getItem(CACHE_KEY);
        if (raw) {
          const cached = JSON.parse(raw) as LiveCache;
          if (isLiveCache(cached) && haversineKm(cached.lat, cached.lng, lat, lng) < 2) {
            setParkingData(cached.spots);
            setChargingStations(cached.chargers ?? []);
            setDataSource("live");
            setOfflineNotice(`Offline — showing cached results from ${new Date(cached.at).toLocaleTimeString()} for ${cached.label}.`);
            return;
          }
        }
      } catch {
        // Ignore cache read errors.
      }
      setParkingData([]);
      setChargingStations([]);
      setDataSource("demo-fallback");
    }
  }, [pushRecent]);

  const handleSearch = async (queryToSearch: string) => {
    const trimmed = queryToSearch.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setSearchError(null);

    const lower = trimmed.toLowerCase();

    const presetKey = Object.keys(PRESET_LOCATIONS).find(key => lower.includes(key));
    if (presetKey) {
      const loc = PRESET_LOCATIONS[presetKey];
      await loadSpots(loc.lat, loc.lng, loc.name, 14, trimmed);
      setIsSearching(false);
      return;
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=1`, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await res.json();

      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const displayName = item.display_name || trimmed;
        await loadSpots(lat, lng, displayName, 14, trimmed);
      } else {
        setSearchError(`No coordinates found for "${trimmed}". Try "Vadodara", "Mumbai" or "London".`);
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      setSearchError("Failed to fetch location. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Locate the user: GPS first, IP approximation on transient GPS failure.
  // Reports "blocked" for hard blocks so auto-locate never re-prompts.
  const locateUser = useCallback(async (mode: "auto" | "manual"): Promise<LocateOutcome> => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const pos = await resolveUserPosition(mode === "manual");
      if (pos.method === "ip") {
        const label = pos.city ? `Approximate Location (${pos.city})` : "Approximate Location";
        await loadSpots(pos.lat, pos.lng, label, 12);
      } else {
        await loadSpots(pos.lat, pos.lng, "Your Current Location", 15);
      }
      return "ok";
    } catch (err) {
      console.error("Location error:", err);
      setSearchError(err instanceof Error ? err.message : "Could not determine your location.");
      return isBlockedError(err) ? "blocked" : "ok";
    } finally {
      setIsSearching(false);
    }
  }, [loadSpots]);

  const handleCurrentLocation = () => {
    void locateUser("manual");
  };

  const filteredSpots = applySpotFilter(parkingData, activeFilter);

  // On first paint, try to locate the user for real nearby lots.
  // Repeats every visit unless the browser hard-blocked the request.
  // A shared spot link loads lots around its coordinates instead.
  const autoLocateAttempted = useRef(false);
  useEffect(() => {
    if (autoLocateAttempted.current) return;
    autoLocateAttempted.current = true;
    if (sharedParams) {
      // Mount-time data fetch for shared links (async fetch → setState in the
      // callback, not a render cascade). Matches the locateUser pattern below.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadSpots(sharedParams.lat, sharedParams.lng, "Shared location", sharedParams.zoom);
      return;
    }
    let blocked = false;
    try {
      blocked = window.localStorage.getItem("easypark:geo-blocked") === "1";
    } catch {
      // Storage unavailable — still attempt once per mount.
    }
    if (blocked) return;
    void locateUser("auto").then((outcome) => {
      if (outcome === "blocked") {
        try {
          window.localStorage.setItem("easypark:geo-blocked", "1");
        } catch {
          // Storage unavailable — nothing to remember.
        }
      }
    });
  }, [locateUser, loadSpots, sharedParams]);

  return (
    <div id="top" className={theme}>
      <div className="relative min-h-screen w-full overflow-x-clip bg-slate-50 font-sans text-slate-950 transition-colors duration-300 selection:bg-blue-600/20 dark:bg-slate-950 dark:text-white dark:selection:bg-blue-500/30">
        {/* Ambient background: single quiet glow + optional interactive dot field */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgb(186_230_253/0.55),transparent_70%)] dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgb(30_58_138/0.35),transparent_70%)]" />
          {showAmbience && (
            <div className="absolute inset-0 overflow-hidden opacity-40">
              <DotField
                dotRadius={1.5}
                dotSpacing={16}
                bulgeStrength={36}
                glowRadius={160}
                sparkle={false}
                waveAmplitude={0}
                cursorRadius={300}
                cursorForce={0.06}
                gradientFrom="rgba(96, 165, 250, 0.5)"
                gradientTo="rgba(168, 85, 247, 0.35)"
                glowColor="rgba(30, 58, 138, 0.2)"
              />
            </div>
          )}
        </div>

        <SiteHeader
          isLight={theme === 'light'}
          onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        />

        <main id="content" className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-10">
          <HeroSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
            isSearching={isSearching}
            searchError={searchError}
            currentLocationName={currentLocationName}
            activeFilter={activeFilter}
            onSelectFilter={setActiveFilter}
            venuesOnPick={(v) => void loadSpots(v.lat, v.lng, `${v.name}, ${v.city}`, 15, v.name)}
            recents={recentSearches}
            onRecentPick={(r) => void loadSpots(r.lat, r.lng, r.label, 14, r.query)}
            onRecentClear={() => setRecentSearches([])}
          />

          {offlineNotice && (
            <div role="status" className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-center text-sm font-medium text-amber-700 dark:text-amber-300">
              {offlineNotice}
            </div>
          )}

          <MapPanel
            mapCenter={mapCenter}
            mapZoom={mapZoom}
            filteredSpots={filteredSpots}
            chargingStations={chargingStations}
            selectedSpotId={selectedSpotId}
            onSelectSpot={setSelectedSpotId}
            locationName={currentLocationName}
            activeFilter={activeFilter}
            onSelectFilter={goToFilter}
            onLocate={handleCurrentLocation}
            locating={isSearching}
            dataSource={dataSource}
          />

          {liveCache && dataSource === "demo-fallback" && haversineKm(liveCache.lat, liveCache.lng, mapCenter[0], mapCenter[1]) < 2 && (
            <div role="status" className="mb-6 rounded-3xl border border-slate-950/10 bg-white/70 px-5 py-3 text-center text-sm dark:border-white/10 dark:bg-white/5">
              <span className="t-secondary">Showing last cached results for </span>
              <strong className="text-slate-950 dark:text-white">{liveCache.label}</strong>
              <span className="t-secondary"> from {new Date(liveCache.at).toLocaleTimeString()} — </span>
              <a href={`https://www.google.com/maps/search/?api=1&query=parking+near+${liveCache.lat},${liveCache.lng}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 underline-offset-4 hover:underline dark:text-blue-400">open in Google Maps</a>
            </div>
          )}

          {chargingStations.length > 0 && (
            <section aria-label="EV chargers nearby" className="mb-10">
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">⚡ EV charging nearby</h2>
                <span className="t-tertiary text-xs">{chargingStations.length} real stations · OSM{chargingStations[0]?.source === "ocm" ? " + OpenChargeMap" : ""}</span>
              </div>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {chargingStations.slice(0, 6).map((ev) => (
                  <li key={ev.id} className="surface flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{ev.name}</p>
                      <p className="t-tertiary text-xs">{ev.distance} · {ev.walkTime} walk{ev.operator ? ` · ${ev.operator}` : ""}</p>
                      {ev.connectors.length > 0 && <p className="t-tertiary text-xs truncate">{ev.connectors.join(", ")}</p>}
                    </div>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${ev.lat},${ev.lng}`} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white hover:bg-amber-600">Directions</a>
                  </li>
                ))}
              </ul>
              {chargingStations.length > 6 && (
                <p className="t-tertiary mt-3 text-center text-xs">+ {chargingStations.length - 6} more on the map (orange ⚡ markers)</p>
              )}
            </section>
          )}

          <SpotsSection
            spots={filteredSpots}
            locationName={currentLocationName}
            mapCenter={mapCenter}
            activeFilter={activeFilter}
            selectedId={selectedSpotId}
            favorites={favorites}
            reservedIds={reservedIds}
            crowdMap={crowdMap}
            crowdNow={crowdNow}
            onToggleFavorite={toggleFavorite}
            onFocusSpot={focusSpot}
            onReserve={reserveSpot}
            onStartSession={startParkingSession}
            onCrowdReport={reportCrowd}
            dataSource={dataSource}
          />

          <Features />
          <Process />
          <Closing />
          <SiteFooter onSelectFilter={goToFilter} />
        </main>
        <SessionBanner {...parkingSession} />
      </div>
    </div>
  );
}
