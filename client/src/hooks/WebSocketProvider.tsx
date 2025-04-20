import React, { createContext, useContext } from 'react';
import { useWebSocket } from './use-websocket';

// Create context
export const WebSocketContext = createContext<ReturnType<typeof useWebSocket> | null>(null);

// Provider component
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const webSocket = useWebSocket();
  
  return (
    <WebSocketContext.Provider value={webSocket}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook for using the WebSocket context
export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};