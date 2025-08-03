'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { 
  Folder, 
  ArrowLeft,
  CheckSquare,
  FileText,
  GitBranch,
  Code,
  Users,
  BarChart,
  Brain
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
}

interface ProjectSidebarProps {
  project: Project
  currentPage: 'overview' | 'tasks' | 'vibe' | 'team' | 'analytics'
}

export function ProjectSidebar({ project, currentPage }: ProjectSidebarProps) {
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

  const navItems = [
    { id: 'overview', href: `/app/projects/${project.name}`, icon: FileText, label: 'Overview' },
    { id: 'tasks', href: `/app/projects/${project.name}/tasks`, icon: CheckSquare, label: 'Tasks' },
    { id: 'vibe', href: `/app/projects/${project.name}/vibe`, icon: Brain, label: 'Vibe Chat' },
    { id: 'team', href: `/app/projects/${project.name}/team`, icon: Users, label: 'Team' },
    { id: 'analytics', href: `/app/projects/${project.name}/analytics`, icon: BarChart, label: 'Analytics' }
  ]

  return (
    <nav className="flex-1 px-4">
      {/* Back to Projects */}
      <div className="mb-6">
        <Link
          href="/app"
          className="flex items-center space-x-2 text-sm text-text-secondary hover:text-text-primary transition-colors group"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>
      </div>

      {/* Project Header - Windows Explorer Style */}
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <Folder className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-text-primary">{project.name}</h2>
        </div>
        {project.description && (
          <p className="text-sm text-text-muted mt-1 ml-8">{project.description}</p>
        )}
      </div>

      {/* Navigation */}
      <div className="space-y-1">
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wide px-2 mb-3">
          Project Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group block ${
                isActive
                  ? 'bg-accent-primary text-text-inverse' 
                  : 'hover:bg-background-secondary text-text-primary'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}