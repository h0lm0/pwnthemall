import App, { AppProps, AppContext } from 'next/app'
import { SidebarProvider, SidebarInset, SIDEBAR_COOKIE_NAME } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/components/theme-provider'
import '../styles/globals.css';
import { CookieConsent } from "@/components/ui/CookieConsent";
import { useEffect, useState } from 'react';
import { LanguageProvider } from '@/context/LanguageContext';

interface MyAppProps extends AppProps {
  sidebarDefaultOpen: boolean
}

export default function MyApp({ Component, pageProps, sidebarDefaultOpen }: MyAppProps) {
  // Custom system theme mapping
  const [systemTheme, setSystemTheme] = useState<'latte' | 'slate'>('latte');
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const updateTheme = () => setSystemTheme(mq.matches ? 'slate' : 'latte');
      updateTheme();
      mq.addEventListener('change', updateTheme);
      return () => mq.removeEventListener('change', updateTheme);
    }
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme={systemTheme}
          enableSystem={false}
          value={{
            light: "light",
            dark: "dark",
            latte: "theme-latte",
            frappe: "theme-frappe",
            macchiato: "theme-macchiato",
            mocha: "theme-mocha",
            slate: "theme-slate",
            rose: "theme-rose",
            emerald: "theme-emerald",
            cyan: "theme-cyan",
            violet: "theme-violet",
            orange: "theme-orange",
          }}
        >
          <SidebarProvider defaultOpen={sidebarDefaultOpen}>
            <AppSidebar />
            <SidebarInset>
              <Component {...pageProps} />
              <CookieConsent />
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  const appProps = await App.getInitialProps(appContext)
  let sidebarDefaultOpen = true
  const cookie = appContext.ctx.req?.headers.cookie
  if (cookie) {
    const match = cookie.match(new RegExp(`${SIDEBAR_COOKIE_NAME}=(true|false)`))
    if (match) sidebarDefaultOpen = match[1] === 'true'
  }
  return { ...appProps, sidebarDefaultOpen }
}
