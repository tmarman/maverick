'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import CockpitShell from '@/components/CockpitShell'

interface Project {
  id: string
  name: string
  description?: string
  type: string
  status: string
  owner: string
  repositoryUrl?: string
  workspacePath?: string
  maverickConfig?: {
    hasStructure: boolean
    templateUsed: string | null
    customTheme: string | null
    aiInstructions: string | null
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
  createdAt: string
  updatedAt: string
}

type ViewMode = 'dashboard' | 'board' | 'list' | 'chat'

function CockpitPageContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
    
    // Check URL parameters for pre-selected project
    const projectId = searchParams.get('project')
    if (projectId) setSelectedProject(projectId)
  }, [searchParams])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/projects')
      
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      } else {
        console.error('Failed to fetch projects')
        setProjects([])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const selectedProjectData = projects.find(p => p.id === selectedProject)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'bg-yellow-100 text-yellow-800'
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'ON_HOLD': return 'bg-orange-100 text-orange-800'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'AI_PLATFORM': return '🤖'
      case 'GITHUB_REPOSITORY': return '📁'
      case 'SAAS_PRODUCT': return '💻'
      case 'SQUARE_APP': return '💳'
      case 'STARTUP_ROOT': return '🚀'
      default: return '📦'
    }
  }

  const customSidebarContent = (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Quick Actions */}
      <div className="px-4 py-3 border-b border-border-standard">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {/* TODO: Create new project flow */}}
            className="flex items-center justify-center px-3 py-2 bg-accent-primary text-text-inverse rounded-md text-xs font-medium hover:bg-accent-hover transition-colors flex-1"
          >
            <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Project
          </button>
          <button
            onClick={() => router.push('/app/repositories')}
            className="flex items-center justify-center px-3 py-2 bg-background-secondary text-text-secondary rounded-md text-xs font-medium hover:bg-background-tertiary transition-colors flex-1"
          >
            <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Import
          </button>
        </div>
      </div>

      {/* Projects Navigation */}
      <nav className="flex-1 px-4 overflow-y-auto">
        <div className="space-y-1 py-4">
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wide px-2 mb-3">
            Projects ({projects.length})
          </div>
          
          {projects.map((project) => {
            const isSelected = selectedProject === project.id
            
            return (
              <div key={project.id} className="relative">
                <button
                  onClick={() => setSelectedProject(project.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group ${
                    isSelected
                      ? 'bg-accent-primary text-text-inverse'
                      : 'hover:bg-background-secondary text-text-primary'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="text-sm">{getTypeIcon(project.type)}</span>
                      <span className="font-medium text-sm truncate">{project.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${getStatusColor(project.status)} ${isSelected ? 'opacity-80' : ''}`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                  {project.description && (
                    <p className={`text-xs mt-1 truncate ${isSelected ? 'text-text-inverse/70' : 'text-text-muted'}`}>
                      {project.description}
                    </p>
                  )}
                  {project.maverickConfig?.hasStructure && (
                    <div className={`flex items-center mt-1 text-xs ${isSelected ? 'text-text-inverse/60' : 'text-text-muted'}`}>
                      <span className="mr-1">✨</span>
                      <span>.maverick ready</span>
                    </div>
                  )}
                </button>
              </div>
            )
          })}
          
          {projects.length === 0 && (
            <div className="text-center py-8 px-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">No projects yet</p>
              <p className="text-xs text-gray-500 mb-3">Create your first project to get started</p>
              <button
                onClick={() => router.push('/app/repositories')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Import Repository
              </button>
            </div>
          )}
        </div>
      </nav>
    </div>
  )

  if (loading) {
    return (
      <CockpitShell>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </CockpitShell>
    )
  }

  return (
    <CockpitShell sidebarContent={customSidebarContent}>
      <div className="h-full flex flex-col">
        {/* Header Bar */}
        <div className="h-16 bg-background-primary border-b border-border-standard flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center space-x-4">
            {selectedProjectData ? (
              <>
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getTypeIcon(selectedProjectData.type)}</span>
                  <h1 className="text-lg font-semibold text-gray-900">{selectedProjectData.name}</h1>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedProjectData.status)}`}>
                    {selectedProjectData.status}
                  </span>
                </div>
              </>
            ) : (
              <h1 className="text-lg font-semibold text-gray-900">Cockpit</h1>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {selectedProject && (
              <button 
                onClick={() => router.push(`/app/projects/${selectedProject}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>Open Project</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {!selectedProject ? (
            <div className="h-full flex items-center justify-center">
              <div className="max-w-4xl w-full">
                {/* Main Chat Interface */}
                <div className="text-center mb-12">
                  <div className="text-6xl mb-6">🚀</div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    What do you want to build today?
                  </h1>
                  <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
                    Describe your idea and I'll help you bring it to life with AI-powered development tools.
                  </p>
                  
                  {/* Chat Input */}
                  <div className="max-w-2xl mx-auto mb-12">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Describe what you want to build..."
                        className="w-full px-6 py-4 text-lg border-2 border-border-standard rounded-2xl focus:outline-none focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/10 transition-all duration-200"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            // TODO: Handle chat submission
                            console.log('Chat submitted:', (e.target as HTMLInputElement).value)
                          }
                        }}
                      />
                      <button
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-accent-primary text-text-inverse rounded-xl hover:bg-accent-hover transition-colors font-medium"
                        onClick={() => {
                          // TODO: Handle chat submission
                          console.log('Chat button clicked')
                        }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Suggestions */}
                <div className="max-w-3xl mx-auto">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
                    Or try one of these ideas:
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                    {[
                      {
                        title: "Build a new product",
                        icon: "🚀",
                        description: "Start a complete product with .maverick structure",
                        prompt: "I want to build a new product from scratch with proper workspace structure"
                      },
                      {
                        title: "Create a Square app",
                        icon: "💳",
                        description: "Payment processing and POS integration",
                        prompt: "I want to create a Square application with payments, inventory, and customer management"
                      },
                      {
                        title: "Import GitHub repo",
                        icon: "📁",
                        description: "Turn existing repo into Maverick project",
                        prompt: "I want to import my GitHub repository and add .maverick structure to it"
                      },
                      {
                        title: "Start a business",
                        icon: "🏢",
                        description: "Full business formation with legal setup",
                        prompt: "I want to start a business with incorporation, banking, and development infrastructure"
                      }
                    ].map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          // TODO: Handle suggestion click
                          console.log('Suggestion clicked:', suggestion.prompt)
                        }}
                        className="p-6 border border-border-standard rounded-xl hover:border-accent-primary hover:bg-accent-primary/5 transition-all duration-200 text-left group"
                      >
                        <div className="text-3xl mb-3">{suggestion.icon}</div>
                        <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-accent-primary">
                          {suggestion.title}
                        </h4>
                        <p className="text-sm text-text-secondary">
                          {suggestion.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Options */}
                <div className="max-w-3xl mx-auto text-center">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                    <h4 className="font-semibold text-blue-900 mb-3">🌀 The Maverick Difference</h4>
                    <p className="text-blue-800 text-sm">
                      Every GitHub repository becomes a top-level project with .maverick structure. 
                      Custom themes, AI instructions, and team configuration - all version controlled 
                      and extensible. Your project structure IS your system architecture.
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center gap-6 text-sm text-text-secondary">
                    <span>Explore more options:</span>
                    <button
                      onClick={() => router.push('/app/repositories')}
                      className="text-accent-primary hover:text-accent-hover font-medium underline"
                    >
                      Browse existing projects
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => router.push('/docs/templates')}
                      className="text-accent-primary hover:text-accent-hover font-medium underline"
                    >
                      View template gallery
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => router.push('/docs')}
                      className="text-accent-primary hover:text-accent-hover font-medium underline"
                    >
                      Read documentation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Project Dashboard
                </h3>
                <p className="text-gray-500 mb-6">
                  Click "Open Project" above to access the full project interface with work items, chat, and development tools.
                </p>
                <button
                  onClick={() => router.push(`/app/projects/${selectedProject}`)}
                  className="px-6 py-3 bg-accent-primary text-text-inverse rounded-lg hover:bg-accent-hover transition-colors font-medium"
                >
                  Open {selectedProjectData?.name}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </CockpitShell>
  )
}

export default function CockpitPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <CockpitPageContent />
    </Suspense>
  )
}