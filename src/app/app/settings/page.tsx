'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to AI Providers as the default settings page
    router.replace('/app/settings/ai-providers')
  }, [router])

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-6 h-6 animate-spin rounded-full border-2 border-current border-t-transparent mx-auto mb-2" />
        <p className="text-sm text-gray-600">Loading settings...</p>
      </div>
    </div>
  )
}