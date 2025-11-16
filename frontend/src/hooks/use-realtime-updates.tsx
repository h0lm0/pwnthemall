// hooks/use-realtime-updates.tsx
import { useEffect, useRef, useState } from 'react';

export type UpdateEvent = {
  event: 'challenge-category' | 'ctf-status' | 'instance';
  action?: string;
  data?: any;
};

type UpdateCallback = (event: UpdateEvent) => void;

// Global WebSocket connection and callbacks registry
let globalWs: WebSocket | null = null;
let globalIsConnected = false;
let reconnectTimeout: NodeJS.Timeout | undefined;
let isConnecting = false;
let closeTimeout: NodeJS.Timeout | undefined;
const callbacks = new Map<number, UpdateCallback>();
const connectionListeners = new Set<(connected: boolean) => void>();
let callbackIdCounter = 0;

export function useRealtimeUpdates(onUpdate?: UpdateCallback, enabled: boolean = true) {
  const [isConnected, setIsConnected] = useState(globalIsConnected);
  const callbackIdRef = useRef<number>(0);
  const onUpdateRef = useRef(onUpdate);

  // Keep the callback ref up to date
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Assign unique ID for this callback
    const callbackId = ++callbackIdCounter;
    callbackIdRef.current = callbackId;

    // Register this callback with a stable wrapper
    const stableCallback = (event: UpdateEvent) => {
      if (onUpdateRef.current) {
        onUpdateRef.current(event);
      }
    };
    callbacks.set(callbackId, stableCallback);

    // Register connection listener
    const connectionListener = (connected: boolean) => {
      setIsConnected(connected);
    };
    connectionListeners.add(connectionListener);

    // Connect if not already connected or connecting
    if (!globalWs && !isConnecting) {
      isConnecting = true;
      
      const connect = () => {
        try {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const wsUrl = `${protocol}//${window.location.host}/api/ws/updates`;

          const ws = new WebSocket(wsUrl);
          globalWs = ws;

          ws.onopen = () => {
            console.log('WebSocket connected to updates endpoint');
            globalIsConnected = true;
            isConnecting = false;
            connectionListeners.forEach(listener => listener(true));
          };

          ws.onmessage = (event) => {
            try {
              const data: UpdateEvent = JSON.parse(event.data);
              console.log('Received update:', data);
              
              // Call all registered callbacks
              callbacks.forEach(callback => callback(data));
            } catch (error) {
              console.error('Error parsing WebSocket message:', error);
            }
          };

          ws.onerror = (error) => {
            console.error('WebSocket error:', error);
          };

          ws.onclose = (event) => {
            console.log('WebSocket disconnected, code:', event.code, 'reason:', event.reason);
            globalIsConnected = false;
            globalWs = null;
            isConnecting = false;
            
            connectionListeners.forEach(listener => listener(false));

            // Clear any existing reconnect timeout
            if (reconnectTimeout) {
              clearTimeout(reconnectTimeout);
              reconnectTimeout = undefined;
            }

            // Don't reconnect if closed normally (1000) or going away (1001)
            if (event.code === 1000 || event.code === 1001) {
              console.log('WebSocket closed normally, not reconnecting');
              return;
            }

            // Attempt to reconnect after 5 seconds if there are still active callbacks
            if (callbacks.size > 0) {
              console.log(`Will reconnect in 5s (${callbacks.size} listeners)`);
              reconnectTimeout = setTimeout(() => {
                if (callbacks.size > 0 && !globalWs && !isConnecting) {
                  console.log('Attempting to reconnect...');
                  connect();
                }
              }, 5000);
            }
          };
        } catch (error) {
          console.error('Error creating WebSocket connection:', error);
          isConnecting = false;
        }
      };

      connect();
    } else if (globalIsConnected) {
      setIsConnected(true);
    }

    // Cleanup: remove callback when component unmounts
    return () => {
      callbacks.delete(callbackIdRef.current);
      connectionListeners.delete(connectionListener);

      // Clear any pending close timeout
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = undefined;
      }

      // Schedule a check to close the connection if no more callbacks
      // We use a timeout to batch multiple unmounts together
      closeTimeout = setTimeout(() => {
        if (callbacks.size === 0) {
          console.log('No more listeners, closing WebSocket');
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = undefined;
          }
          if (globalWs) {
            // Close with code 1000 (normal closure) to prevent reconnection
            globalWs.close(1000, 'No more listeners');
            globalWs = null;
            globalIsConnected = false;
            isConnecting = false;
          }
        }
      }, 100); // 100ms debounce to batch unmounts
    };
  }, [enabled]);

  return { isConnected };
}
