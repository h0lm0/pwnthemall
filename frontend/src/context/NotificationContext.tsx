import React, { createContext, useContext, ReactNode } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { Notification } from '@/models/Notification';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

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
  
  const {
    notifications,
    unreadCount,
    isConnected,
    sendNotification,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useNotifications(loggedIn);

  // Show toast notification when a new notification is received
  const showToastNotification = (notification: Notification) => {
    toast(notification.title, {
      description: notification.message,
      action: {
        label: 'View',
        onClick: () => {
          // We'll implement this later to open notification center
          console.log('Open notification center');
        },
      },
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