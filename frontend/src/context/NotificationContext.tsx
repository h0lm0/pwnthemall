import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { Notification } from '@/models/Notification';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/router';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  sendNotification: (notification: any) => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  showToastNotification: (notification: Notification) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { loggedIn } = useAuth();
  const router = useRouter();
  const [recentlySentNotifications, setRecentlySentNotifications] = useState<Set<number>>(new Set());
  
  const {
    notifications,
    unreadCount,
    isConnected,
    sendNotification: originalSendNotification,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useNotifications(loggedIn);

  // Wrapper for sendNotification that tracks recently sent notifications
  const sendNotification = async (notification: any) => {
    const result = await originalSendNotification(notification);
    
    // Add a temporary flag to prevent showing toast for this notification
    // We'll use a timestamp-based approach to identify recently sent notifications
    const timestamp = Date.now();
    setRecentlySentNotifications(prev => new Set(Array.from(prev).concat([timestamp])));
    
    // Remove the flag after 10 seconds
    setTimeout(() => {
      setRecentlySentNotifications(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(timestamp);
        return newSet;
      });
    }, 10000);
    
    return result;
  };

  // Show toast notification when a new notification is received
  const showToastNotification = (notification: Notification) => {
    
    // Check if this notification was recently sent by the current user
    // We'll use a simple heuristic: if the notification was created very recently (within 5 seconds)
    // and we have recently sent notifications, don't show the toast
    const notificationTime = new Date(notification.createdAt).getTime();
    const currentTime = Date.now();
    const timeDiff = currentTime - notificationTime;
    
    if (timeDiff < 5000 && recentlySentNotifications.size > 0) {
      return;
    }
    
    // Get icon based on notification type
    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'error':
          return <XCircle className="w-4 h-4" />;
        case 'warning':
          return <AlertTriangle className="w-4 h-4" />;
        case 'info':
        default:
          return <Info className="w-4 h-4" />;
      }
    };

    const icon = getTypeIcon(notification.type);
    const title = notification.title || 'Notification';
    const message = notification.message || 'You have a new notification';

    toast(`${title}`, {
      description: message,
      icon: icon,
      action: {
        label: 'View',
        onClick: () => {
          router.push('/notifications');
        },
      },
      duration: 5000,
      className: `notification-toast notification-${notification.type}`,
    });
  };

  // Listen for new notification events from WebSocket
  React.useEffect(() => {
    const handleNewNotification = (event: CustomEvent<Notification>) => {
      showToastNotification(event.detail);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('new-notification', handleNewNotification as EventListener);
      return () => {
        window.removeEventListener('new-notification', handleNewNotification as EventListener);
      };
    }
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    sendNotification,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    showToastNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}; 