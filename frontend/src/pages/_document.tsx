import { ThemeProvider } from '@/components/theme-provider'
import { Html, Head, Main, NextScript } from 'next/document'


export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head />
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >

          {/* <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              try {
                var stored = localStorage.getItem('theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                var dark = stored ? stored === 'dark' : prefersDark;
                var cls = dark ? 'dark-mode' : 'light-mode';
                document.documentElement.classList.add(cls);
                document.body.classList.add(cls);
                window.__initialDarkMode = dark;
                } catch (e) {}
                })();
                `,
                }}
                /> */}
          <Main />
          <NextScript />
        </ThemeProvider>
      </body>
    </Html>
  )
}
