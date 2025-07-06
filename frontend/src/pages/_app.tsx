import type { AppProps } from 'next/app';
import Sidebar from '@/components/Sidebar';
import { AuthProvider } from '@/context/AuthContext';
// import { ThemeProvider } from '@/context/ThemeContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      {/* <ThemeProvider> */}
        <div className="flex">
          <Sidebar />
          <div className="flex-1">
            <Component {...pageProps} />
          </div>
        </div>
      {/* </ThemeProvider> */}
    </AuthProvider>
  );
}
