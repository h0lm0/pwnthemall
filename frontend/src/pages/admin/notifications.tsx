import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import NotificationsContent from "@/components/admin/NotificationsContent";
import { SentNotification } from "@/models";

export default function NotificationsPage() {
  const { loading, isAdmin } = useAdminAuth();
  const [notifications, setNotifications] = useState<SentNotification[]>([]);

  const fetchNotifications = () => {
    axios
      .get<SentNotification[]>("/api/admin/notifications")
      .then((res) => setNotifications(res.data || []))
      .catch(() => setNotifications([]));
  };

  useEffect(() => {
    if (isAdmin) {
      fetchNotifications();
    }
  }, [isAdmin]);

  if (loading || !isAdmin) return null;

  return (
    <NotificationsContent
      notifications={notifications}
      onRefresh={fetchNotifications}
    />
  );
} 