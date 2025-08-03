'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import CockpitShell from '@/components/CockpitShell'
import { ProjectTreeSidebar } from '@/components/ProjectTreeSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Calendar,
  ExternalLink,
  Github,
  BarChart3,
  Users
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  type: string
  status: string
  repositoryUrl?: string
  submodulePath?: string
  defaultBranch?: string
  githubRepoId?: string
  owner?: string
  workspacePath?: string
  maverickConfig?: {
    hasStructure: boolean
    templateUsed: string
    customTheme: string
    aiInstructions: string
  }
  githubConfig?: {
    owner: string
    repo: string
    full_name: string
    language: string
    private: boolean
    stars: number
    forks: number
  }
}

interface Repository {
  id: number
  name: string
  full_name: string
  description?: string
}

export default function ProjectDetailPage() {
  const params = useParams()
  const projectName = params?.name as string
  const [project, setProject] = useState<Project | null>(null)
  const [repository, setRepository] = useState<Repository | null>(null)
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
        
        // If project has a GitHub repository, load repository details
        if (data.project.repositoryUrl) {
          const repoMatch = data.project.repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
          if (repoMatch) {
            const [, owner, repo] = repoMatch
            setRepository({
              id: parseInt(data.project.githubRepoId || '0'),
              name: repo,
              full_name: `${owner}/${repo}`,
              description: data.project.description
            })
          }
        }
      } else {
        console.error('Failed to load project')
      }
    } catch (error) {
      console.error('Error loading project:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return 'bg-yellow-100 text-yellow-800'
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'ON_HOLD':
        return 'bg-orange-100 text-orange-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'AI_PLATFORM':
        return 'bg-purple-100 text-purple-800'
      case 'GITHUB_REPOSITORY':
        return 'bg-blue-100 text-blue-800'
      case 'SAAS_PRODUCT':
        return 'bg-green-100 text-green-800'
      case 'SQUARE_APP':
        return 'bg-orange-100 text-orange-800'
      case 'STARTUP_ROOT':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
    <CockpitShell sidebarContent={<ProjectTreeSidebar project={project} currentPage="overview" />}>
      <div className="p-6">
        {/* Quick Actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            {project.description && (
              <p className="text-text-secondary text-lg">{project.description}</p>
            )}
            {project.workspacePath && (
              <p className="text-sm text-text-muted mt-1">
                <code className="bg-background-secondary px-2 py-1 rounded text-xs">{project.workspacePath}</code>
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {project.repositoryUrl && (
              <Button variant="outline" size="sm">
                <Github className="w-4 h-4 mr-2" />
                <ExternalLink className="w-4 h-4 mr-2" />
                View Repository
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Overview Content */}
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Type:</span>
                  <Badge className={getTypeColor(project.type)} variant="outline">
                    {project.type}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge className={getStatusColor(project.status)} variant="outline">
                    {project.status.replace('_', ' ')}
                  </Badge>
                </div>
                {project.repositoryUrl && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Repository:</span>
                    <span className="text-sm text-text-secondary">Connected</span>
                  </div>
                )}
                {project.submodulePath && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Submodule Path:</span>
                    <span className="text-sm text-text-secondary">{project.submodulePath}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Work Items:</span>
                  <span className="text-sm font-bold">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">In Progress:</span>
                  <span className="text-sm font-bold">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Completed:</span>
                  <span className="text-sm font-bold">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Team Members:</span>
                  <span className="text-sm font-bold">-</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-text-muted">No recent activity</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CockpitShell>
  )
}