'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  clone_url: string
  ssh_url: string
  default_branch: string
  language: string | null
  size: number
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  pushed_at: string
  created_at: string
  updated_at: string
  private: boolean
  owner: {
    login: string
    avatar_url: string
    type: string
  }
}

interface GitHubRepositorySelectorProps {
  onRepositorySelect: (repository: GitHubRepository) => void
  onClose: () => void
  selectedRepositoryId?: number
}

export function GitHubRepositorySelector({ 
  onRepositorySelect, 
  onClose, 
  selectedRepositoryId 
}: GitHubRepositorySelectorProps) {
  const { data: session } = useSession()
  const [repositories, setRepositories] = useState<GitHubRepository[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'owner' | 'member'>('owner')

  useEffect(() => {
    fetchRepositories()
  }, [filter])

  const fetchRepositories = async () => {
    if (!session?.user?.email) {
      setError('User not authenticated')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/github/repositories?type=${filter}&sort=updated&per_page=50`)
      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('GitHub account not connected. Please connect your GitHub account first.')
        }
        throw new Error(`Failed to fetch repositories: ${response.statusText}`)
      }

      const data = await response.json()
      setRepositories(data.repositories || [])
    } catch (error) {
      console.error('Error fetching repositories:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch repositories')
    } finally {
      setLoading(false)
    }
  }

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRepositorySelect = (repository: GitHubRepository) => {
    onRepositorySelect(repository)
    onClose()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getLanguageColor = (language: string | null) => {
    const colors: Record<string, string> = {
      'JavaScript': 'bg-yellow-500',
      'TypeScript': 'bg-blue-500',
      'Python': 'bg-green-500',
      'Java': 'bg-red-500',
      'Go': 'bg-cyan-500',
      'Rust': 'bg-orange-500',
      'C++': 'bg-purple-500',
      'C#': 'bg-indigo-500',
      'Ruby': 'bg-red-600',
      'PHP': 'bg-purple-600',
      'Swift': 'bg-orange-600',
      'Kotlin': 'bg-violet-500',
    }
    return colors[language || ''] || 'bg-gray-500'
  }

  if (!session?.user?.githubConnected) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Connect GitHub</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">GitHub Not Connected</h3>
            <p className="text-gray-600 mb-4">
              Connect your GitHub account to access and manage your repositories.
            </p>
            <a
              href="/accounts?tab=integrations"
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Connect GitHub
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Select GitHub Repository</h2>
            <p className="text-gray-600 text-sm mt-1">
              Choose a repository to connect with your Maverick project
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'owner', 'member'] as const).map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterOption
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {filterOption === 'all' ? 'All' : filterOption === 'owner' ? 'Owned' : 'Member'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Repository List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading repositories...</span>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-red-600 mb-4">{error}</div>
              <button
                onClick={fetchRepositories}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredRepositories.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              {searchTerm ? 'No repositories match your search.' : 'No repositories found.'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredRepositories.map((repo) => (
                <div
                  key={repo.id}
                  className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedRepositoryId === repo.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                  onClick={() => handleRepositorySelect(repo)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{repo.name}</h3>
                        {repo.private && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Private
                          </span>
                        )}
                        {repo.language && (
                          <div className="flex items-center gap-1">
                            <div className={`w-3 h-3 rounded-full ${getLanguageColor(repo.language)}`}></div>
                            <span className="text-sm text-gray-600">{repo.language}</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">
                        {repo.description || 'No description provided'}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Updated {formatDate(repo.pushed_at)}</span>
                        <span>⭐ {repo.stargazers_count}</span>
                        <span>🔀 {repo.forks_count}</span>
                        {repo.open_issues_count > 0 && (
                          <span>📋 {repo.open_issues_count} issues</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                        Select
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {filteredRepositories.length} repositories found
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}