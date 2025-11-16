// hooks/use-realtime-updates.tsx
import { useEffect, useRef, useState } from 'react';

export type UpdateEvent = {
  event: 'challenge-category' | 'ctf_status' | 'instance';
  action?: string;
  data?: any;
};

type UpdateCallback = (event: UpdateEvent) => void;

export function useRealtimeUpdates(onUpdate?: UpdateCallback, enabled: boolean = true) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(onUpdate);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!enabled) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    let isMounted = true;

    const connect = () => {
      try {
        // Determine WebSocket protocol
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/ws/updates`;

        // WebSocket will use cookies automatically (no need to check localStorage)
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isMounted) {
            console.log('WebSocket connected to updates endpoint');
            setIsConnected(true);
          }
        };

        ws.onmessage = (event) => {
          try {
            const data: UpdateEvent = JSON.parse(event.data);
            console.log('Received update:', data);
            
            // Call the callback if provided
            if (callbackRef.current) {
              callbackRef.current(data);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
          if (isMounted) {
            console.log('WebSocket disconnected, attempting reconnect...');
            setIsConnected(false);
            wsRef.current = null;

            // Attempt to reconnect after 3 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
              if (isMounted) {
                connect();
              }
            }, 3000);
          }
        };
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled]);

  return { isConnected };
}
