/**
 * Project ID Resolution Service
 * Manages the mapping between human-readable project names in URLs 
 * and stable project IDs in the database/backend systems
 */

export interface ProjectReference {
  id: string           // Stable UUID: '550e8400-e29b-41d4-a716-446655440000'
  name: string         // Human-readable: 'maverick'  
  displayName: string  // Pretty name: 'Maverick Platform'
  userId: string       // Owner: 'tim'
  slug: string         // URL slug: 'maverick' (normalized name)
}

export interface UserProjectContext {
  userId: string       // 'tim'
  username: string     // 'tim' (for display)
  projectId: string    // Internal ID
  projectName: string  // URL name 'maverick'
  workspacePath: string // '/Users/tim/dev/square/maverick'
}

class ProjectIdResolver {
  private static instance: ProjectIdResolver
  private projectCache = new Map<string, ProjectReference>()

  static getInstance(): ProjectIdResolver {
    if (!ProjectIdResolver.instance) {
      ProjectIdResolver.instance = new ProjectIdResolver()
    }
    return ProjectIdResolver.instance
  }

  /**
   * Resolve project name from URL to internal project ID
   * URL: /projects/maverick/bootstrap -> Project ID: uuid
   */
  async resolveProjectId(userId: string, projectName: string): Promise<string | null> {
    const cacheKey = `${userId}:${projectName}`
    
    // Check cache first
    const cached = this.projectCache.get(cacheKey)
    if (cached) {
      return cached.id
    }

    try {
      // In a real implementation, this would query the database
      // For now, we'll simulate with known projects
      const projectRef = await this.lookupProject(userId, projectName)
      
      if (projectRef) {
        this.projectCache.set(cacheKey, projectRef)
        return projectRef.id
      }
      
      return null
    } catch (error) {
      console.error('Error resolving project ID:', error)
      return null
    }
  }

  /**
   * Get full project reference from URL parameters
   */
  async getProjectReference(userId: string, projectName: string): Promise<ProjectReference | null> {
    const cacheKey = `${userId}:${projectName}`
    
    const cached = this.projectCache.get(cacheKey)
    if (cached) {
      return cached
    }

    return await this.lookupProject(userId, projectName)
  }

  /**
   * Create user project context for session management
   */
  async createProjectContext(userId: string, projectName: string): Promise<UserProjectContext | null> {
    const projectRef = await this.getProjectReference(userId, projectName)
    if (!projectRef) {
      return null
    }

    return {
      userId,
      username: userId, // For now, username = userId. Later get from user profile
      projectId: projectRef.id,
      projectName: projectRef.name,
      workspacePath: `/Users/${userId}/dev/square/${projectRef.name}` // User-qualified path
    }
  }

  /**
   * Generate session ID using project ID for stability
   */
  generateSessionId(userContext: UserProjectContext, sessionType: string = 'bootstrap'): string {
    return `${userContext.userId}-${userContext.projectId}-${sessionType}-${Date.now()}`
  }

  /**
   * Get workspace paths using project ID for consistency
   */
  getWorkspacePaths(userContext: UserProjectContext) {
    return {
      projectRoot: userContext.workspacePath,
      worktreeBase: `${userContext.workspacePath}/worktrees`,
      sessionData: `${userContext.workspacePath}/.maverick/sessions`,
      artifacts: `${userContext.workspacePath}/.maverick/artifacts`,
      // User-qualified worktree paths
      userWorktrees: `/Users/${userContext.userId}/repos/${userContext.projectName}`
    }
  }

  /**
   * Validate project access for user
   */
  async validateProjectAccess(userId: string, projectId: string): Promise<boolean> {
    try {
      // In real implementation, check database for:
      // 1. Project exists
      // 2. User has access (owner, collaborator, etc.)
      // 3. Project is not archived/deleted
      
      // For now, simulate with known access patterns
      const knownProjects = new Map([
        ['tim', ['maverick-project-id-123', 'wine-project-id-456']]
      ])

      const userProjects = knownProjects.get(userId) || []
      return userProjects.includes(projectId)

    } catch (error) {
      console.error('Error validating project access:', error)
      return false
    }
  }

  // Private methods
  
  private async lookupProject(userId: string, projectName: string): Promise<ProjectReference | null> {
    // Simulate database lookup
    // In real implementation, this would be:
    // SELECT id, name, display_name FROM projects 
    // WHERE owner_id = userId AND (name = projectName OR slug = projectName)
    
    const knownProjects: Record<string, ProjectReference[]> = {
      'tim': [
        {
          id: 'maverick-project-id-123',
          name: 'maverick',
          displayName: 'Maverick Platform',
          userId: 'tim',
          slug: 'maverick'
        },
        {
          id: 'wine-project-id-456', 
          name: 'wine-collection',
          displayName: 'Wine Collection App',
          userId: 'tim',
          slug: 'wine-collection'
        }
      ]
    }

    const userProjects = knownProjects[userId] || []
    return userProjects.find(p => p.name === projectName || p.slug === projectName) || null
  }

  /**
   * Clear cache (useful for development/testing)
   */
  clearCache(): void {
    this.projectCache.clear()
  }
}

export const projectIdResolver = ProjectIdResolver.getInstance()

// Utility functions for common patterns

/**
 * Get project context from Next.js params
 */
export async function getProjectContextFromParams(
  params: { name: string },
  userId: string = 'tim' // Eventually get from session
): Promise<UserProjectContext | null> {
  return await projectIdResolver.createProjectContext(userId, params.name)
}

/**
 * Generate session ID for Claude Code integration
 */
export function generateClaudeSessionId(context: UserProjectContext, mode: string = 'chat'): string {
  return projectIdResolver.generateSessionId(context, mode)
}

/**
 * Get all workspace paths for a project
 */
export function getProjectWorkspacePaths(context: UserProjectContext) {
  return projectIdResolver.getWorkspacePaths(context)
}

/**
 * Validate user can access project
 */
export async function validateUserProjectAccess(userId: string, projectName: string): Promise<boolean> {
  const projectId = await projectIdResolver.resolveProjectId(userId, projectName)
  if (!projectId) return false
  
  return await projectIdResolver.validateProjectAccess(userId, projectId)
}