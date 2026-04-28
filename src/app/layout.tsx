import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TravelMatch',
  description: 'מצא שותף לנחיתה רכה — לפני שאתה בכלל נוחת',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <div style={{ maxWidth: 430, margin: '0 auto', height: '100%', position: 'relative', overflow: 'hidden' }}>
          {children}
        </div>
      </body>
    </html>
  )
}
