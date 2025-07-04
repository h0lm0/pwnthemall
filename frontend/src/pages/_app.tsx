import type { AppProps } from 'next/app';
import Navbar from '@/components/Navbar';
import { useState, useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <AuthProvider>
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <Component {...pageProps} />
    </AuthProvider>
  );
}
