import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "@/lib/axios";
import { clearTranslationCache } from "@/context/LanguageContext";

interface AuthContextType {
  loggedIn: boolean;
  login: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  authChecked: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const login = () => {
    setLoggedIn(true);
  };

  const logout = async (redirect = true) => {
    try {
      await axios.post("/api/logout");
    } catch (error) {
      // console.error("Logout failed:", error);
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

  const checkAuth = async () => {
    try {
      await axios.get("/api/me");
      setLoggedIn(true);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        // Check if user is banned
        if (err?.response?.data?.error === "banned") {
          console.log("User is banned, forcing logout");
          await logout(false); // Force logout without redirect
          return;
        }
        
        try {
          await axios.post("/api/refresh");
          setLoggedIn(true);
        } catch (error) {
          console.error("Failed to refresh token:", error);
          await logout(false);
        }
      } else {
        setLoggedIn(false);
      }
    } finally {
      setAuthChecked(true);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

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
