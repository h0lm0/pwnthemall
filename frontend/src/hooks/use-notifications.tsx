import { useEffect, useRef, useState, useCallback } from 'react';
import { Notification } from '@/models/Notification';
import axios from '@/lib/axios';
import { debugLog, debugError, debugWarn } from '@/lib/debug';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  sendNotification: (notification: any) => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export const useNotifications = (isAuthenticated: boolean = false): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await axios.get<Notification[]>('/api/notifications');
      
      debugLog('Notifications API response:', response.data);
      
      // Handle null or undefined response data
      const notifications = response.data || [];
      setNotifications(notifications);
      
      // Calculate unread count
      const unread = notifications.filter(n => !n.readAt).length;
      setUnreadCount(unread);
    } catch (error: any) {
      debugError('Failed to fetch notifications:', error);
      // Don't show error for 403 (not authenticated) or 401 (unauthorized)
      if (error?.response?.status !== 403 && error?.response?.status !== 401) {
        debugError('Unexpected error fetching notifications:', error);
      }
      // Set empty arrays on error
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await axios.get<{ count: number }>('/api/notifications/unread-count');
      setUnreadCount(response.data?.count || 0);
    } catch (error: any) {
      debugError('Failed to fetch unread count:', error);
      // Don't show error for 403 (not authenticated) or 401 (unauthorized)
      if (error?.response?.status !== 403 && error?.response?.status !== 401) {
        debugError('Unexpected error fetching unread count:', error);
      }
      setUnreadCount(0);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (id: number) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      debugError('Failed to mark notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await axios.put('/api/notifications/read-all');
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      debugError('Failed to mark all notifications as read:', error);
    }
  }, []);

  // Send notification (admin only)
  const sendNotification = useCallback(async (notification: any) => {
    try {
      await axios.post('/api/admin/notifications', notification);
    } catch (error) {
      debugError('Failed to send notification:', error);
      throw error;
    }
  }, []);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    // Build candidate websocket URLs
    const origin = (typeof window !== 'undefined') ? window.location.origin : '';
    const envBackend = (typeof window !== 'undefined') ? (process.env.NEXT_PUBLIC_BACKEND_ORIGIN || '') : '';

    const toWs = (httpUrl: string) => httpUrl.replace(/^https/, 'wss').replace(/^http/, 'ws');

    const candidates: string[] = [];
    if (envBackend) {
      candidates.push(toWs(envBackend.replace(/\/$/, '') + '/ws/notifications'));
    }
    candidates.push(toWs(origin + '/api/ws/notifications'));
    candidates.push(toWs(origin + '/ws/notifications'));
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      const proto = origin.startsWith('https') ? 'wss' : 'ws';
      candidates.push(`${proto}://localhost:8080/ws/notifications`);
    }

    let tried = 0;

    const tryNext = () => {
      if (tried >= candidates.length) {
        debugWarn('[WS] Exhausted all websocket endpoints, will retry in 5s...');
        reconnectTimeoutRef.current = setTimeout(() => {
          tried = 0;
          tryNext();
        }, 5000);
        return;
      }

      const url = candidates[tried++];
      debugLog('[WS] Connecting to', url);

      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          debugLog('[WS] Connected to', url);
          setIsConnected(true);

          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        };

        ws.onmessage = (event) => {
          try {
            debugLog('WebSocket message received:', event.data);
            // Dispatch raw event for listeners interested in non-notification events
            if (typeof window !== 'undefined' && window.dispatchEvent) {
              try {
                const parsed = JSON.parse(event.data);
                if (parsed && parsed.event === 'team_solve') {
                  debugLog('[WS] team_solve event', parsed);
                  window.dispatchEvent(new CustomEvent('team-solve', { detail: parsed }));
                  // Also trigger the notification toast pipeline
                  const label = parsed.challengeName || `challenge #${parsed.challengeId}`;
                  const notif = {
                    id: Date.now(),
                    title: 'Team solved a challenge',
                    message: `${parsed.username || 'A teammate'} solved ${label} (+${parsed.points} pts)`,
                    type: 'info',
                    createdAt: new Date().toISOString(),
                  } as any;
                  window.dispatchEvent(new CustomEvent('new-notification', { detail: notif }));
                  return; // Do not treat as notification list item
                }
                if (parsed && parsed.event === 'instance_update') {
                  debugLog('[WS] instance_update event', parsed);
                  window.dispatchEvent(new CustomEvent('instance-update', { detail: parsed }));
                  return; // Not a Notification object
                }
              } catch {}
            }

            const notification: Notification = JSON.parse(event.data);
            debugLog('Parsed notification:', notification);

            if (notification && (notification as any).id && (notification as any).title) {
              debugLog('Valid notification, dispatching event');
              setNotifications(prev => [notification, ...prev]);
              setUnreadCount(prev => prev + 1);
              if (typeof window !== 'undefined' && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('new-notification', { detail: notification }));
              }
            } else {
              debugWarn('Received invalid notification data:', notification);
            }
          } catch (error) {
            debugError('Failed to parse WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          debugWarn('[WS] Disconnected from', url);
          setIsConnected(false);

          // Attempt failover to next candidate immediately
          tryNext();
        };

        ws.onerror = (error) => {
          debugError('[WS] Error on', url, error);
          setIsConnected(false);
          try {
            ws.close();
          } catch {}
        };
      } catch (error) {
        debugError('[WS] Failed to create WebSocket connection for', url, error);
        setIsConnected(false);
        tryNext();
      }
    };

    tryNext();
  }, []);

  // Initialize WebSocket connection and fetch notifications
  useEffect(() => {
    // Only connect if we're in the browser and authenticated
    if (typeof window !== 'undefined' && isAuthenticated) {
      fetchNotifications();
      connectWebSocket();
    } else if (wsRef.current) {
      // Close connection if not authenticated
      wsRef.current.close();
    }

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [fetchNotifications, connectWebSocket, isAuthenticated]);

  return {
    notifications,
    unreadCount,
    isConnected,
    sendNotification,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };
}; 