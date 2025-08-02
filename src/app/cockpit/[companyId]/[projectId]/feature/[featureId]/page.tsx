'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react'

interface FeaturePageProps {
  params: Promise<{
    companyId: string
    projectId: string
    featureId: string
  }>
}

export default function FeaturePage({ params }: FeaturePageProps) {
  useEffect(() => {
    // Handle async params
    const handleRedirect = async () => {
      const resolvedParams = await params
      // Redirect to main cockpit with feature selected in chat view
      redirect(`/cockpit?company=${resolvedParams.companyId}&project=${resolvedParams.projectId}&view=chat&feature=${resolvedParams.featureId}`)
    }
    
    handleRedirect()
  }, [params])

  return null
}