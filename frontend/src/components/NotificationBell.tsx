import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationContext } from '@/context/NotificationContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { NotificationCenter } from './NotificationCenter';

interface NotificationBellProps {
  className?: string;
  onClick?: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ 
  className, 
  onClick 
}) => {
  const { unreadCount, isConnected } = useNotificationContext();
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setIsNotificationCenterOpen(true);
    }
  };

  return (
    <>
      <div 
        className={cn(
          "relative cursor-pointer rounded-md hover:bg-muted transition-colors",
          className
        )}
        onClick={handleClick}
      >
        <Bell className="h-4 w-4" />
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
        
        {/* Connection status indicator */}
        <div 
          className={cn(
            "absolute -bottom-1 -right-1 h-2 w-2 rounded-full",
            isConnected ? "bg-green-500" : "bg-red-500"
          )}
          title={isConnected ? "Connected" : "Disconnected"}
        />
      </div>

      <NotificationCenter 
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />
    </>
  );
}; 