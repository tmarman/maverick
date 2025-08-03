'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import CockpitShell from '@/components/CockpitShell'
import { ProjectTreeSidebar } from '@/components/ProjectTreeSidebar'
import { VibeChat } from '@/components/VibeChat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Brain,
  Sparkles,
  MessageSquare,
  Target,
  Users
} from 'lucide-react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description?: string
  type: string
  status: string
}

export default function VibePage() {
  const params = useParams()
  const projectName = params.name as string
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProject() {
      try {
        const response = await fetch(`/api/projects/${projectName}`)
        if (response.ok) {
          const data = await response.json()
          setProject(data.project)
        } else {
          console.error('Failed to load project')
        }
      } catch (error) {
        console.error('Error loading project:', error)
      } finally {
        setLoading(false)
      }
    }

    if (projectName) {
      loadProject()
    }
  }, [projectName])

  if (loading) {
    return (
      <CockpitShell>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </CockpitShell>
    )
  }

  if (!project) {
    return (
      <CockpitShell>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Project not found</h2>
            <p className="text-gray-600 mt-2">The project "{projectName}" could not be loaded.</p>
            <Link href="/app" className="mt-4 inline-block">
              <Button>Return to Dashboard</Button>
            </Link>
          </div>
        </div>
      </CockpitShell>
    )
  }

  return (
    <CockpitShell sidebarContent={<ProjectTreeSidebar project={project} currentPage="vibe" />}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Vibe Chat
                </h1>
                <p className="text-sm text-gray-600">
                  AI-powered project collaboration
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI Enhanced
              </Badge>
            </div>
          </div>
        </div>

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200 px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-gray-700">
              Describe what you want to build, fix, or improve. I'll help organize everything into actionable tasks.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>Natural Language</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>Smart Tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Team Mentions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vibe Chat Interface */}
        <div className="flex-1 overflow-hidden p-6">
          <VibeChat project={project} className="h-full" />
        </div>
      </div>
    </CockpitShell>
  )
}