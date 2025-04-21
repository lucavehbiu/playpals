import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { apiRequest } from '@/lib/queryClient';

type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'fallback';

export interface WebSocketNotification {
  type: string;
  message: string;
  [key: string]: any;
}

// Maximum number of reconnection attempts
const MAX_RECONNECT_ATTEMPTS = 5;
// Initial reconnect delay (will be doubled with each attempt)
const INITIAL_RECONNECT_DELAY = 2000;
// Polling interval when WebSocket fails (milliseconds)
const POLLING_INTERVAL = 5000;

export function useWebSocket() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [notifications, setNotifications] = useState<WebSocketNotification[]>([]);
  
  // Track reconnection attempts
  const reconnectAttempts = useRef(0);
  // Store last notification fetch time for polling fallback
  const lastFetchTime = useRef(Date.now());
  // Timer for polling
  const pollingTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Handle received notifications (both from WebSocket and polling)
  const handleNotifications = useCallback((newNotifications: WebSocketNotification[]) => {
    if (!newNotifications || newNotifications.length === 0) return;
    
    // Add to state
    setNotifications(prev => {
      // Filter out duplicates based on id or other unique identifiers
      const newNotifs = newNotifications.filter(newNotif => 
        !prev.some(existingNotif => 
          (newNotif.id && existingNotif.id === newNotif.id) || 
          (newNotif.requestId && existingNotif.requestId === newNotif.requestId && 
           newNotif.type === existingNotif.type)
        )
      );
      
      // Show toast for new notifications
      newNotifs.forEach(notification => {
        let title = 'Notification';
        if (notification.type === 'join_request') title = 'New Join Request';
        else if (notification.type === 'join_request_update') title = 'Join Request Update';
        else if (notification.type === 'rsvp_approved') title = 'Event RSVP Update';
        
        toast({
          title: title,
          description: notification.message,
          variant: 'default',
        });
      });
      
      return [...newNotifs, ...prev];
    });
  }, [toast]);
  
  // Fallback polling function when WebSocket is not available
  const pollNotifications = useCallback(async () => {
    if (!user || !user.id) return;
    
    try {
      // Make HTTP request to get new notifications since last fetch
      const response = await apiRequest('GET', `/api/users/${user.id}/notifications?since=${lastFetchTime.current}`);
      
      if (response.ok) {
        const data = await response.json();
        lastFetchTime.current = Date.now();
        handleNotifications(data);
      }
    } catch (error) {
      console.error('Error polling notifications:', error);
    }
    
    // Continue polling
    pollingTimer.current = setTimeout(pollNotifications, POLLING_INTERVAL);
  }, [user, handleNotifications]);
  
  // Start fallback polling when WebSocket fails
  const startPolling = useCallback(() => {
    // Clear any existing timer
    if (pollingTimer.current) {
      clearTimeout(pollingTimer.current);
    }
    
    setStatus('fallback');
    console.log('Switching to polling fallback for notifications');
    
    // Reset the last fetch time to now
    lastFetchTime.current = Date.now();
    
    // Start polling
    pollingTimer.current = setTimeout(pollNotifications, 500); // Start immediately
    
    // Create a new endpoint if one doesn't exist
    // This will handle returning notifications since the given timestamp
    // For backward compatibility, we'll check if this endpoint exists before using it
    apiRequest('GET', `/api/users/${user?.id}/notifications?check=true`)
      .then(response => {
        if (response.status === 404) {
          console.warn('Notification polling endpoint not available. Using regular polling methods.');
        }
      })
      .catch(() => {
        // If the check fails, we'll just use regular query invalidation via use-notifications.tsx
        console.warn('Fallback to regular notification refreshing.');
      });
  }, [user, pollNotifications]);
  
  // Function to connect to WebSocket with exponential backoff
  const connect = useCallback(() => {
    if (!user || !user.id) return;
    
    // If we've tried too many times, switch to polling
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      console.log(`Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Switching to polling fallback.`);
      startPolling();
      return;
    }
    
    try {
      // Determine the protocol (ws:// or wss://) based on the current protocol
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log(`Connecting to WebSocket server at: ${wsUrl} (attempt ${reconnectAttempts.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);
      setStatus('connecting');
      
      const newSocket = new WebSocket(wsUrl);
      
      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        if (newSocket.readyState !== WebSocket.OPEN) {
          console.log('WebSocket connection timeout');
          newSocket.close();
        }
      }, 10000); // 10 seconds timeout
      
      newSocket.onopen = () => {
        console.log('WebSocket connection established');
        clearTimeout(connectionTimeout);
        setStatus('connected');
        reconnectAttempts.current = 0; // Reset reconnect attempts on successful connection
        
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
          } else if (data.type === 'join_request' || data.type === 'join_request_update' || data.type === 'rsvp_approved') {
            // Process the notification
            handleNotifications([data]);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        clearTimeout(connectionTimeout);
        setStatus('error');
        
        // Show toast with error to help with debugging (only on first error)
        if (reconnectAttempts.current === 0) {
          toast({
            title: 'Notification System',
            description: 'Using fallback notification method. Real-time updates may be delayed.',
            variant: 'default',
          });
        }
        
        // Close the socket if it's still open
        if (newSocket.readyState === WebSocket.OPEN) {
          newSocket.close();
        }
        
        // Increment reconnect attempts
        reconnectAttempts.current += 1;
        
        // Try to reconnect with exponential backoff
        const delay = INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current - 1);
        console.log(`Will attempt to reconnect in ${delay}ms (attempt ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`);
        
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          setTimeout(() => {
            if (user && user.id) {
              console.log('Attempting to reconnect WebSocket...');
              connect();
            }
          }, delay);
        } else {
          // If we've tried too many times, switch to polling
          startPolling();
        }
      };
      
      newSocket.onclose = (event) => {
        console.log('WebSocket connection closed', event.code, event.reason);
        clearTimeout(connectionTimeout);
        
        // Only attempt to reconnect if the close wasn't intentional
        if (user && user.id && event.code !== 1000 && event.code !== 1001) {
          setStatus('disconnected');
          
          // Increment reconnect attempts
          reconnectAttempts.current += 1;
          
          if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
            // Try to reconnect with exponential backoff
            const delay = INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current - 1);
            console.log(`Connection closed. Will attempt to reconnect in ${delay}ms (attempt ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`);
            
            setTimeout(() => {
              console.log('Attempting to reconnect WebSocket...');
              connect();
            }, delay);
          } else {
            // If we've tried too many times, switch to polling
            startPolling();
          }
        } else {
          setStatus('disconnected');
        }
      };
      
      setSocket(newSocket);
      
      // Cleanup function to close the socket when component unmounts
      return () => {
        clearTimeout(connectionTimeout);
        if (newSocket.readyState === WebSocket.OPEN || newSocket.readyState === WebSocket.CONNECTING) {
          newSocket.close(1000); // Normal closure
        }
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      setStatus('error');
      
      // Increment reconnect attempts
      reconnectAttempts.current += 1;
      
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current - 1);
        setTimeout(() => {
          if (user && user.id) {
            connect();
          }
        }, delay);
      } else {
        // If we've tried too many times, switch to polling
        startPolling();
      }
    }
  }, [user, toast, handleNotifications, startPolling]);
  
  // Connect/reconnect when user changes
  useEffect(() => {
    // Only connect if we have a user
    if (user && user.id) {
      // Reset reconnect attempts when user changes
      reconnectAttempts.current = 0;
      
      // Disconnect existing socket if any
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close(1000); // Normal closure
        setSocket(null);
      }
      
      // Clear any polling timer
      if (pollingTimer.current) {
        clearTimeout(pollingTimer.current);
        pollingTimer.current = null;
      }
      
      // Connect new socket or start polling
      const cleanup = connect();
      
      return () => {
        if (cleanup) cleanup();
        // Clear any polling timer on cleanup
        if (pollingTimer.current) {
          clearTimeout(pollingTimer.current);
          pollingTimer.current = null;
        }
      };
    } else {
      // No user, so disconnect if connected
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close(1000); // Normal closure
        setSocket(null);
      }
      
      // Clear any polling timer
      if (pollingTimer.current) {
        clearTimeout(pollingTimer.current);
        pollingTimer.current = null;
      }
      
      setStatus('disconnected');
    }
  }, [user, connect, socket]);
  
  // Handle reconnection on window focus
  useEffect(() => {
    const handleFocus = () => {
      // If we have a user but no connection, try to reconnect
      if (user && user.id) {
        if (status === 'fallback') {
          // If we're in fallback mode, just trigger a poll
          if (pollingTimer.current) {
            clearTimeout(pollingTimer.current);
          }
          pollNotifications();
        } else if (!socket || (socket.readyState !== WebSocket.OPEN && socket.readyState !== WebSocket.CONNECTING)) {
          // If WebSocket is disconnected, try to reconnect
          reconnectAttempts.current = 0; // Reset counter on manual reconnect
          connect();
        }
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, socket, connect, status, pollNotifications]);
  
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