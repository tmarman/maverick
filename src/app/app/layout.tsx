'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      // Redirect to login with return URL
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-background-primary">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="h-screen flex items-center justify-center bg-background-primary">
        <div className="text-center">
          <p className="text-text-secondary">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <AuthWrapper>
        <div className="h-screen overflow-hidden bg-background-primary text-text-primary">
          {children}
        </div>
      </AuthWrapper>
    </SessionProvider>
  )
}