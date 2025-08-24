import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import '../../types/google-maps.d.ts';

interface EventMapProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  height?: string;
  className?: string;
  showMarker?: boolean;
}

const EventMap: React.FC<EventMapProps> = ({
  latitude,
  longitude,
  address,
  height = "300px",
  className = "",
  showMarker = true
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [markerInstance, setMarkerInstance] = useState<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    // Default to center of map if no coordinates
    const defaultLat = latitude || 40.7128;
    const defaultLng = longitude || -74.0060;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: defaultLat, lng: defaultLng },
      zoom: latitude && longitude ? 15 : 10,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });

    setMapInstance(map);

    // Clean up previous marker
    if (markerInstance) {
      markerInstance.setMap(null);
      setMarkerInstance(null);
    }

    if (showMarker && latitude && longitude) {
      const marker = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: map,
        title: address || 'Event Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#3B82F6"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 24),
        },
      });

      setMarkerInstance(marker);

      // Add info window if address is available
      if (address) {
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 200px;">
              <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">📍 Event Location</div>
              <div style="color: #6b7280; font-size: 14px;">${address}</div>
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      }
    }

    return () => {
      if (markerInstance) {
        markerInstance.setMap(null);
      }
    };
  }, [latitude, longitude, address, showMarker]);

  // Fallback when Google Maps is not available
  if (!window.google?.maps) {
    return (
      <div 
        className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 font-medium">Map View</p>
          {address && (
            <p className="text-xs text-gray-500 mt-1 max-w-48 truncate">{address}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">Google Maps API required</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ height }}
    />
  );
};

export default EventMap;