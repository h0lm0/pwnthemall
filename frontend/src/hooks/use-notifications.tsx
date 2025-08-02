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

    // Get the base URL from axios and properly handle HTTPS/WSS
    const baseURL = axios.defaults.baseURL || window.location.origin;
    const wsURL = baseURL.replace(/^https/, 'wss').replace(/^http/, 'ws') + '/api/ws/notifications';

    try {
      const ws = new WebSocket(wsURL);
      wsRef.current = ws;

      ws.onopen = () => {
        debugLog('WebSocket connected');
        setIsConnected(true);
        
        // Clear any reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          debugLog('WebSocket message received:', event.data);
          const notification: Notification = JSON.parse(event.data);
          debugLog('Parsed notification:', notification);
          
          // Validate notification data
          if (notification && notification.id && notification.title) {
            debugLog('Valid notification, dispatching event');
            // Add new notification to the beginning of the list
            setNotifications(prev => [notification, ...prev]);
            
            // Increment unread count
            setUnreadCount(prev => prev + 1);
            
            // Show toast notification
            if (typeof window !== 'undefined' && window.dispatchEvent) {
              window.dispatchEvent(new CustomEvent('new-notification', { 
                detail: notification 
              }));
            }
          } else {
            debugWarn('Received invalid notification data:', notification);
          }
        } catch (error) {
          debugError('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        debugLog('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          debugLog('Attempting to reconnect WebSocket...');
          connectWebSocket();
        }, 5000);
      };

      ws.onerror = (error) => {
        debugError('WebSocket error:', error);
        setIsConnected(false);
        
        // Don't attempt to reconnect on authentication errors
        if (error instanceof Event && error.type === 'error') {
          debugLog('WebSocket connection failed - likely authentication issue');
        }
      };
    } catch (error) {
      debugError('Failed to create WebSocket connection:', error);
      setIsConnected(false);
    }
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