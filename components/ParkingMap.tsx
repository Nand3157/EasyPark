'use client';

import React, { useEffect, useState } from 'react';
import type LType from 'leaflet';
import type {
  MapContainerProps,
  TileLayerProps,
  MarkerProps,
  PopupProps,
} from 'react-leaflet';
import { Navigation, ExternalLink, Loader2 } from 'lucide-react';

interface ParkingSpot {
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

interface ParkingMapProps {
  mapCenter: [number, number];
  mapZoom: number;
  filteredSpots: ParkingSpot[];
  selectedSpotId: number | null;
  setSelectedSpotId: (id: number) => void;
}

function MapController({
  center,
  zoom,
  useMap,
}: {
  center: [number, number];
  zoom: number;
  useMap: () => LType.Map;
}) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function ParkingMap({
  mapCenter,
  mapZoom,
  filteredSpots,
  selectedSpotId,
  setSelectedSpotId,
}: ParkingMapProps) {
  const [mapComponents, setMapComponents] = useState<{
    L: typeof LType;
    MapContainer: React.ComponentType<MapContainerProps>;
    TileLayer: React.ComponentType<TileLayerProps>;
    Marker: React.ComponentType<MarkerProps>;
    Popup: React.ComponentType<PopupProps>;
    useMap: () => LType.Map;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      import('leaflet'),
      import('react-leaflet')
    ]).then(([leafletModule, reactLeafletModule]) => {
      setMapComponents({
        L: leafletModule.default || leafletModule,
        MapContainer: reactLeafletModule.MapContainer,
        TileLayer: reactLeafletModule.TileLayer,
        Marker: reactLeafletModule.Marker,
        Popup: reactLeafletModule.Popup,
        useMap: reactLeafletModule.useMap,
      });
    }).catch(err => {
      console.error('Failed to load map components:', err);
    });
  }, []);

  if (!mapComponents || typeof window === 'undefined') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950/80 rounded-[2.5rem]">
        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
          <Loader2 className="animate-spin" size={18} /> Initializing Interactive Map...
        </div>
      </div>
    );
  }

  const { L, MapContainer, TileLayer, Marker, Popup, useMap } = mapComponents;

  const createMarkerIcon = (isSelected: boolean, available: number) => {
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
    });
  };

  return (
    <MapContainer center={mapCenter} zoom={mapZoom} className="h-full w-full">
      <MapController center={mapCenter} zoom={mapZoom} useMap={useMap} />
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      {filteredSpots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.lat, spot.lng]}
          icon={createMarkerIcon(selectedSpotId === spot.id, spot.available)}
          eventHandlers={{
            click: () => setSelectedSpotId(spot.id),
          }}
        >
          <Popup>
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 min-w-[210px] space-y-1.5">
              <h4 className="font-bold text-sm text-white leading-snug">{spot.name}</h4>
              <p className="text-xs text-slate-300 font-medium">{spot.hourly} / hr • {spot.walkTime} walk</p>
              <div className="text-xs font-semibold text-blue-400">
                {spot.available} of {spot.total} spots free
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-1.5 w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 font-bold text-xs rounded-xl shadow-md transition-colors text-center no-underline !text-white"
                style={{ color: '#ffffff' }}
              >
                <Navigation size={13} className="text-white" />
                <span className="!text-white font-bold" style={{ color: '#ffffff' }}>Open in Google Maps</span>
                <ExternalLink size={12} className="text-white/80" />
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
