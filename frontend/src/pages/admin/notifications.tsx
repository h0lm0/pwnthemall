import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import NotificationsContent from "@/components/admin/NotificationsContent";
import { SentNotification } from "@/models/Notification";

export default function NotificationsPage() {
  const router = useRouter();
  const { loggedIn, checkAuth, authChecked } = useAuth();
  const [role, setRole] = useState("");
  const [notifications, setNotifications] = useState<SentNotification[]>([]);

  const fetchNotifications = () => {
    axios
      .get<SentNotification[]>("/api/admin/notifications")
      .then((res) => setNotifications(res.data || []))
      .catch(() => setNotifications([]));
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (authChecked && loggedIn) {
      axios
        .get("/api/me")
        .then((res) => setRole(res.data.role))
        .catch(() => setRole(""));
    }
  }, [authChecked, loggedIn]);

  useEffect(() => {
    if (!authChecked) return;
    if (!loggedIn) {
      router.replace("/login");
    } else if (role && role !== "admin") {
      router.replace("/pwn");
    } else if (role === "admin") {
      fetchNotifications();
    }
  }, [authChecked, loggedIn, role, router]);

  if (!authChecked) return null;
  if (!loggedIn || role !== "admin") return null;

  return (
    <NotificationsContent
      notifications={notifications}
      onRefresh={fetchNotifications}
    />
  );
} 