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
  teamId?: number;
}

export interface SentNotification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  userId?: number;
  username?: string;
  teamId?: number;
  teamName?: string;
  createdAt: string;
} 