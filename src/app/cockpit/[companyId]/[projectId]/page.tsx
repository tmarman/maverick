'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react'

interface ProjectPageProps {
  params: Promise<{
    companyId: string
    projectId: string
  }>
  searchParams: Promise<{
    view?: 'dashboard' | 'board' | 'list' | 'chat'
  }>
}

export default function ProjectPage({ params, searchParams }: ProjectPageProps) {
  useEffect(() => {
    // Handle async params and searchParams
    const handleRedirect = async () => {
      const resolvedParams = await params
      const resolvedSearchParams = await searchParams
      const view = resolvedSearchParams.view || 'dashboard'
      redirect(`/cockpit?company=${resolvedParams.companyId}&project=${resolvedParams.projectId}&view=${view}`)
    }
    
    handleRedirect()
  }, [params, searchParams])

  return null
}