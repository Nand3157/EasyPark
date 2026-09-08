'use client';

import React, { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Navigation, ExternalLink } from 'lucide-react';
import type { ParkingSpot } from '@/lib/parking';

// Parent (`MapPanel`) already loads this via `next/dynamic(ssr:false)`,
// so static Leaflet imports are SSR-safe here and keep full types.
// Leaflet CSS is imported once in `app/globals.css`.

interface ParkingMapProps {
  mapCenter: [number, number];
  mapZoom: number;
  filteredSpots: ParkingSpot[];
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

export default function ParkingMap({
  mapCenter,
  mapZoom,
  filteredSpots,
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
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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
    </MapContainer>
  );
}
