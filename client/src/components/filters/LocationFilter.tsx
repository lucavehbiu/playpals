// @ts-nocheck
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Target, X, Navigation } from 'lucide-react';
import { LeafletLocationSearch } from '@/components/maps/LeafletLocationSearch';
import { LeafletMapWrapper } from '@/components/maps/LeafletMapWrapper';

interface LocationResult {
  placeId: string;
  address: string;
  lat: number;
  lng: number;
  name?: string;
}

interface LocationFilterData {
  location: LocationResult | null;
  radius: number;
  useCurrentLocation: boolean;
}

interface LocationFilterProps {
  value: LocationFilterData;
  onChange: (value: LocationFilterData) => void;
  placeholder?: string;
  className?: string;
  showRadiusSlider?: boolean;
  maxRadius?: number;
  minRadius?: number;
}

export const LocationFilter: React.FC<LocationFilterProps> = ({
  value,
  onChange,
  placeholder = 'Search for a location...',
  className = '',
  showRadiusSlider = true,
  maxRadius = 50,
  minRadius = 1,
}) => {
  const [isLoadingCurrentLocation, setIsLoadingCurrentLocation] = useState(false);
  const [locationError, setLocationError] = useState<string>('');

  const handleLocationSelect = useCallback(
    (location: LocationResult) => {
      onChange({
        ...value,
        location,
        useCurrentLocation: false,
      });
      setLocationError('');
    },
    [value, onChange]
  );

  const handleRadiusChange = useCallback(
    (newRadius: number[]) => {
      onChange({
        ...value,
        radius: newRadius[0],
      });
    },
    [value, onChange]
  );

  const handleUseCurrentLocation = useCallback(async () => {
    setIsLoadingCurrentLocation(true);
    setLocationError('');

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
      });

      // Reverse geocode to get address using Nominatim
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?` +
            new URLSearchParams({
              lat: position.coords.latitude.toString(),
              lon: position.coords.longitude.toString(),
              format: 'json',
            }),
          {
            headers: {
              Accept: 'application/json',
            },
          }
        );
        const data = await response.json();

        const location: LocationResult = {
          placeId: data.place_id?.toString() || '',
          address: data.display_name || 'Current Location',
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: 'Current Location',
        };

        onChange({
          ...value,
          location,
          useCurrentLocation: true,
        });
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        // Fallback without address
        const location: LocationResult = {
          placeId: '',
          address: 'Current Location',
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: 'Current Location',
        };

        onChange({
          ...value,
          location,
          useCurrentLocation: true,
        });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to get your current location. Please check your browser permissions.';
      setLocationError(errorMessage);
    } finally {
      setIsLoadingCurrentLocation(false);
    }
  }, [value, onChange]);

  const handleClearLocation = useCallback(() => {
    onChange({
      ...value,
      location: null,
      useCurrentLocation: false,
    });
    setLocationError('');
  }, [value, onChange]);

  const displayValue = value.location?.address || '';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Location Search Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Location</span>
          </div>

          {value.location && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearLocation}
              className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <LeafletMapWrapper>
            <LeafletLocationSearch
              onLocationSelect={handleLocationSelect}
              placeholder={placeholder}
              value={displayValue}
              className="w-full"
            />
          </LeafletMapWrapper>

          {/* Near Me Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleUseCurrentLocation}
            disabled={isLoadingCurrentLocation}
            className="w-full text-sm"
          >
            {isLoadingCurrentLocation ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 mr-2" />
            ) : (
              <Navigation className="h-4 w-4 mr-2" />
            )}
            {isLoadingCurrentLocation ? 'Getting location...' : 'Use current location'}
          </Button>
        </div>

        {/* Error Message */}
        {locationError && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
            {locationError}
          </div>
        )}

        {/* Selected Location Display */}
        {value.location && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-green-800 truncate">
                    {value.useCurrentLocation ? (
                      <div className="flex items-center space-x-1">
                        <Target className="h-3 w-3" />
                        <span>Near Me</span>
                      </div>
                    ) : (
                      value.location.name || value.location.address
                    )}
                  </div>
                  {value.location.address &&
                    value.location.name &&
                    value.location.name !== value.location.address && (
                      <div className="text-xs text-green-600 truncate mt-1">
                        {value.location.address}
                      </div>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Radius Slider Section */}
      {showRadiusSlider && value.location && (
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Search Radius</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {value.radius} km
            </Badge>
          </div>

          <div className="px-2">
            <Slider
              value={[value.radius]}
              onValueChange={handleRadiusChange}
              max={maxRadius}
              min={minRadius}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{minRadius} km</span>
              <span className="text-sm font-medium text-blue-600">{value.radius} km</span>
              <span>{maxRadius} km</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationFilter;
