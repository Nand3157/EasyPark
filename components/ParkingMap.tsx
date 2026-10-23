'use client';

import React, { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Navigation, ExternalLink } from 'lucide-react';
import type { ParkingSpot } from '@/lib/parking';
import type { ChargingStation } from '@/lib/charging';

// Parent (`MapPanel`) already loads this via `next/dynamic(ssr:false)`,
// so static Leaflet imports are SSR-safe here and keep full types.
// Leaflet CSS is imported once in `app/globals.css`.

// CARTO basemaps require a free API key from https://carto.com/basemaps/apikey/
// Set NEXT_PUBLIC_CARTO_KEY in .env.local; falls back to OSM tiles without it.
const CARTO_KEY = process.env.NEXT_PUBLIC_CARTO_KEY;
const TILE_URL = CARTO_KEY
  ? `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`
  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

interface ParkingMapProps {
  mapCenter: [number, number];
  mapZoom: number;
  filteredSpots: ParkingSpot[];
  chargingStations: ChargingStation[];
  selectedSpotId: number | null;
  setSelectedSpotId: (id: number | null) => void;
}

// Fix bundled default-icon URLs (Next.js doesn't serve Leaflet's
// relative image paths). Harmless when only divIcons are used, but
// prevents broken 404 markers if a default Marker ever renders.
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

function markerIcon(isSelected: boolean, available: number) {
  const color = available < 10 ? '#ef4444' : '#3b82f6';
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
        <div style="
          background: ${isSelected ? '#ffffff' : '#0f172a'};
          color: ${isSelected ? '#000000' : '#ffffff'};
          border: 2px solid ${color};
          box-shadow: 0 0 15px ${color}88;
          border-radius: 9999px;
          padding: 4px 10px;
          font-weight: 700;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          transform: translate(-50%, -100%);
        ">
          <span style="background: ${color}; width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
          P (${available})
        </div>
      `,
    iconSize: [60, 30],
    iconAnchor: [30, 30],
    popupAnchor: [0, -28],
  });
}

function evIcon() {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
        <div style="
          background: #f59e0b;
          color: #0f172a;
          border: 2px solid #ffffff;
          box-shadow: 0 0 14px #f59e0b88;
          border-radius: 9999px;
          padding: 4px 10px;
          font-weight: 700;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          transform: translate(-50%, -100%);
        ">
          ⚡ EV
        </div>
      `,
    iconSize: [60, 30],
    iconAnchor: [30, 30],
    popupAnchor: [0, -28],
  });
}

export default function ParkingMap({
  mapCenter,
  mapZoom,
  filteredSpots,
  chargingStations,
  selectedSpotId,
  setSelectedSpotId,
}: ParkingMapProps) {
  // Rebuild icons only when selection changes — avoids N divIcon allocs per render.
  const icons = useMemo(() => {
    const cache = new Map<number, L.DivIcon>();
    for (const spot of filteredSpots) {
      cache.set(spot.id, markerIcon(selectedSpotId === spot.id, spot.available));
    }
    return cache;
  }, [filteredSpots, selectedSpotId]);

  const evDivIcon = useMemo(() => evIcon(), []);

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      scrollWheelZoom
      attributionControl
      className="h-full w-full"
      style={{ height: '100%', width: '100%', background: '#0f172a' }}
    >
      <MapController center={mapCenter} zoom={mapZoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={TILE_URL}
        maxZoom={19}
      />
      {filteredSpots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.lat, spot.lng]}
          icon={icons.get(spot.id)}
          eventHandlers={{
            click: () => setSelectedSpotId(spot.id),
          }}
        >
          <Popup>
            <div className="min-w-[210px] space-y-1.5 rounded-2xl border border-slate-700/80 bg-slate-900 p-4 text-white shadow-2xl">
              <h4 className="text-sm leading-snug font-bold text-white">{spot.name}</h4>
              {spot.source === 'live' ? (
                <p className="text-xs font-medium text-slate-300">
                  {spot.fee === 'free'
                    ? 'Free'
                    : spot.fee === 'paid'
                      ? 'Paid parking'
                      : 'Fee unknown'}
                  {spot.capacity != null && ` • ${spot.capacity} spaces`}
                  {` • ${spot.distance} walk`}
                </p>
              ) : (
                <p className="text-xs font-medium text-slate-300">
                  {spot.hourly} / hr • {spot.walkTime} walk
                </p>
              )}
              <div className="text-xs font-semibold text-blue-400">
                {spot.source === 'live' && spot.capacity == null
                  ? 'Real OSM lot — occupancy unavailable'
                  : `${spot.available} of ${spot.total} spots free`}
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2.5 text-center text-xs font-bold !text-white no-underline shadow-md transition-colors hover:bg-blue-500"
              >
                <Navigation size={13} className="text-white" />
                <span className="font-bold !text-white">Open in Google Maps</span>
                <ExternalLink size={12} className="text-white/80" />
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
      {chargingStations.map((ev) => (
        <Marker key={`ev-${ev.id}`} position={[ev.lat, ev.lng]} icon={evDivIcon}>
          <Popup>
            <div className="min-w-[210px] space-y-1.5 rounded-2xl border border-amber-600/25 bg-slate-900 p-4 text-white shadow-2xl">
              <h4 className="text-sm leading-snug font-bold text-white">{ev.name}</h4>
              <p className="text-xs font-medium text-amber-300">⚡ EV Charging · {ev.distance} · {ev.walkTime} walk</p>
              <p className="text-xs text-slate-300">
                {ev.operator ? `${ev.operator} · ` : ""}
                {ev.connectors.length ? ev.connectors.join(", ") : "Connector info unavailable"}
                {ev.fee ? ` · ${ev.fee === "free" ? "Free" : "Paid"}` : ""}
              </p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${ev.lat},${ev.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2.5 text-center text-xs font-bold !text-white no-underline shadow-md transition-colors hover:bg-amber-500"
              >
                <Navigation size={13} className="text-white" />
                <span className="font-bold !text-white">Charger directions</span>
                <ExternalLink size={12} className="text-white/80" />
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=EV+charging+near+${ev.lat},${ev.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full justify-center text-[11px] font-semibold text-amber-300 underline-offset-4 hover:underline"
              >
                More chargers on Google Maps
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
