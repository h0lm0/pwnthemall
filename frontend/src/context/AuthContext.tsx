import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface AuthContextType {
  loggedIn: boolean;
  login: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  loggedIn: false,
  login: () => {},
  logout: async () => {},
  checkAuth: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loggedIn, setLoggedIn] = useState(false);

  const checkAuth = async () => {
    try {
      await axios.get('/api/pwn');
      setLoggedIn(true);
    } catch {
      setLoggedIn(false);
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
    }
  };

  return (
    <AuthContext.Provider value={{ loggedIn, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
