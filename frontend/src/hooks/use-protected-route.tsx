import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";

/**
 * Custom hook for protected pages that require authentication
 * Automatically redirects to login if not authenticated
 */
export function useProtectedRoute() {
  const router = useRouter();
  const { loggedIn, checkAuth, authChecked } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authChecked && !loggedIn) {
      router.replace("/login");
    }
  }, [authChecked, loggedIn, router]);

  return {
    loggedIn,
    authChecked,
    loading: !authChecked,
  };
}
