import App, { AppProps, AppContext } from 'next/app'
import { SidebarProvider, SidebarInset, SIDEBAR_COOKIE_NAME } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/components/theme-provider'
import '../styles/globals.css';

interface MyAppProps extends AppProps {
  sidebarDefaultOpen: boolean
}

function MyApp({ Component, pageProps, sidebarDefaultOpen }: MyAppProps) {
  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <SidebarProvider defaultOpen={sidebarDefaultOpen}>
          <AppSidebar />
          <SidebarInset>
            <Component {...pageProps} />
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
