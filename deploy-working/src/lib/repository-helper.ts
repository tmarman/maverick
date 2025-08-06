import path from 'path'
import { promises as fs } from 'fs'

/**
 * Get the local repository path for a user's cloned repository
 */
export async function getUserRepositoryPath(
  userId: string, 
  repositoryFullName: string
): Promise<string | null> {
  const [owner, repo] = repositoryFullName.split('/')
  if (!owner || !repo) {
    return null
  }

  // Construct the expected repository path
  const repositoryPath = path.join(
    '/tmp/maverick/repositories',
    userId,
    repo
  )

  try {
    // Check if the repository directory exists
    const stats = await fs.stat(repositoryPath)
    if (stats.isDirectory()) {
      return repositoryPath
    }
  } catch (error) {
    // Repository doesn't exist or can't be accessed
    return null
  }

  return null
}

/**
 * Get all repository paths for a user
 */
export async function getUserRepositories(userId: string): Promise<string[]> {
  const userDir = path.join('/tmp/maverick/repositories', userId)
  
  try {
    const entries = await fs.readdir(userDir, { withFileTypes: true })
    const repositories: string[] = []
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const repoPath = path.join(userDir, entry.name)
        
        // Verify it's a valid git repository
        try {
          await fs.stat(path.join(repoPath, '.git'))
          repositories.push(repoPath)
        } catch {
          // Not a git repository, skip
        }
      }
    }
    
    return repositories
  } catch (error) {
    // User directory doesn't exist or can't be accessed
    return []
  }
}

/**
 * Check if a repository is cloned for a user
 */
export async function isRepositoryCloned(
  userId: string, 
  repositoryFullName: string
): Promise<boolean> {
  const repositoryPath = await getUserRepositoryPath(userId, repositoryFullName)
  return repositoryPath !== null
}

/**
 * Get repository metadata from the local clone
 */
export async function getRepositoryMetadata(repositoryPath: string): Promise<{
  name: string
  remoteUrl?: string
  defaultBranch?: string
  lastFetch?: Date
} | null> {
  try {
    const repoName = path.basename(repositoryPath)
    
    // Try to get remote URL and other git info
    // This would require git commands which we'll implement later
    
    return {
      name: repoName,
      // TODO: Add git commands to get remote URL and default branch
    }
  } catch (error) {
    return null
  }
}

/**
 * Sanitize repository names for file system paths
 */
export function sanitizeRepositoryName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-_.]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}