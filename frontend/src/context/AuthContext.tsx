import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios, { setToken as setAxiosToken } from "@/lib/axios";

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
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const login = (token: string) => {
    setAccessToken(token);
    setAxiosToken(token);
    setLoggedIn(true);
  };

  const logout = async (redirect = true) => {
    try {
      await axios.post("/api/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    }
    setAccessToken(null);
    setAxiosToken(null);
    setLoggedIn(false);
    if (redirect && typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  };

  const checkAuth = async () => {
    try {
      const refreshRes = await axios.post("/api/refresh");
      const newToken = refreshRes.data.access_token;
      setAccessToken(newToken);
      setAxiosToken(newToken);

      await axios.get("/api/pwn");
      setLoggedIn(true);
    } catch (err: any) {
      console.error("checkAuth failed:", err);
      await logout(false);
    } finally {
      setAuthChecked(true);
    }
  };


  useEffect(() => {
    checkAuth();
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
