import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CampusBridge',
  description: 'Campus community and KTU activity point management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}