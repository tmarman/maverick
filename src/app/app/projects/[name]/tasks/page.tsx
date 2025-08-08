'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import ProjectShell from '@/components/ProjectShell'
import { SimpleWorkItemCanvas } from '@/components/SimpleWorkItemCanvas'
import { ProjectTreeSidebar } from '@/components/ProjectTreeSidebar'
import ProjectSetupLoader from '@/components/ProjectSetupLoader'
import { usePageTitle, PAGE_TITLES } from '@/hooks/use-page-title'

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
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [setupError, setSetupError] = useState<string | null>(null)

  // Set page title
  usePageTitle(PAGE_TITLES.projectTasks(projectName))

  useEffect(() => {
    if (projectName) {
      loadProject()
    }
  }, [projectName])

  const loadProject = async () => {
    try {
      setLoading(true)
      setSetupError(null)
      
      console.log('🔍 DEPLOYMENT DEBUG: Loading project with name:', projectName)
      console.log('🔍 DEPLOYMENT DEBUG: Current pathname:', window.location.pathname)
      console.log('🔍 DEPLOYMENT DEBUG: Route params:', params)
      console.log('🔍 DEPLOYMENT DEBUG: Environment:', {
        NODE_ENV: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 50)
      })
      
      const response = await fetch(`/api/projects/${projectName}`)
      
      console.log('🔍 DEPLOYMENT DEBUG: API response status:', response.status)
      console.log('🔍 DEPLOYMENT DEBUG: API URL called:', `/api/projects/${projectName}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 DEPLOYMENT DEBUG: Project data received:', data)
        setProject(data.project)
        
        // Check if this project needs setup by trying to load work items
        await checkProjectSetup(projectName)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('🔍 DEPLOYMENT DEBUG: Failed to load project:', response.status, errorData)
        console.error('🔍 DEPLOYMENT DEBUG: Error details:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          errorData
        })
        
        // If project not found, but we're looking for maverick, it might need setup
        if (response.status === 404 && projectName.toLowerCase() === 'maverick') {
          await attemptProjectSetup(projectName)
        }
      }
    } catch (error) {
      console.error('Error loading project:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkProjectSetup = async (projectName: string) => {
    // Try to load work items to see if project structure exists
    try {
      console.log('🔍 DEPLOYMENT DEBUG: Checking project setup by loading work items')
      const workItemsResponse = await fetch(`/api/projects/${projectName}/work-items`)
      
      console.log('🔍 DEPLOYMENT DEBUG: Work items response status:', workItemsResponse.status)
      
      if (!workItemsResponse.ok) {
        const errorData = await workItemsResponse.json().catch(() => ({}))
        
        // Check if this is a "project needs setup" error
        if (errorData.error && errorData.error.includes('does not exist')) {
          console.log('Project needs initialization, attempting setup...')
          await attemptProjectSetup(projectName)
        }
      }
    } catch (error) {
      console.error('Error checking project setup:', error)
    }
  }

  const attemptProjectSetup = async (projectName: string) => {
    try {
      setIsSettingUp(true)
      console.log(`🚀 Setting up project: ${projectName}`)
      
      const setupResponse = await fetch(`/api/projects/${projectName}/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (setupResponse.ok) {
        const setupData = await setupResponse.json()
        console.log('✅ Project setup completed:', setupData)
        
        // Reload project data
        const projectResponse = await fetch(`/api/projects/${projectName}`)
        if (projectResponse.ok) {
          const data = await projectResponse.json()
          setProject(data.project)
        }
      } else {
        const errorData = await setupResponse.json().catch(() => ({}))
        setSetupError(errorData.error || 'Failed to setup project')
        console.error('❌ Project setup failed:', errorData)
      }
    } catch (error) {
      console.error('Error during project setup:', error)
      setSetupError('Setup failed due to network error')
    } finally {
      setIsSettingUp(false)
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
      <ProjectShell>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h2>
          <p className="text-gray-600">The project you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </ProjectShell>
    )
  }


  return (
    <>
      <ProjectSetupLoader 
        projectName={projectName}
        isVisible={isSettingUp}
        onComplete={() => setIsSettingUp(false)}
      />
      
      <ProjectShell sidebarContent={<ProjectTreeSidebar project={project} currentPage="tasks" />}>
        <div className="h-full p-6">
          {setupError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                <strong>Setup Error:</strong> {setupError}
              </p>
              <button 
                onClick={() => attemptProjectSetup(projectName)}
                className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
              >
                Retry Setup
              </button>
            </div>
          )}
          <SimpleWorkItemCanvas project={project} className="h-full" />
        </div>
      </ProjectShell>
    </>
  )
}