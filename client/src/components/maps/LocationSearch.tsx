// @ts-nocheck
import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Search, AlertCircle } from 'lucide-react';
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
  placeholder = 'Search for a location...',
  value = '',
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showFallback, setShowFallback] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Initialize Google Places Autocomplete
  const initializeAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places) {
      setShowFallback(true);
      return;
    }

    try {
      // Create the autocomplete instance
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        fields: ['place_id', 'formatted_address', 'geometry', 'name'],
        types: ['establishment', 'geocode'],
      });

      // Listen for place selection
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
          setError('');
        }
      });

      console.log('Google Places Autocomplete initialized successfully');
      setError('');
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
      setError('Maps service temporarily unavailable');
      setShowFallback(true);
    }
  }, [onLocationSelect]);

  useEffect(() => {
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

      // Timeout after 10 seconds and show fallback
      const timeout = setTimeout(() => {
        setShowFallback(true);
        clearInterval(checkGoogleMaps);
      }, 10000);

      return () => {
        clearInterval(checkGoogleMaps);
        clearTimeout(timeout);
      };
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [initializeAutocomplete]);

  // Enhanced search function with better error handling
  const handleManualSearch = async () => {
    if (!searchValue.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      if (window.google?.maps?.Geocoder) {
        // Use Google's Geocoding API
        const geocoder = new window.google.maps.Geocoder();
        const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
          geocoder.geocode(
            { address: searchValue },
            (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
              if (status === 'OK' && results && results.length > 0) {
                resolve(results);
              } else {
                reject(new Error(`Geocoding failed: ${status}`));
              }
            }
          );
        });

        if (result[0]) {
          const location: LocationResult = {
            placeId: result[0].place_id || '',
            address: result[0].formatted_address || '',
            lat: result[0].geometry.location.lat(),
            lng: result[0].geometry.location.lng(),
          };
          onLocationSelect(location);
          setError('');
        }
      } else {
        // Fallback: Just use the text input
        onLocationSelect({
          placeId: '',
          address: searchValue,
          lat: 0,
          lng: 0,
        });
      }
    } catch (error) {
      console.error('Location search failed:', error);
      setError('Could not find location. Try a different search term.');

      // Still allow manual entry as fallback
      onLocationSelect({
        placeId: '',
        address: searchValue,
        lat: 0,
        lng: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualSearch();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={handleKeyPress}
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

      {/* Error message */}
      {error && (
        <div className="flex items-center space-x-1 text-sm text-orange-600 bg-orange-50 p-2 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Info message for fallback */}
      {showFallback && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
          Enter location manually - Maps service loading...
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
