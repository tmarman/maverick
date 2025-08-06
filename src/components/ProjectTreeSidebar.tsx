'use client'

import Link from 'next/link'
import { 
  ArrowLeft,
  CheckSquare,
  FileText,
  Users,
  Home
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
  
  // Simple navigation items - streamlined for chat-first approach
  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      path: 'overview',
      icon: Home,
      href: `/app/projects/${project.name}`,
      description: 'Chat + project overview'
    },
    {
      name: 'Tasks',
      path: 'tasks',
      icon: CheckSquare,
      href: `/app/projects/${project.name}/tasks`,
      description: 'Work items and features'
    },
    {
      name: 'Team',
      path: 'team',
      icon: Users,
      href: `/app/projects/${project.name}/team`,
      description: 'People and AI agents'
    },
    {
      name: 'Reports',
      path: 'reports',
      icon: FileText,
      href: `/app/projects/${project.name}/reports`,
      description: 'AI-generated insights'
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