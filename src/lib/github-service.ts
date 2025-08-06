// GitHub OAuth and Repository Service
// Handles OAuth integration, repository analysis, and management

import { Octokit } from '@octokit/rest'
import { db } from './database-service'

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

export interface GitHubUser {
  id: number
  login: string
  name: string | null
  email: string | null
  avatar_url: string
  bio: string | null
  company: string | null
  location: string | null
  public_repos: number
  followers: number
  following: number
}

export class GitHubService {
  private octokit: Octokit

  constructor(accessToken: string) {
    this.octokit = new Octokit({
      auth: accessToken,
    })
  }

  // Get authenticated user info
  async getAuthenticatedUser(): Promise<GitHubUser> {
    const { data } = await this.octokit.rest.users.getAuthenticated()
    return data as GitHubUser
  }

  // Get user's repositories
  async getUserRepositories(options: {
    type?: 'all' | 'owner' | 'member'
    sort?: 'created' | 'updated' | 'pushed' | 'full_name'
    direction?: 'asc' | 'desc'
    per_page?: number
    page?: number
  } = {}): Promise<GitHubRepository[]> {
    // If per_page is 100 (our "get all" indicator), fetch all repositories
    if (options.per_page === 100) {
      const allRepos: GitHubRepository[] = []
      let page = 1
      let hasMore = true
      
      while (hasMore) {
        const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
          type: options.type || 'owner',
          sort: options.sort || 'updated',
          direction: options.direction || 'desc',
          per_page: 100, // GitHub API max
          page,
        })
        
        allRepos.push(...(data as GitHubRepository[]))
        hasMore = data.length === 100 // If we got less than 100, we're done
        page++
      }
      
      return allRepos
    }
    
    // Single page request
    const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
      type: options.type || 'owner',
      sort: options.sort || 'updated',
      direction: options.direction || 'desc',
      per_page: options.per_page || 30,
      page: options.page || 1,
    })
    
    return data as GitHubRepository[]
  }

  // Get repository details
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    const { data } = await this.octokit.rest.repos.get({
      owner,
      repo,
    })
    
    return data as GitHubRepository
  }

  // Get repository languages
  async getRepositoryLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    const { data } = await this.octokit.rest.repos.listLanguages({
      owner,
      repo,
    })
    
    return data
  }

  // Get repository file tree
  async getRepositoryTree(owner: string, repo: string, branch = 'main'): Promise<any[]> {
    try {
      const { data } = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: branch,
        recursive: 'true',
      })
      
      return data.tree || []
    } catch (error) {
      // Try 'master' if 'main' doesn't exist
      if (branch === 'main') {
        return this.getRepositoryTree(owner, repo, 'master')
      }
      throw error
    }
  }

  // Get file contents
  async getFileContents(owner: string, repo: string, path: string, branch?: string): Promise<string> {
    const { data } = await this.octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    })
    
    if ('content' in data && data.content) {
      return Buffer.from(data.content, 'base64').toString('utf-8')
    }
    
    throw new Error('File content not found or not a file')
  }

  // Create repository analysis summary
  async analyzeRepository(owner: string, repo: string): Promise<{
    repository: GitHubRepository
    languages: Record<string, number>
    fileStructure: {
      directories: string[]
      importantFiles: string[]
      configFiles: string[]
      documentationFiles: string[]
    }
    metrics: {
      totalFiles: number
      codeFiles: number
      testFiles: number
      configFiles: number
      documentationFiles: number
    }
  }> {
    // Get repository details
    const repository = await this.getRepository(owner, repo)
    
    // Get languages
    const languages = await this.getRepositoryLanguages(owner, repo)
    
    // Get file tree
    const tree = await this.getRepositoryTree(owner, repo, repository.default_branch)
    
    // Analyze file structure
    const directories = new Set<string>()
    const importantFiles: string[] = []
    const configFiles: string[] = []
    const documentationFiles: string[] = []
    
    let totalFiles = 0
    let codeFiles = 0
    let testFiles = 0
    let configFilesCount = 0
    let documentationFilesCount = 0
    
    for (const item of tree) {
      if (item.type === 'tree') {
        directories.add(item.path!)
      } else if (item.type === 'blob') {
        totalFiles++
        const path = item.path!
        const filename = path.split('/').pop()!.toLowerCase()
        
        // Important files
        if (['package.json', 'requirements.txt', 'cargo.toml', 'go.mod', 'pom.xml', 'composer.json'].includes(filename)) {
          importantFiles.push(path)
        }
        
        // Config files
        if (filename.includes('config') || filename.startsWith('.') || 
            ['dockerfile', 'makefile', 'jenkinsfile', 'webpack.config.js', 'vite.config.js', 'tsconfig.json'].includes(filename)) {
          configFiles.push(path)
          configFilesCount++
        }
        
        // Documentation files
        else if (filename.includes('readme') || filename.includes('changelog') || filename.includes('license') ||
                 path.endsWith('.md') || path.endsWith('.rst') || path.endsWith('.txt')) {
          documentationFiles.push(path)
          documentationFilesCount++
        }
        
        // Code files
        else if (path.match(/\.(js|ts|jsx|tsx|py|java|cpp|c|cs|go|rs|php|rb|swift|kt)$/)) {
          codeFiles++
          
          // Test files
          if (path.includes('test') || path.includes('spec') || path.includes('__tests__')) {
            testFiles++
          }
        }
      }
    }
    
    return {
      repository,
      languages,
      fileStructure: {
        directories: Array.from(directories).sort(),
        importantFiles,
        configFiles,
        documentationFiles,
      },
      metrics: {
        totalFiles,
        codeFiles,
        testFiles,
        configFiles: configFilesCount,
        documentationFiles: documentationFilesCount,
      },
    }
  }

  // Get clone command for repository
  getCloneCommand(repository: GitHubRepository, useSSH = false): string {
    const url = useSSH ? repository.ssh_url : repository.clone_url
    return `git clone ${url}`
  }
}

// Get GitHub connection status for a user
export async function getGitHubConnectionStatus(userEmail: string): Promise<{
  connected: boolean
  expired: boolean
  needsReauth: boolean
  username?: string
  scopes?: string[]
  expiresAt?: Date
} | null> {
  try {
    const { prisma } = await import('./prisma')
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { githubConnection: true },
    })
    
    if (!user?.githubConnection) {
      return {
        connected: false,
        expired: false,
        needsReauth: false
      }
    }
    
    const connection = user.githubConnection
    const isExpired = connection.expiresAt && new Date() > connection.expiresAt
    const needsReauth = isExpired && !connection.refreshToken
    
    return {
      connected: true,
      expired: !!isExpired,
      needsReauth,
      username: connection.username,
      scopes: connection.scopes ? JSON.parse(connection.scopes) : [],
      expiresAt: connection.expiresAt
    }
  } catch (error) {
    console.error('Failed to get GitHub connection status:', error)
    return null
  }
}

// Helper function to get GitHub service for a user
export async function getGitHubServiceForUser(userEmail: string): Promise<GitHubService | null> {
  try {
    const { prisma } = await import('./prisma')
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { githubConnection: true },
    })
    
    if (!user?.githubConnection?.accessToken) {
      return null
    }
    
    const connection = user.githubConnection
    
    // Check if token is expired and refresh if needed
    if (connection.expiresAt && new Date() > connection.expiresAt) {
      if (connection.refreshToken) {
        console.log('GitHub token expired, attempting refresh...')
        
        try {
          const refreshedToken = await refreshGitHubToken(connection.refreshToken)
          
          // Update the connection with new token
          await prisma.gitHubConnection.update({
            where: { id: connection.id },
            data: {
              accessToken: refreshedToken.access_token,
              refreshToken: refreshedToken.refresh_token || connection.refreshToken,
              expiresAt: new Date(Date.now() + (refreshedToken.expires_in || 3600) * 1000),
              updatedAt: new Date(),
            },
          })
          
          console.log('GitHub token refreshed successfully')
          return new GitHubService(refreshedToken.access_token)
        } catch (refreshError) {
          console.error('GitHub token refresh failed:', refreshError)
          // Mark connection as expired and requiring reauth
          await prisma.gitHubConnection.update({
            where: { id: connection.id },
            data: {
              // Keep connection but mark it as expired
              updatedAt: new Date(),
            },
          })
          // Return null to indicate authentication is needed
          throw new Error('GitHub token expired and refresh failed. Re-authentication required.')
        }
      } else {
        console.log('GitHub token expired and no refresh token available')
        throw new Error('GitHub token expired. Please reconnect your GitHub account.')
      }
    }
    
    return new GitHubService(connection.accessToken)
  } catch (error) {
    console.error('Failed to get GitHub service for user:', error)
    return null
  }
}

// Refresh GitHub access token using refresh token
async function refreshGitHubToken(refreshToken: string): Promise<{
  access_token: string
  expires_in?: number
  refresh_token?: string
}> {
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  
  if (!clientId || !clientSecret) {
    throw new Error('GitHub OAuth credentials not configured')
  }
  
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  
  if (!response.ok) {
    throw new Error(`GitHub token refresh failed: ${response.status} ${response.statusText}`)
  }
  
  const data = await response.json()
  
  if (data.error) {
    throw new Error(`GitHub token refresh error: ${data.error_description || data.error}`)
  }
  
  return data
}

// Store GitHub connection in database
export async function storeGitHubConnection(
  userId: string,
  githubData: {
    githubId: string
    username: string
    accessToken: string
    refreshToken?: string
    expiresAt?: Date
    scopes: string[]
  }
): Promise<void> {
  try {
    const { prisma } = await import('./prisma')
    
    await prisma.gitHubConnection.upsert({
      where: { userId },
      update: {
        githubId: githubData.githubId,
        username: githubData.username,
        accessToken: githubData.accessToken,
        refreshToken: githubData.refreshToken,
        expiresAt: githubData.expiresAt,
        scopes: JSON.stringify(githubData.scopes),
        updatedAt: new Date(),
      },
      create: {
        userId,
        githubId: githubData.githubId,
        username: githubData.username,
        accessToken: githubData.accessToken,
        refreshToken: githubData.refreshToken,
        expiresAt: githubData.expiresAt,
        scopes: JSON.stringify(githubData.scopes),
      },
    })
  } catch (error) {
    console.error('Failed to store GitHub connection:', error)
    throw error
  }
}