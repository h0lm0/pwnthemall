import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

interface AuthContextType {
  loggedIn: boolean;
  login: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  authChecked: boolean;
}

const AuthContext = createContext<AuthContextType>({
  loggedIn: false,
  login: () => {},
  logout: async () => {},
  checkAuth: async () => {},
  authChecked: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  const checkAuth = async () => {
    try {
      await axios.get('/api/pwn');
      setLoggedIn(true);
    } catch (err: any) {
      // Si l'utilisateur n'existe plus ou n'est plus autorisé, on force le logout
      if (err?.response?.status === 401 || err?.response?.status === 404) {
        await logout();
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

  const login = () => setLoggedIn(true);

  const logout = async () => {
    try {
      await axios.post('/api/logout');
    } finally {
      setLoggedIn(false);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{ loggedIn, login, logout, checkAuth, authChecked }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
