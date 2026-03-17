import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CampusBridge',
  description: 'Campus community and KTU activity point management — AISAT',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var saved = localStorage.getItem('cb-theme');
                if (saved === 'dark' || saved === 'light') {
                  document.documentElement.setAttribute('data-theme', saved);
                } else {
                  var prefer = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  document.documentElement.setAttribute('data-theme', prefer);
                }
              } catch(e) {}
            })();
          `
        }} />
        {children}
      </body>
    </html>
  )
}