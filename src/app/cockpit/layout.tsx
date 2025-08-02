'use client'

import { SessionProvider } from 'next-auth/react'

export default function CockpitLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <div className="h-screen overflow-hidden bg-background-primary">
        {children}
      </div>
    </SessionProvider>
  )
}