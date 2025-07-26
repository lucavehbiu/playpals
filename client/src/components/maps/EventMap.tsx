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

    if (showMarker && latitude && longitude) {
      const marker = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: map,
        title: address || 'Event Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      setMarkerInstance(marker);

      // Add info window if address is available
      if (address) {
        const infoWindow = new google.maps.InfoWindow({
          content: `<div class="p-2"><strong>Event Location</strong><br/>${address}</div>`,
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