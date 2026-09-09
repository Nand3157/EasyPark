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
import { SessionBanner } from '@/components/parking/session-banner';
import {
  PRESET_LOCATIONS,
  applySpotFilter,
  type ParkingSpot,
} from '@/lib/parking';
import { scrollToSection } from '@/lib/utils';
import { buildSpotUrl, parseSpotParams } from '@/lib/share';
import { fetchLiveParking } from '@/lib/overpass';
import { isBlockedError, resolveUserPosition, type LocateOutcome } from '@/lib/location';

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

  // Load spots for an area: real OpenStreetMap lots only.
  // No fake inventory — on failure we show empty + a Google Maps CTA.
  const loadSpots = useCallback(async (lat: number, lng: number, label: string, zoom = 14) => {
    setMapCenter([lat, lng]);
    setMapZoom(zoom);
    setCurrentLocationName(label);
    try {
      const live = await fetchLiveParking(lat, lng);
      setParkingData(live);
      setDataSource("live");
    } catch (err) {
      console.error("Live parking lookup failed:", err);
      setParkingData([]);
      setDataSource("demo-fallback");
    }
  }, []);

  const handleSearch = async (queryToSearch: string) => {
    const trimmed = queryToSearch.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setSearchError(null);

    const lower = trimmed.toLowerCase();

    const presetKey = Object.keys(PRESET_LOCATIONS).find(key => lower.includes(key));
    if (presetKey) {
      const loc = PRESET_LOCATIONS[presetKey];
      await loadSpots(loc.lat, loc.lng, loc.name);
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
        await loadSpots(lat, lng, displayName);
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
          />

          <MapPanel
            mapCenter={mapCenter}
            mapZoom={mapZoom}
            filteredSpots={filteredSpots}
            selectedSpotId={selectedSpotId}
            onSelectSpot={setSelectedSpotId}
            locationName={currentLocationName}
            activeFilter={activeFilter}
            onSelectFilter={goToFilter}
            onLocate={handleCurrentLocation}
            locating={isSearching}
            dataSource={dataSource}
          />

          <SpotsSection
            spots={filteredSpots}
            locationName={currentLocationName}
            mapCenter={mapCenter}
            activeFilter={activeFilter}
            selectedId={selectedSpotId}
            favorites={favorites}
            reservedIds={reservedIds}
            onToggleFavorite={toggleFavorite}
            onFocusSpot={focusSpot}
            onReserve={reserveSpot}
            onStartSession={startParkingSession}
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
