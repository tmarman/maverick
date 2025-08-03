'use client'

import Link from 'next/link'
import { useState } from 'react'
import { 
  Folder, 
  FolderOpen,
  File,
  ArrowLeft,
  CheckSquare,
  FileText,
  Users,
  BarChart,
  Brain,
  Lightbulb,
  MapPin,
  BookOpen,
  Settings
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  type: string
  status: string
}

interface TreeNode {
  name: string
  type: 'folder' | 'file'
  path: string
  icon?: React.ComponentType<any>
  children?: TreeNode[]
  href?: string
  expanded?: boolean
}

interface ProjectTreeSidebarProps {
  project: Project
  currentPage: string
}

export function ProjectTreeSidebar({ project, currentPage }: ProjectTreeSidebarProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set([
      'project-root', 
      '.maverick', 
      'work-items'
    ])
  )

  // Build tree structure that mirrors .maverick filesystem
  const projectTree: TreeNode = {
    name: project.name,
    type: 'folder',
    path: 'project-root',
    icon: Folder,
    expanded: true,
    children: [
      {
        name: 'Overview',
        type: 'file',
        path: 'overview',
        icon: FileText,
        href: `/app/projects/${project.name}`
      },
      {
        name: 'work-items',
        type: 'folder',
        path: 'work-items',
        icon: Folder,
        children: [
          {
            name: 'Tasks',
            type: 'file',
            path: 'tasks',
            icon: CheckSquare,
            href: `/app/projects/${project.name}/tasks`
          },
          {
            name: 'Vibe Chat',
            type: 'file',
            path: 'vibe',
            icon: Brain,
            href: `/app/projects/${project.name}/vibe`
          }
        ]
      },
      {
        name: '.maverick',
        type: 'folder',
        path: '.maverick',
        icon: Folder,
        children: [
          {
            name: 'learnings',
            type: 'folder',
            path: 'learnings',
            icon: Folder,
            children: [
              {
                name: 'session-learnings.md',
                type: 'file',
                path: 'learnings/session',
                icon: BookOpen,
                href: `/app/projects/${project.name}/learnings`
              }
            ]
          },
          {
            name: 'roadmap',
            type: 'folder',
            path: 'roadmap',
            icon: Folder,
            children: [
              {
                name: 'strategic-roadmap.md',
                type: 'file',
                path: 'roadmap/strategic',
                icon: MapPin,
                href: `/app/projects/${project.name}/roadmap`
              }
            ]
          }
        ]
      },
      {
        name: 'team',
        type: 'folder',
        path: 'team',
        icon: Users,
        children: [
          {
            name: 'Team Members',
            type: 'file',
            path: 'team/members',
            icon: Users,
            href: `/app/projects/${project.name}/team`
          }
        ]
      },
      {
        name: 'analytics',
        type: 'folder', 
        path: 'analytics',
        icon: BarChart,
        children: [
          {
            name: 'Project Analytics',
            type: 'file',
            path: 'analytics/overview',
            icon: BarChart,
            href: `/app/projects/${project.name}/analytics`
          }
        ]
      }
    ]
  }

  const toggleExpanded = (path: string) => {
    const newExpanded = new Set(expandedNodes)
    if (expandedNodes.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedNodes(newExpanded)
  }

  const renderTreeNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.path)
    const hasChildren = node.children && node.children.length > 0
    const isActive = currentPage === node.path || node.href?.includes(currentPage)
    
    const Icon = node.icon || (node.type === 'folder' ? Folder : File)
    const FolderIcon = node.type === 'folder' ? (isExpanded ? FolderOpen : Folder) : File

    return (
      <div key={node.path}>
        <div
          className={`flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer text-sm ${
            isActive ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(node.path)
            }
          }}
        >
          <div className="flex items-center flex-1">
            {hasChildren && (
              <div className="w-4 h-4 mr-1 flex items-center justify-center">
                {isExpanded ? (
                  <div className="w-2 h-2 border-l border-b border-gray-400 transform rotate-45 -translate-y-0.5"></div>
                ) : (
                  <div className="w-2 h-2 border-l border-b border-gray-400 transform -rotate-45 translate-x-0.5"></div>
                )}
              </div>
            )}
            
            <FolderIcon className={`w-4 h-4 mr-2 ${
              node.type === 'folder' ? 'text-blue-600' : 'text-gray-500'
            }`} />
            
            {node.href ? (
              <Link href={node.href} className="flex-1 hover:underline">
                {node.name}
              </Link>
            ) : (
              <span className="flex-1">{node.name}</span>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children?.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <nav className="flex-1 px-2 py-4">
      {/* Back to Projects */}
      <div className="mb-4 px-2">
        <Link
          href="/app"
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>
      </div>

      {/* Project Tree */}
      <div className="border-l-2 border-gray-200 ml-2">
        {renderTreeNode(projectTree)}
      </div>

      {/* Project Info Footer */}
      {project.description && (
        <div className="mt-6 px-2">
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            {project.description}
          </div>
        </div>
      )}
    </nav>
  )
}