import React, { createContext, useContext } from 'react';
import type { WebSocketNotification } from './use-websocket';

// Create mock WebSocket interface with dummy functions
type WebSocketContextType = {
  status: 'disconnected' | 'connected' | 'connecting' | 'error' | 'fallback';
  notifications: WebSocketNotification[];
  clearNotification: (index: number) => void;
  clearAllNotifications: () => void;
};

// Mock implementation that does nothing
const mockWebSocketContext: WebSocketContextType = {
  status: 'disconnected',
  notifications: [],
  clearNotification: () => {},
  clearAllNotifications: () => {},
};

// Create context with the mock implementation
export const WebSocketContext = createContext<WebSocketContextType>(mockWebSocketContext);

// Provider component that uses the mock implementation
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use mock implementation instead of actual WebSocket
  return (
    <WebSocketContext.Provider value={mockWebSocketContext}>{children}</WebSocketContext.Provider>
  );
};

// Hook for using the WebSocket context
export const useWebSocketContext = () => {
  return useContext(WebSocketContext);
};
