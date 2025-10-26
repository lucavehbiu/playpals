// @ts-nocheck
import { useState, useCallback, useMemo } from 'react';

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

interface UseLocationFilterOptions {
  defaultRadius?: number;
  maxRadius?: number;
  minRadius?: number;
}

export const useLocationFilter = (options: UseLocationFilterOptions = {}) => {
  const { defaultRadius = 10, maxRadius = 50, minRadius = 1 } = options;

  const [locationFilter, setLocationFilter] = useState<LocationFilterData>({
    location: null,
    radius: defaultRadius,
    useCurrentLocation: false,
  });

  const handleLocationFilterChange = useCallback((value: LocationFilterData) => {
    setLocationFilter(value);
  }, []);

  const clearLocationFilter = useCallback(() => {
    setLocationFilter({
      location: null,
      radius: defaultRadius,
      useCurrentLocation: false,
    });
  }, [defaultRadius]);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = useCallback(
    (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 6371; // Earth's radius in kilometers
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLng = (lng2 - lng1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  // Function to filter items by location and radius
  const filterByLocation = useCallback(
    <T extends { location?: string; latitude?: number; longitude?: number }>(items: T[]): T[] => {
      if (
        !locationFilter.location ||
        !locationFilter.location.lat ||
        !locationFilter.location.lng
      ) {
        return items;
      }

      const centerLat = locationFilter.location.lat;
      const centerLng = locationFilter.location.lng;
      const radiusKm = locationFilter.radius;

      return items.filter((item) => {
        // If item has coordinates, use them for precise filtering
        if (item.latitude && item.longitude) {
          const distance = calculateDistance(centerLat, centerLng, item.latitude, item.longitude);
          return distance <= radiusKm;
        }

        // Fallback to text-based location matching if no coordinates
        if (item.location && locationFilter.location.address) {
          return item.location
            .toLowerCase()
            .includes(locationFilter.location.address.toLowerCase());
        }

        return true; // Include items without location data
      });
    },
    [locationFilter, calculateDistance]
  );

  // Function to get location filter display text
  const getLocationFilterText = useCallback((): string => {
    if (!locationFilter.location) return '';

    const locationText = locationFilter.useCurrentLocation
      ? 'Near me'
      : locationFilter.location.name || locationFilter.location.address;

    return `${locationText} (${locationFilter.radius} km)`;
  }, [locationFilter]);

  const isLocationFilterActive = useMemo(() => {
    return !!locationFilter.location;
  }, [locationFilter.location]);

  return {
    locationFilter,
    handleLocationFilterChange,
    clearLocationFilter,
    filterByLocation,
    getLocationFilterText,
    isLocationFilterActive,
    options: {
      maxRadius,
      minRadius,
      defaultRadius,
    },
  };
};

export default useLocationFilter;
