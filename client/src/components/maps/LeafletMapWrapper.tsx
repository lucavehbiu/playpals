// @ts-nocheck
import React from 'react';
import 'leaflet/dist/leaflet.css';

interface LeafletMapWrapperProps {
  children: React.ReactElement;
}

/**
 * Simple wrapper to ensure Leaflet CSS is loaded.
 * Unlike Google Maps, Leaflet doesn't require API key initialization.
 */
export const LeafletMapWrapper: React.FC<LeafletMapWrapperProps> = ({ children }) => {
  return <>{children}</>;
};

export default LeafletMapWrapper;
