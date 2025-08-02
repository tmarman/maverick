import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Maverick - AI-Native Founder Platform',
  description: 'The next-generation founder platform for service-based businesses',
  icons: {
    icon: '/design/icon.png',
    shortcut: '/design/icon.png',
    apple: '/design/icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased font-sans">
        <Providers>
          <div className="min-h-full bg-background-primary">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}