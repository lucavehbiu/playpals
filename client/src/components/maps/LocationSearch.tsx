import React, { useRef, useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Search } from 'lucide-react';
import '../../types/google-maps.d.ts';

interface LocationResult {
  placeId: string;
  address: string;
  lat: number;
  lng: number;
  name?: string;
}

interface LocationSearchProps {
  onLocationSelect: (location: LocationResult) => void;
  placeholder?: string;
  value?: string;
  className?: string;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelect,
  placeholder = "Search for a location...",
  value = "",
  className = ""
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const initializeAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;

    try {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          fields: ['place_id', 'formatted_address', 'geometry', 'name'],
          types: ['establishment', 'geocode'],
        }
      );

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place && place.geometry && place.geometry.location) {
          const location: LocationResult = {
            placeId: place.place_id || '',
            address: place.formatted_address || '',
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            name: place.name,
          };
          onLocationSelect(location);
          setSearchValue(place.formatted_address || '');
        }
      });
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
    }
  }, [onLocationSelect]);

  React.useEffect(() => {
    // Initialize when Google Maps loads
    if (window.google?.maps?.places) {
      initializeAutocomplete();
    } else {
      // Wait for Google Maps to load
      const checkGoogleMaps = setInterval(() => {
        if (window.google?.maps?.places) {
          initializeAutocomplete();
          clearInterval(checkGoogleMaps);
        }
      }, 100);

      return () => clearInterval(checkGoogleMaps);
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [initializeAutocomplete]);

  const handleManualSearch = async () => {
    if (!searchValue.trim() || !window.google?.maps) return;

    setIsLoading(true);
    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode({ address: searchValue }, (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
          if (status === 'OK' && results && results.length > 0) {
            resolve(results);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });

      if (result[0]) {
        const location: LocationResult = {
          placeId: result[0].place_id || '',
          address: result[0].formatted_address || '',
          lat: result[0].geometry.location.lat(),
          lng: result[0].geometry.location.lng(),
        };
        onLocationSelect(location);
      }
    } catch (error) {
      console.error('Manual geocoding failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback UI when Google Maps is not available
  if (!window.google?.maps) {
    return (
      <div className={`flex space-x-2 ${className}`}>
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                // Simple callback with text value when Google Maps unavailable
                onLocationSelect({
                  placeId: '',
                  address: searchValue,
                  lat: 0,
                  lng: 0,
                });
              }
            }}
          />
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => onLocationSelect({
            placeId: '',
            address: searchValue,
            lat: 0,
            lng: 0,
          })}
          disabled={!searchValue.trim()}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex space-x-2 ${className}`}>
      <div className="flex-1 relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-10"
        />
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
      <Button 
        type="button" 
        variant="outline" 
        onClick={handleManualSearch}
        disabled={isLoading || !searchValue.trim()}
      >
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        ) : (
          <Search className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default LocationSearch;