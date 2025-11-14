import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import axios from "@/lib/axios";
import { debugLog, debugError } from "@/lib/debug";
import { clearTranslationCache } from "@/context/LanguageContext";

interface AuthContextType {
  loggedIn: boolean;
  login: () => void;
  logout: (redirect?: boolean) => Promise<void>;
  checkAuth: () => Promise<void>;
  authChecked: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const authCheckedRef = useRef(false);
  const isCheckingRef = useRef(false);

  const login = () => {
    setLoggedIn(true);
  };

  const logout = async (redirect = true) => {
    try {
      await axios.post("/api/logout");
    } catch (error) {
      // debugError("Logout failed:", error);
    }
    setLoggedIn(false);
    // Clear any cached data
    clearTranslationCache();
    
    // Notify all components about the auth change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:refresh'));
    }
    
    if (redirect && typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  };

  const checkAuth = useCallback(async () => {
    if (authCheckedRef.current || isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;

    try {
      await axios.get("/api/me");
      setLoggedIn(true);
    } catch (err: any) {
      setLoggedIn(false);
    } finally {
      authCheckedRef.current = true;
      isCheckingRef.current = false;
      setAuthChecked(true);
    }
  }, []); // No dependencies - function never changes

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Listen for auth refresh events (e.g., after username update, team changes)
  useEffect(() => {
    const handleAuthRefresh = () => {
      checkAuth();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:refresh', handleAuthRefresh);
      return () => {
        window.removeEventListener('auth:refresh', handleAuthRefresh);
      };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ loggedIn, login, logout, checkAuth, authChecked }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
