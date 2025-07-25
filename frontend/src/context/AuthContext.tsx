import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios, { setToken as setAxiosToken } from "@/lib/axios";
import { clearTranslationCache } from "@/context/LanguageContext";

interface AuthContextType {
  loggedIn: boolean;
  login: (token: string) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  authChecked: boolean;
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        // Also set the token in axios
        setAxiosToken(token);
      }
      return token;
    }
    return null;
  });

  const login = (token: string) => {
    setAccessToken(token);
    setAxiosToken(token);
    setLoggedIn(true);
    // Persist token to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  };

  const logout = async (redirect = true) => {
    try {
      await axios.post("/api/logout");
    } catch (error) {
      // console.error("Logout failed:", error);
    }
    setAccessToken(null);
    setAxiosToken(null);
    setLoggedIn(false);
    // Clear token from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
    // Clear any cached data
    clearTranslationCache();
    if (redirect && typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  };

  const checkAuth = async () => {
    try {
      if (accessToken) {
        await axios.get("/api/pwn");
        setLoggedIn(true);
        return;
      } else {
        // No access token, try to refresh from cookies
        try {
          const refreshRes = await axios.post("/api/refresh");
          const newToken = refreshRes.data.access_token;
          setAccessToken(newToken);
          setAxiosToken(newToken);
          setLoggedIn(true);
          // Persist new token to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', newToken);
          }
          return;
        } catch (error) {
          // No valid refresh token, user is not logged in
          setLoggedIn(false);
        }
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        try {
          const refreshRes = await axios.post("/api/refresh");
          const newToken = refreshRes.data.access_token;
          setAccessToken(newToken);
          setAxiosToken(newToken);
          setLoggedIn(true);
          // Persist new token to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', newToken);
          }
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
      value={{ loggedIn, login, logout, checkAuth, authChecked, accessToken }}
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
