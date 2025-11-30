// @ts-nocheck
import React, { useRef, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Search, AlertCircle, Loader } from 'lucide-react';

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

interface NominatimResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
}

export const LeafletLocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelect,
  placeholder = 'Search for a location...',
  value = '',
  className = '',
}) => {
  const [searchValue, setSearchValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounced search function using Nominatim (OpenStreetMap's geocoding service)
  const searchLocation = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          new URLSearchParams({
            q: query,
            format: 'json',
            addressdetails: '1',
            limit: '5',
          }),
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const results: NominatimResult[] = await response.json();
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Location search failed:', error);
      setError('Could not search locations. Please try again.');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for debounced search
    debounceTimer.current = setTimeout(() => {
      searchLocation(newValue);
    }, 500);
  };

  const handleSelectSuggestion = (suggestion: NominatimResult) => {
    const location: LocationResult = {
      placeId: suggestion.place_id,
      address: suggestion.display_name,
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      name: suggestion.name,
    };

    setSearchValue(suggestion.display_name);
    onLocationSelect(location);
    setShowSuggestions(false);
    setSuggestions([]);
    setError('');
  };

  const handleManualSearch = () => {
    if (searchValue.trim()) {
      searchLocation(searchValue);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualSearch();
    }
  };

  return (
    <div className={`space-y-2 relative ${className}`}>
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder={placeholder}
            value={searchValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="pl-10 text-lg p-4 h-14 rounded-2xl border-2 border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/20"
          />
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleManualSearch}
          disabled={isLoading || !searchValue.trim()}
          className="h-14 px-6 rounded-2xl border-2"
        >
          {isLoading ? <Loader className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
        </Button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full bg-white border-2 border-gray-200 rounded-2xl shadow-lg mt-2 max-h-64 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 first:rounded-t-2xl last:rounded-b-2xl"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.name || suggestion.display_name.split(',')[0]}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{suggestion.display_name}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center space-x-1 text-sm text-orange-600 bg-orange-50 p-3 rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Info message */}
      {!error && !isLoading && suggestions.length === 0 && searchValue.trim().length > 0 && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
          No results found. Try a different search term.
        </div>
      )}
    </div>
  );
};

export default LeafletLocationSearch;
