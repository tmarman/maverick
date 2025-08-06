'use client'

import Link from 'next/link'
import { 
  ArrowLeft,
  CheckSquare,
  FileText,
  Users,
  BarChart,
  Brain,
  MapPin,
  BookOpen,
  Home,
  Bot
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  type: string
  status: string
}

interface NavItem {
  name: string
  path: string
  icon: React.ComponentType<any>
  href: string
  description?: string
}

interface ProjectTreeSidebarProps {
  project: Project
  currentPage: string
}

export function ProjectTreeSidebar({ project, currentPage }: ProjectTreeSidebarProps) {
  
  // Simple navigation items - no complex tree structure
  const navItems: NavItem[] = [
    {
      name: 'Overview',
      path: 'overview',
      icon: Home,
      href: `/app/projects/${project.name}`,
      description: 'Project summary and status'
    },
    {
      name: 'Tasks',
      path: 'tasks',
      icon: CheckSquare,
      href: `/app/projects/${project.name}/tasks`,
      description: 'Asana-style task management'
    },
    {
      name: 'Vibe Chat',
      path: 'vibe',
      icon: Brain,
      href: `/app/projects/${project.name}/vibe`,
      description: 'AI chat with task creation'
    },
    {
      name: 'AI Agents',
      path: 'agents',
      icon: Bot,
      href: `/app/projects/${project.name}/agents`,
      description: 'Autonomous development agents'
    },
    {
      name: 'Team',
      path: 'team',
      icon: Users,
      href: `/app/projects/${project.name}/team`,
      description: 'Team members and roles'
    },
    {
      name: 'Analytics',
      path: 'analytics',
      icon: BarChart,
      href: `/app/projects/${project.name}/analytics`,
      description: 'Project metrics and insights'
    },
    {
      name: 'Roadmap',
      path: 'roadmap',
      icon: MapPin,
      href: `/app/projects/${project.name}/roadmap`,
      description: 'Strategic planning and milestones'
    },
    {
      name: 'Learnings',
      path: 'learnings',
      icon: BookOpen,
      href: `/app/projects/${project.name}/learnings`,
      description: 'Session notes and insights'
    }
  ]


  return (
    <nav className="flex-1 px-4 py-6">
      {/* Back to Projects */}
      <div className="mb-6">
        <Link
          href="/app"
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>
      </div>

      {/* Project Title */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 truncate">{project.name}</h2>
        {project.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description}</p>
        )}
      </div>

      {/* Simple Navigation */}
      <div className="space-y-1">
        {navItems.map((item) => {
          const isActive = currentPage === item.path || item.href.includes(currentPage)
          const Icon = item.icon
          
          return (
            <Link
              key={item.path}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className={`w-4 h-4 mr-3 ${
                isActive ? 'text-white' : 'text-gray-500'
              }`} />
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                {!isActive && (
                  <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}