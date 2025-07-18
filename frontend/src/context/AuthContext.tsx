import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

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

  const checkAuth = async () => {
    try {
      await axios.get('/api/pwn');
      setLoggedIn(true);
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 404) {
        await logout(false);
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

  const logout = async (redirect = true) => {
    try {
      await axios.post('/api/logout');
    } catch (_) {
    } finally {
      setLoggedIn(false);
      if (redirect && typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  };

  return (
    <AuthContext.Provider value={{ loggedIn, login, logout, checkAuth, authChecked }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
