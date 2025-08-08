'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ProjectShell from '@/components/CockpitShell'
import { ProjectTreeSidebar } from '@/components/ProjectTreeSidebar'
import { WorkspaceTeamManager } from '@/components/WorkspaceTeamManager'

interface Project {
  id: string
  name: string
  description?: string
  type: string
  status: string
  repositoryUrl?: string
}

export default function TeamPage() {
  const params = useParams()
  const { data: session } = useSession()
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
      const response = await fetch(`/api/projects/${projectName}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
      }
    } catch (error) {
      console.error('Error loading project:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProjectShell sidebarContent={project ? <ProjectTreeSidebar project={project} currentPage="team" /> : undefined}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </ProjectShell>
    )
  }

  if (!project) {
    return (
      <ProjectShell>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h2>
          <p className="text-gray-600">The project you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </ProjectShell>
    )
  }

  return (
    <ProjectShell sidebarContent={<ProjectTreeSidebar project={project} currentPage="team" />}>
      <div className="p-6">
        <WorkspaceTeamManager 
          projectName={project.name}
          currentUserRole="admin"
        />
      </div>
    </ProjectShell>
  )
}