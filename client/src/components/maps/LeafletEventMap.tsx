// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface EventMapProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  height?: string;
  className?: string;
  showMarker?: boolean;
  location?: string; // For backward compatibility with EventInfoBento
}

// Fix for default marker icon in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom blue marker icon
const customIcon = new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 9.375 12.5 28.125 12.5 28.125S25 21.875 25 12.5C25 5.596 19.404 0 12.5 0zm0 17.188a4.688 4.688 0 1 1 0-9.376 4.688 4.688 0 0 1 0 9.376z" fill="#3B82F6"/>
    </svg>
  `),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41],
});

// Component to update map view when coordinates change
function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 15);
    }
  }, [lat, lng, map]);

  return null;
}

const LeafletEventMap: React.FC<EventMapProps> = ({
  latitude,
  longitude,
  address,
  height = '300px',
  className = '',
  showMarker = true,
  location, // For backward compatibility
}) => {
  const mapRef = useRef<L.Map | null>(null);

  // Use location prop if address is not provided (backward compatibility)
  const displayAddress = address || location;

  // Default to center of map if no coordinates
  const defaultLat = latitude || 40.7128;
  const defaultLng = longitude || -74.006;
  const hasValidCoords = latitude && longitude && latitude !== 0 && longitude !== 0;

  // Fallback when coordinates are not available
  if (!hasValidCoords) {
    return (
      <div
        className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center p-4">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 font-medium">Map View</p>
          {displayAddress && (
            <p className="text-xs text-gray-500 mt-1 max-w-48">{displayAddress}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">Location coordinates needed</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden ${className}`} style={{ height }}>
      <MapContainer
        center={[defaultLat, defaultLng]}
        zoom={hasValidCoords ? 15 : 10}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater lat={defaultLat} lng={defaultLng} />

        {showMarker && hasValidCoords && (
          <Marker position={[latitude, longitude]} icon={customIcon}>
            {displayAddress && (
              <Popup>
                <div style={{ padding: '8px', minWidth: '200px' }}>
                  <div style={{ fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
                    📍 Event Location
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>{displayAddress}</div>
                </div>
              </Popup>
            )}
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default LeafletEventMap;
