'use client'

import { useState, useEffect } from 'react'

interface Project {
  id: string
  name: string
  description: string | null
  type: string
  status: string
  createdAt: Date
  _count: {
    documents: number
    features: number
  }
}

interface ProjectListProps {
  businessId: string
  selectedProject: string | null
  onSelectProject: (projectId: string) => void
}

export function ProjectList({ businessId, selectedProject, onSelectProject }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (businessId) {
      fetchProjects()
    }
  }, [businessId])

  const fetchProjects = async () => {
    try {
      const response = await fetch(`/api/businesses/${businessId}/projects`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      } else {
        console.error('Failed to fetch projects')
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProjectIcon = (type: string) => {
    const icons = {
      SOFTWARE: '💻',
      MARKETING: '📢',
      OPERATIONS: '⚙️',
      LEGAL: '⚖️',
      FINANCIAL: '💰',
      RESEARCH: '🔬',
      CONTENT: '📝'
    }
    return icons[type as keyof typeof icons] || '📁'
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-20 bg-background-tertiary rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-3xl mb-2">📁</div>
        <p className="text-text-secondary text-sm">No projects yet</p>
        <button className="mt-3 px-3 py-2 bg-accent-primary text-white rounded-lg text-sm hover:bg-accent-hover">
          Create Project
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => (
        <div
          key={project.id}
          onClick={() => onSelectProject(project.id)}
          className={`p-3 rounded-lg cursor-pointer transition-colors ${
            selectedProject === project.id
              ? 'bg-accent-primary bg-opacity-10 border border-accent-primary'
              : 'bg-background-tertiary hover:bg-border-subtle'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div className="text-lg">{getProjectIcon(project.type)}</div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-text-primary text-sm truncate">{project.name}</h4>
              {project.description && (
                <p className="text-xs text-text-secondary mt-1 line-clamp-2">{project.description}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  project.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800'
                    : project.status === 'PLANNING'
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {project.status}
                </span>
                <div className="flex items-center space-x-2 text-xs text-text-muted">
                  <span>{project._count.documents} docs</span>
                  <span>{project._count.features} features</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}