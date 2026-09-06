'use client';

import React, { useState } from 'react';
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
import {
  INITIAL_SPOTS,
  PRESET_LOCATIONS,
  applySpotFilter,
  generateSpotsForLocation,
  type ParkingSpot,
} from '@/lib/parking';
import { scrollToSection } from '@/lib/utils';

export default function EasyParkApp() {
  const [theme, setTheme] = usePersistentState<'dark' | 'light'>('easypark:theme', 'dark', isTheme);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentLocationName, setCurrentLocationName] = useState("Bengaluru, Karnataka, India");
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.9716, 77.5946]);
  const [mapZoom, setMapZoom] = useState(14);
  const [parkingData, setParkingData] = useState<ParkingSpot[]>(INITIAL_SPOTS);
  const [activeFilter, setActiveFilter] = useState("Nearby");
  const [favorites, setFavorites] = usePersistentState<number[]>('easypark:favorites', [], isNumberArray);
  const [reservedIds, setReservedIds] = usePersistentState<number[]>('easypark:reservations', [], isNumberArray);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);

  // Heavy canvas ambience runs on desktop only, and never under reduced motion.
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();
  const showAmbience = !isMobile && !reduceMotion;

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
    scrollToSection("map");
  };

  const goToFilter = (filter: string) => {
    setActiveFilter(filter);
    scrollToSection("spots");
  };

  const handleSearch = async (queryToSearch: string) => {
    const trimmed = queryToSearch.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setSearchError(null);

    const lower = trimmed.toLowerCase();

    const presetKey = Object.keys(PRESET_LOCATIONS).find(key => lower.includes(key));
    if (presetKey) {
      const loc = PRESET_LOCATIONS[presetKey];
      setMapCenter([loc.lat, loc.lng]);
      setMapZoom(14);
      setCurrentLocationName(loc.name);
      setParkingData(generateSpotsForLocation(loc.lat, loc.lng, loc.name));
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

        setMapCenter([lat, lng]);
        setMapZoom(14);
        setCurrentLocationName(displayName);
        setParkingData(generateSpotsForLocation(lat, lng, displayName));
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

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSearchError("Geolocation is not supported by your browser.");
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const label = "Your Current Location";
        setMapCenter([lat, lng]);
        setMapZoom(15);
        setCurrentLocationName(label);
        setParkingData(generateSpotsForLocation(lat, lng, label));
        setIsSearching(false);
      },
      (err) => {
        console.error("GPS error:", err);
        setSearchError("Could not access your location. Please check browser permissions.");
        setIsSearching(false);
      },
      { timeout: 10000 }
    );
  };

  const filteredSpots = applySpotFilter(parkingData, activeFilter);

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
          />

          <SpotsSection
            spots={filteredSpots}
            locationName={currentLocationName}
            activeFilter={activeFilter}
            selectedId={selectedSpotId}
            favorites={favorites}
            reservedIds={reservedIds}
            onToggleFavorite={toggleFavorite}
            onFocusSpot={focusSpot}
            onReserve={reserveSpot}
          />

          <Features />
          <Process />
          <Closing />
          <SiteFooter onSelectFilter={goToFilter} />
        </main>
      </div>
    </div>
  );
}
