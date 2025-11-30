// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Calendar, Clock } from 'lucide-react';
import { Event } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Link } from 'wouter';
import 'leaflet/dist/leaflet.css';

interface EventsMapProps {
  events: Event[];
  height?: string;
  className?: string;
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

// Component to handle map view updates
function MapController({ center, zoom }: { center: [number, number] | null; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, {
        duration: 1.5,
        easeLinearity: 0.25,
      });
    }
  }, [center, zoom, map]);

  return null;
}

const EventsMap: React.FC<EventsMapProps> = ({
  events,
  height = 'calc(100vh - 200px)',
  className = '',
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [zoomLevel, setZoomLevel] = useState(13);
  const [isLocating, setIsLocating] = useState(false);

  // Filter events that have coordinates
  const eventsWithCoords = events.filter(
    (event) => event.locationCoordinates?.lat && event.locationCoordinates?.lng
  );

  // Attempt to get user's location on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Only set if we haven't already set a center (e.g. from events)
          // Or if we want to prioritize user location (which we do per request)
          setMapCenter([position.coords.latitude, position.coords.longitude]);
          setZoomLevel(14);
        },
        (error) => {
          console.log('Location access denied or failed, falling back to default', error);
          // Fallback to first event or default
          if (eventsWithCoords.length > 0 && eventsWithCoords[0].locationCoordinates) {
            setMapCenter([
              eventsWithCoords[0].locationCoordinates.lat,
              eventsWithCoords[0].locationCoordinates.lng,
            ]);
          } else {
            setMapCenter([40.7128, -74.006]);
          }
        }
      );
    } else {
      // No geolocation support, fallback
      if (eventsWithCoords.length > 0 && eventsWithCoords[0].locationCoordinates) {
        setMapCenter([
          eventsWithCoords[0].locationCoordinates.lat,
          eventsWithCoords[0].locationCoordinates.lng,
        ]);
      } else {
        setMapCenter([40.7128, -74.006]);
      }
    }
  }, []); // Run once on mount

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
          setZoomLevel(14);
          setIsLocating(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLocating(false);
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  return (
    <div
      className={`relative rounded-3xl overflow-hidden shadow-sm border border-gray-100 ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={mapCenter || [40.7128, -74.006]}
        zoom={zoomLevel}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController center={mapCenter} zoom={zoomLevel} />

        {eventsWithCoords.map((event) => (
          <Marker
            key={event.id}
            position={[event.locationCoordinates!.lat, event.locationCoordinates!.lng]}
            icon={customIcon}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[200px]">
                <div className="font-bold text-sm mb-1 line-clamp-1">{event.title}</div>
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <Calendar className="w-3 h-3 mr-1" />
                  {format(new Date(event.date), 'MMM d, h:mm a')}
                </div>
                <div className="flex items-center text-xs text-gray-500 mb-3">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span className="line-clamp-1">{event.location.split(',')[0]}</span>
                </div>
                <Link href={`/events/${event.id}`}>
                  <Button size="sm" className="w-full h-8 text-xs">
                    View Details
                  </Button>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Controls */}
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full shadow-lg bg-white hover:bg-gray-50 text-gray-700"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
        >
          <Navigation className={`h-5 w-5 ${isLocating ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
};

export default EventsMap;
