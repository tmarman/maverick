'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import CockpitShell from '@/components/CockpitShell'
import { usePageTitle, PAGE_TITLES } from '@/hooks/use-page-title'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Github, 
  Search, 
  Star, 
  GitFork, 
  AlertCircle,
  ExternalLink,
  Plus,
  Calendar,
  Code,
  RefreshCw,
  Building,
  User,
  Lock
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

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

interface Business {
  id: string
  name: string
  description?: string
}

export default function RepositoriesPage() {
  // Set page title
  usePageTitle(PAGE_TITLES.repositories)

  const { data: session } = useSession()
  const router = useRouter()
  const [repositories, setRepositories] = useState<GitHubRepository[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [githubConnected, setGithubConnected] = useState<boolean | null>(null)
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepository | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load all repositories (no pagination)
      const reposResponse = await fetch('/api/github/repositories?sort=updated')

      if (reposResponse.ok) {
        const reposData = await reposResponse.json()
        setRepositories(reposData.repositories || [])
        setGithubConnected(true)
      } else {
        const repoError = await reposResponse.json()
        console.error('Failed to load repositories:', repoError)
        if (repoError.error === 'GitHub not connected') {
          setGithubConnected(false)
          setRepositories([])
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshRepositories = () => {
    setRepositories([])
    loadData()
  }

  const filteredRepositories = repositories.filter(repo => 
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openImportDialog = (repo: GitHubRepository) => {
    setSelectedRepo(repo)
    setProjectName(repo.name)
    setProjectDescription(repo.description || '')
    setShowImportDialog(true)
  }

  const importRepository = async () => {
    if (!selectedRepo || !projectName.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please enter a project name.',
        variant: 'destructive'
      })
      return
    }

    try {
      setImporting(selectedRepo.id.toString())

      // Create project directly in user namespace
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName.trim(),
          description: projectDescription.trim(),
          type: 'GITHUB_REPOSITORY',
          status: 'ACTIVE',
          repositoryUrl: selectedRepo.html_url,
          githubRepoId: selectedRepo.id.toString(),
          defaultBranch: selectedRepo.default_branch,
          githubConfig: {
            owner: selectedRepo.owner.login,
            repo: selectedRepo.name,
            full_name: selectedRepo.full_name,
            clone_url: selectedRepo.clone_url,
            ssh_url: selectedRepo.ssh_url,
            language: selectedRepo.language,
            private: selectedRepo.private,
            stars: selectedRepo.stargazers_count,
            forks: selectedRepo.forks_count
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Repository imported',
          description: `Successfully imported ${selectedRepo.full_name} as project: ${projectName}`
        })
        
        // Close dialog and reset form
        setShowImportDialog(false)
        setSelectedRepo(null)
        setProjectName('')
        setProjectDescription('')
        
        // Navigate to the new project using project ID (name-based)
        router.push(`/app/projects/${data.project.id}`)
      } else {
        const error = await response.json()
        toast({
          title: 'Import failed',
          description: error.message || 'Failed to import repository',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error importing repository:', error)
      toast({
        title: 'Import failed',
        description: 'Failed to import repository',
        variant: 'destructive'
      })
    } finally {
      setImporting(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatSize = (sizeKB: number) => {
    if (sizeKB < 1024) return `${sizeKB} KB`
    if (sizeKB < 1024 * 1024) return `${(sizeKB / 1024).toFixed(1)} MB`
    return `${(sizeKB / (1024 * 1024)).toFixed(1)} GB`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (githubConnected === false) {
    return (
      <div className="text-center py-12">
        <Github className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">GitHub Not Connected</h2>
        <p className="text-gray-600 mb-6">
          Connect your GitHub account to browse and import your repositories
        </p>
        <Button onClick={() => router.push('/app/import/github')}>
          <Github className="w-4 h-4 mr-2" />
          Connect GitHub
        </Button>
      </div>
    )
  }

  return (
    <CockpitShell title="Import Repository">
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Import Repository</h1>
            <p className="text-text-secondary mt-1">
              Select a repository to add to your projects
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={refreshRepositories} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        
        {repositories.length > 0 && (
          <div className="text-sm text-text-muted">
            {repositories.length} repositories
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search repositories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Repositories List */}
      {filteredRepositories.length === 0 ? (
        <div className="text-center py-12">
          <Github className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {repositories.length === 0 ? 'No repositories found' : 'No matching repositories'}
          </h3>
          <p className="text-gray-600">
            {repositories.length === 0 
              ? 'You don\'t have any GitHub repositories yet'
              : 'Try adjusting your search terms'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredRepositories.map((repo) => (
              <div key={repo.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  {/* Repository Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {repo.owner.type === 'Organization' ? (
                        <Building className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      ) : (
                        <User className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      )}
                      
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{repo.name}</h3>
                        {repo.private && (
                          <Lock className="w-3 h-3 text-gray-500" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        {repo.language && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            {repo.language}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {repo.stargazers_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <GitFork className="w-3 h-3" />
                          {repo.forks_count}
                        </div>
                        {repo.open_issues_count > 0 && (
                          <div className="flex items-center gap-1 text-orange-600">
                            <AlertCircle className="w-3 h-3" />
                            {repo.open_issues_count}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{repo.full_name}</p>
                    
                    {repo.description && (
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">{repo.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Updated {formatDate(repo.updated_at)}</span>
                      <span>{formatSize(repo.size)}</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(repo.html_url, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openImportDialog(repo)}
                      disabled={importing === repo.id.toString()}
                    >
                      {importing === repo.id.toString() ? (
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Plus className="w-3 h-3 mr-1" />
                      )}
                      Import
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-lg backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Import Repository as Project</DialogTitle>
          </DialogHeader>
          {selectedRepo && (
            <div className="space-y-6 pt-4">
              {/* Repository Info */}
              <div className="p-4 bg-gradient-to-r from-blue-50/90 to-purple-50/90 backdrop-blur-sm rounded-xl border border-blue-200/50">
                <div className="flex items-center gap-2 mb-3">
                  <Github className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">{selectedRepo.full_name}</span>
                  {selectedRepo.private && (
                    <Badge variant="outline" className="text-xs">Private</Badge>
                  )}
                </div>
                {selectedRepo.description && (
                  <p className="text-sm text-blue-800 mb-3">{selectedRepo.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-blue-700">
                  {selectedRepo.language && (
                    <span>📄 {selectedRepo.language}</span>
                  )}
                  <span>⭐ {selectedRepo.stargazers_count}</span>
                  <span>🔄 {selectedRepo.forks_count}</span>
                </div>
              </div>


              {/* Project Configuration */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Project Name</label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name..."
                    className="backdrop-blur-sm bg-white/60 border-gray-200/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Description (Optional)</label>
                  <Input
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Describe your project..."
                    className="backdrop-blur-sm bg-white/60 border-gray-200/50"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/50">
                <Button
                  variant="outline"
                  onClick={() => setShowImportDialog(false)}
                  disabled={importing === selectedRepo.id.toString()}
                  className="backdrop-blur-sm bg-white/60"
                >
                  Cancel
                </Button>
                <Button
                  onClick={importRepository}
                  disabled={importing === selectedRepo.id.toString() || !projectName.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {importing === selectedRepo.id.toString() && (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Import Project
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </CockpitShell>
  )
}