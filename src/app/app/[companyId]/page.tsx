'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react'

interface CompanyPageProps {
  params: Promise<{
    companyId: string
  }>
}

export default function CompanyPage({ params }: CompanyPageProps) {
  useEffect(() => {
    // Handle async params
    const handleRedirect = async () => {
      const resolvedParams = await params
      // Redirect to the main cockpit with company selected
      redirect(`/cockpit?company=${resolvedParams.companyId}`)
    }
    
    handleRedirect()
  }, [params])

  return null
}