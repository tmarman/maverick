// GitHub Integration Types for Maverick
// Supports both monorepo and multi-repo architectures

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  clone_url: string
  ssh_url: string
  default_branch: string
  language: string | null
  languages_url: string
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

export interface RepositoryStructure {
  type: 'monorepo' | 'multi-repo' | 'hybrid'
  mainRepository: GitHubRepository
  submodules?: GitHubRepository[]
  workingDirectory?: string
}

export interface CompanyRepository {
  id: string
  name: string
  description?: string
  repositoryType: 'main' | 'coordination' | 'documentation'
  githubRepository: GitHubRepository
  structure: RepositoryStructure
  projects: ProjectRepository[]
}

export interface ProjectRepository {
  id: string
  name: string
  description?: string
  repositoryType: 'integrated' | 'submodule' | 'independent'
  githubRepository?: GitHubRepository // Optional for integrated projects
  path: string // Path within main repo or standalone
  localWorkingDir?: string
  features: Feature[]
  dependencies?: string[] // Other project IDs this depends on
}

export interface Feature {
  id: string
  title: string
  description?: string
  status: 'planned' | 'in_progress' | 'in_review' | 'done' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  functionalArea: 'Software' | 'Legal' | 'Operations' | 'Marketing'
  githubIssue?: number
  pullRequest?: number
  branch?: string
  assignee?: string
  estimatedEffort?: string
  chatHistory: ChatMessage[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// Repository Setup Workflow Types
export interface RepositorySetupOptions {
  setupType: 'new-company' | 'existing-repo' | 'fork-template'
  companyName: string
  description?: string
  isPrivate: boolean
  template?: 'web-app' | 'mobile-app' | 'api-service' | 'full-stack' | 'custom'
  structure: 'monorepo' | 'multi-repo' | 'hybrid'
  
  // For existing repos
  existingRepository?: GitHubRepository
  
  // For multi-repo setup
  projectRepositories?: {
    name: string
    description: string
    template?: string
    isSubmodule: boolean
  }[]
}

export interface CloneOptions {
  repository: GitHubRepository
  targetDirectory: string
  branch?: string
  depth?: number
  includeSubmodules?: boolean
}

export interface WorkingDirectorySetup {
  companyId: string
  projectId?: string
  baseDirectory: string
  repositoryClones: {
    repository: GitHubRepository
    localPath: string
    isMain: boolean
  }[]
}