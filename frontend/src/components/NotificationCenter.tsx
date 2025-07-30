import React, { useState } from 'react';
import { useNotificationContext } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Check, CheckCheck, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
}) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationContext();
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await markAllAsRead();
    } finally {
      setIsMarkingAll(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "error":
        return "destructive";
      case "warning":
        return "secondary";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-md max-h-[80vh] overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAll}
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            </div>
          </div>
          <CardDescription>
            {unreadCount > 0 
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up!'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                      !notification.readAt && "bg-muted/30"
                    )}
                    onClick={() => !notification.readAt && markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {notification.title}
                          </h4>
                          <Badge variant={getTypeColor(notification.type)} className="text-xs">
                            {notification.type}
                          </Badge>
                          {!notification.readAt && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatDate(notification.createdAt)}</span>
                          {notification.readAt && (
                            <span className="flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              Read
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Separator className="mt-3" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </div>
  );
}; 