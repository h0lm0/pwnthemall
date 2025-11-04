import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import axios from "@/lib/axios";

/**
 * Custom hook for admin pages that handles authentication and authorization
 * Returns loading state and admin check status
 */
export function useAdminAuth() {
  const router = useRouter();
  const { loggedIn, checkAuth, authChecked } = useAuth();
  const [role, setRole] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fetch user role
  useEffect(() => {
    if (authChecked && loggedIn) {
      axios
        .get("/api/me")
        .then((res) => {
          setRole(res.data.role);
          setIsAdmin(res.data.role === "admin");
        })
        .catch(() => {
          setRole("");
          setIsAdmin(false);
        });
    }
  }, [authChecked, loggedIn]);

  // Handle redirects
  useEffect(() => {
    if (!authChecked) return;
    
    if (!loggedIn) {
      router.replace("/login");
    } else if (role && role !== "admin") {
      router.replace("/pwn");
    } else if (role === "admin") {
      setLoading(false);
    }
  }, [authChecked, loggedIn, role, router]);

  return {
    isAdmin,
    loading: !authChecked || loading,
    role,
  };
}
