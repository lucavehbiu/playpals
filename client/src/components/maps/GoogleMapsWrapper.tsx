// @ts-nocheck
import React from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Loader } from 'lucide-react';

interface GoogleMapsWrapperProps {
  children: React.ReactElement;
  apiKey?: string;
}

const render = (status: Status) => {
  switch (status) {
    case Status.LOADING:
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <div className="flex flex-col items-center space-y-2">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      );
    case Status.FAILURE:
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Map unavailable</p>
            <p className="text-xs text-gray-500">Google Maps API key required</p>
          </div>
        </div>
      );
    default:
      return null;
  }
};

export const GoogleMapsWrapper: React.FC<GoogleMapsWrapperProps> = ({
  children,
  apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
}) => {
  if (!apiKey) {
    return render(Status.FAILURE);
  }

  return (
    <Wrapper apiKey={apiKey} render={render} libraries={['places']}>
      {children}
    </Wrapper>
  );
};

export default GoogleMapsWrapper;
