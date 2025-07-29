export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  readAt?: string;
  createdAt: string;
}

export interface NotificationInput {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  userId?: number;
}

export interface SentNotification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  userId?: number;
  username?: string;
  createdAt: string;
} 