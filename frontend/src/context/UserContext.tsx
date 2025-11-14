import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from "react";
import axios from "@/lib/axios";
import { useAuth } from "./AuthContext";
import { User } from "@/models/User";

interface UserContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { loggedIn, authChecked } = useAuth();
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);

  const fetchUser = useCallback(async () => {
    if (!loggedIn) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;

    try {
      const response = await axios.get<User>("/api/me");
      setUser(response.data);
    } catch (error) {
      setUser(null);
      // Note: AuthContext already checked auth, so this shouldn't happen
      // If it does, it means the session expired between checks
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [loggedIn]);

  const refreshUser = useCallback(async () => {
    if (!loggedIn) return;
    setLoading(true);
    hasFetchedRef.current = false; // Allow refetch
    await fetchUser();
  }, [loggedIn, fetchUser]);

  // Fetch user only once when auth is checked and logged in
  useEffect(() => {
    if (!authChecked) return;

    if (loggedIn && !hasFetchedRef.current && !isFetchingRef.current) {
      hasFetchedRef.current = true;
      fetchUser();
    } else if (!loggedIn) {
      hasFetchedRef.current = false;
      isFetchingRef.current = false;
      setUser(null);
      setLoading(false);
    }
    // Note: fetchUser is intentionally omitted from dependencies to prevent re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, loggedIn]);

  const value = useMemo(() => ({ user, loading, refreshUser }), [user, loading, refreshUser]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
