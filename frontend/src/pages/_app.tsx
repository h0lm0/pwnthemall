import App, { AppProps, AppContext } from 'next/app'
import { SidebarProvider, SidebarInset, SIDEBAR_COOKIE_NAME } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/components/theme-provider'
import '../styles/globals.css';
import { CookieConsent } from "@/components/ui/CookieConsent";

interface MyAppProps extends AppProps {
  sidebarDefaultOpen: boolean
}

function MyApp({ Component, pageProps, sidebarDefaultOpen }: MyAppProps) {
  return (
    <AuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
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
          indigo: "theme-indigo",
          zinc: "theme-zinc",
          blue: "theme-blue",
          green: "theme-green",
          yellow: "theme-yellow",
          pink: "theme-pink",
          teal: "theme-teal",
          sky: "theme-sky",
          lavender: "theme-lavender",
          peach: "theme-peach",
          flamingo: "theme-flamingo",
          mauve: "theme-mauve",
          maroon: "theme-maroon",
          red: "theme-red",
          rosewater: "theme-rosewater",
          sapphire: "theme-sapphire",
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

export default MyApp
