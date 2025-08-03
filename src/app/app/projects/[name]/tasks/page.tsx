'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import CockpitShell from '@/components/CockpitShell'
import { SimpleWorkItemCanvas } from '@/components/SimpleWorkItemCanvas'
import { ProjectTreeSidebar } from '@/components/ProjectTreeSidebar'

interface Project {
  id: string
  name: string
  description?: string
  type: string
  status: string
  repositoryUrl?: string
  submodulePath?: string
  defaultBranch?: string
}

export default function ProjectTasksPage() {
  const params = useParams()
  const projectName = params?.name as string
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (projectName) {
      loadProject()
    }
  }, [projectName])

  const loadProject = async () => {
    try {
      setLoading(true)
      console.log('Loading project with name:', projectName)
      const response = await fetch(`/api/projects/${projectName}`)
      
      console.log('API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Project data received:', data)
        setProject(data.project)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to load project:', response.status, errorData)
      }
    } catch (error) {
      console.error('Error loading project:', error)
    } finally {
      setLoading(false)
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <CockpitShell>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h2>
          <p className="text-gray-600">The project you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </CockpitShell>
    )
  }


  return (
    <CockpitShell sidebarContent={<ProjectTreeSidebar project={project} currentPage="tasks" />}>
      <div className="h-full p-6">
        <SimpleWorkItemCanvas project={project} className="h-full" />
      </div>
    </CockpitShell>
  )
}