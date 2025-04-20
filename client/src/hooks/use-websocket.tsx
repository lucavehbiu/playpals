import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WebSocketNotification {
  type: string;
  message: string;
  [key: string]: any;
}

export function useWebSocket() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [notifications, setNotifications] = useState<WebSocketNotification[]>([]);

  // Function to connect to WebSocket
  const connect = useCallback(() => {
    if (!user || !user.id) return;
    
    try {
      // Determine the protocol (ws:// or wss://) based on the current protocol
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Connecting to WebSocket server at:', wsUrl);
      setStatus('connecting');
      
      const newSocket = new WebSocket(wsUrl);
      
      newSocket.onopen = () => {
        console.log('WebSocket connection established');
        setStatus('connected');
        
        // Send authentication message
        newSocket.send(JSON.stringify({
          type: 'auth',
          userId: user.id
        }));
      };
      
      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          if (data.type === 'auth_success') {
            console.log('WebSocket authenticated successfully');
          } else if (data.type === 'join_request' || data.type === 'join_request_update') {
            // Add notification to state
            setNotifications(prev => [data, ...prev]);
            
            // Show toast notification
            toast({
              title: data.type === 'join_request' ? 'New Join Request' : 'Join Request Update',
              description: data.message,
              variant: 'default',
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStatus('error');
      };
      
      newSocket.onclose = () => {
        console.log('WebSocket connection closed');
        setStatus('disconnected');
      };
      
      setSocket(newSocket);
      
      // Cleanup function to close the socket when component unmounts
      return () => {
        if (newSocket.readyState === WebSocket.OPEN) {
          newSocket.close();
        }
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      setStatus('error');
    }
  }, [user, toast]);
  
  // Connect/reconnect when user changes
  useEffect(() => {
    // Only connect if we have a user
    if (user && user.id) {
      // Disconnect existing socket if any
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
      
      // Connect new socket
      const cleanup = connect();
      
      return () => {
        if (cleanup) cleanup();
      };
    } else {
      // No user, so disconnect if connected
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
        setSocket(null);
      }
    }
  }, [user, connect, socket]);
  
  // Handle reconnection on window focus
  useEffect(() => {
    const handleFocus = () => {
      // If we have a user but no connection, try to reconnect
      if (user && user.id && (!socket || socket.readyState !== WebSocket.OPEN)) {
        connect();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, socket, connect]);
  
  // Function to clear a notification
  const clearNotification = useCallback((index: number) => {
    setNotifications(prev => {
      const newNotifications = [...prev];
      newNotifications.splice(index, 1);
      return newNotifications;
    });
  }, []);
  
  // Function to clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);
  
  return {
    status,
    notifications,
    clearNotification,
    clearAllNotifications
  };
}