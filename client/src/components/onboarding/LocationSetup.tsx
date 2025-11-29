import { motion } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';
import { useState } from 'react';
import { GoogleMapsWrapper } from '@/components/maps/GoogleMapsWrapper';
import { LocationSearch } from '@/components/maps/LocationSearch';
import EventMap from '@/components/maps/EventMap';
import { Button } from '@/components/ui/button';

interface LocationSetupProps {
  location: string;
  latitude: number;
  longitude: number;
  onLocationChange: (location: string, lat: number, lng: number) => void;
}

export function LocationSetup({
  location,
  latitude,
  longitude,
  onLocationChange,
}: LocationSetupProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();
            const address = data.results[0]?.formatted_address || 'Current Location';
            onLocationChange(address, latitude, longitude);
          } catch (error) {
            console.error('Error getting address:', error);
            onLocationChange('Current Location', latitude, longitude);
          }
          setIsGettingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsGettingLocation(false);
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Where are you based?</h2>
        <p className="text-gray-600 text-lg">We'll show you events and players nearby</p>
      </div>

      {/* Location Search */}
      <div className="space-y-4">
        <GoogleMapsWrapper>
          <LocationSearch
            placeholder="Enter your city or neighborhood"
            value={location}
            onLocationSelect={(loc) => {
              onLocationChange(loc.address, loc.lat, loc.lng);
            }}
          />
        </GoogleMapsWrapper>

        {/* Use Current Location Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleUseCurrentLocation}
          disabled={isGettingLocation}
          className="w-full h-12 rounded-2xl border-2 font-semibold hover:bg-gray-50"
        >
          <Navigation className="mr-2 h-5 w-5" />
          {isGettingLocation ? 'Getting location...' : 'Use Current Location'}
        </Button>
      </div>

      {/* Map Preview */}
      {latitude !== 0 && longitude !== 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-primary" />
            <p className="text-sm font-semibold text-gray-700">Your Location</p>
          </div>
          <div className="rounded-2xl overflow-hidden border-2 border-gray-200 h-64">
            <GoogleMapsWrapper>
              <EventMap
                latitude={latitude}
                longitude={longitude}
                address={location}
                height="100%"
                showMarker={true}
              />
            </GoogleMapsWrapper>
          </div>
        </motion.div>
      )}
    </div>
  );
}
