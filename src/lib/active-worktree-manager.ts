/**
 * Active Worktree Manager
 * Manages the concept of active worktrees with 1:many relationship to tasks
 * A single worktree can contain multiple related tasks/features
 */

export interface ActiveWorktree {
  id: string
  name: string
  displayName: string
  description: string
  
  // Git/repository info
  branchName: string
  baseBranch: string
  repositoryPath: string
  
  // Status and lifecycle
  status: 'ACTIVE' | 'PAUSED' | 'READY_FOR_REVIEW' | 'MERGED' | 'ARCHIVED'
  createdAt: string
  lastActivity: string
  
  // Associated work items (1:many relationship)
  workItems: WorktreeWorkItem[]
  
  // Category and organization
  category: {
    id: string
    name: string
    color: string
  }
  
  // Progress tracking
  progress: {
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    testsPassing: boolean
    readyForReview: boolean
  }
  
  // Development environment
  environment: {
    hasChanges: boolean
    uncommittedFiles: string[]
    lastCommitSha?: string
    lastCommitMessage?: string
    branchBehindMain?: number
    branchAheadMain?: number
  }
}

export interface WorktreeWorkItem {
  id: string
  title: string
  type: 'FEATURE' | 'BUG' | 'EPIC' | 'STORY' | 'TASK' | 'SUBTASK'
  status: 'PLANNED' | 'IN_PROGRESS' | 'IN_REVIEW' | 'TESTING' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
  
  // Relationship to worktree
  addedToWorktreeAt: string
  completedInWorktreeAt?: string
  estimatedEffort?: string
  actualEffort?: string
  
  // Implementation tracking
  files: string[] // Files modified for this work item
  commits: string[] // Commit SHAs for this work item
  tests: string[] // Test files created/modified
}

export interface WorktreeCreationOptions {
  name?: string // Auto-generated if not provided
  displayName?: string // Human-readable name
  description?: string
  baseBranch?: string // Defaults to 'main'
  category?: {
    id: string
    name: string
    color: string
  }
  initialWorkItems?: string[] // Work item IDs to add initially
}

export class ActiveWorktreeManager {
  private static instance: ActiveWorktreeManager
  
  static getInstance(): ActiveWorktreeManager {
    if (!ActiveWorktreeManager.instance) {
      ActiveWorktreeManager.instance = new ActiveWorktreeManager()
    }
    return ActiveWorktreeManager.instance
  }

  /**
   * Create a new active worktree
   */
  async createWorktree(
    projectName: string, 
    options: WorktreeCreationOptions = {}
  ): Promise<ActiveWorktree> {
    const worktreeId = this.generateWorktreeId()
    const worktreeName = options.name || this.generateWorktreeName(projectName)
    const displayName = options.displayName || this.generateDisplayName(worktreeName)
    
    const worktree: ActiveWorktree = {
      id: worktreeId,
      name: worktreeName,
      displayName,
      description: options.description || `Development worktree for ${displayName}`,
      
      branchName: `worktree/${worktreeName}`,
      baseBranch: options.baseBranch || 'main',
      repositoryPath: '', // Will be set during creation
      
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      
      workItems: [],
      
      category: options.category || {
        id: 'general',
        name: 'General Development',
        color: '#6B7280'
      },
      
      progress: {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        testsPassing: false,
        readyForReview: false
      },
      
      environment: {
        hasChanges: false,
        uncommittedFiles: [],
        branchBehindMain: 0,
        branchAheadMain: 0
      }
    }
    
    // Add initial work items if provided
    if (options.initialWorkItems && options.initialWorkItems.length > 0) {
      for (const workItemId of options.initialWorkItems) {
        await this.addWorkItemToWorktree(projectName, worktreeId, workItemId)
      }
    }
    
    // Save the worktree
    await this.saveWorktree(projectName, worktree)
    
    // Create the actual git worktree
    await this.createGitWorktree(projectName, worktree)
    
    return worktree
  }

  /**
   * Add a work item to an existing worktree
   */
  async addWorkItemToWorktree(
    projectName: string, 
    worktreeId: string, 
    workItemId: string
  ): Promise<void> {
    const worktree = await this.getWorktree(projectName, worktreeId)
    if (!worktree) {
      throw new Error(`Worktree ${worktreeId} not found`)
    }
    
    // Check if work item is already in this worktree
    if (worktree.workItems.some(wi => wi.id === workItemId)) {
      return // Already added
    }
    
    // Load work item details (you'd fetch this from your work item storage)
    const workItem = await this.loadWorkItemDetails(projectName, workItemId)
    if (!workItem) {
      throw new Error(`Work item ${workItemId} not found`)
    }
    
    // Add to worktree
    const worktreeWorkItem: WorktreeWorkItem = {
      id: workItem.id,
      title: workItem.title,
      type: workItem.type,
      status: workItem.status,
      priority: workItem.priority,
      addedToWorktreeAt: new Date().toISOString(),
      estimatedEffort: workItem.estimatedEffort,
      files: [],
      commits: [],
      tests: []
    }
    
    worktree.workItems.push(worktreeWorkItem)
    worktree.progress.totalTasks = worktree.workItems.length
    worktree.lastActivity = new Date().toISOString()
    
    await this.saveWorktree(projectName, worktree)
    
    // Update the original work item to reference this worktree
    await this.updateWorkItemWorktreeReference(projectName, workItemId, worktreeId)
  }

  /**
   * Remove a work item from a worktree
   */
  async removeWorkItemFromWorktree(
    projectName: string, 
    worktreeId: string, 
    workItemId: string
  ): Promise<void> {
    const worktree = await this.getWorktree(projectName, worktreeId)
    if (!worktree) {
      throw new Error(`Worktree ${worktreeId} not found`)
    }
    
    worktree.workItems = worktree.workItems.filter(wi => wi.id !== workItemId)
    worktree.progress.totalTasks = worktree.workItems.length
    worktree.progress.completedTasks = worktree.workItems.filter(wi => wi.status === 'DONE').length
    worktree.progress.inProgressTasks = worktree.workItems.filter(wi => wi.status === 'IN_PROGRESS').length
    worktree.lastActivity = new Date().toISOString()
    
    await this.saveWorktree(projectName, worktree)
    
    // Remove worktree reference from work item
    await this.updateWorkItemWorktreeReference(projectName, workItemId, null)
  }

  /**
   * Get all active worktrees for a project
   */
  async getActiveWorktrees(projectName: string): Promise<ActiveWorktree[]> {
    // TODO: Implement loading from persistent storage
    // For now, return mock data
    return []
  }

  /**
   * Get a specific worktree
   */
  async getWorktree(projectName: string, worktreeId: string): Promise<ActiveWorktree | null> {
    // TODO: Implement loading from persistent storage
    return null
  }

  /**
   * Update worktree progress based on work item changes
   */
  async updateWorktreeProgress(projectName: string, worktreeId: string): Promise<void> {
    const worktree = await this.getWorktree(projectName, worktreeId)
    if (!worktree) return
    
    worktree.progress.totalTasks = worktree.workItems.length
    worktree.progress.completedTasks = worktree.workItems.filter(wi => wi.status === 'DONE').length
    worktree.progress.inProgressTasks = worktree.workItems.filter(wi => wi.status === 'IN_PROGRESS').length
    
    // Check if ready for review (all tasks complete, tests passing)
    worktree.progress.readyForReview = (
      worktree.progress.completedTasks === worktree.progress.totalTasks &&
      worktree.progress.testsPassing &&
      worktree.workItems.length > 0
    )
    
    // Update status based on progress
    if (worktree.progress.readyForReview) {
      worktree.status = 'READY_FOR_REVIEW'
    }
    
    worktree.lastActivity = new Date().toISOString()
    await this.saveWorktree(projectName, worktree)
  }

  /**
   * Get work items that are ready to be added to a worktree (not already in one)
   */
  async getAvailableWorkItems(projectName: string): Promise<any[]> {
    // TODO: Implement - get work items that don't have an active worktree
    return []
  }

  /**
   * Auto-suggest which work items should be grouped into a worktree together
   */
  async suggestWorktreeGrouping(projectName: string, workItemIds: string[]): Promise<{
    suggestedGroups: Array<{
      name: string
      displayName: string
      description: string
      workItemIds: string[]
      reasoning: string
      category: {
        id: string
        name: string
        color: string
      }
    }>
  }> {
    // TODO: Implement AI-powered grouping suggestions
    // This would analyze work items and suggest logical groupings based on:
    // - Related functionality
    // - Dependencies
    // - Categories
    // - Size/complexity
    return { suggestedGroups: [] }
  }

  // Private helper methods

  private generateWorktreeId(): string {
    return `worktree-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateWorktreeName(projectName: string): string {
    const timestamp = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const random = Math.random().toString(36).substr(2, 4)
    return `${projectName}-${timestamp}-${random}`
  }

  private generateDisplayName(worktreeName: string): string {
    // Convert kebab-case to Title Case
    return worktreeName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  private async saveWorktree(projectName: string, worktree: ActiveWorktree): Promise<void> {
    // TODO: Implement persistent storage
    // This could be file-based or database-based
  }

  private async createGitWorktree(projectName: string, worktree: ActiveWorktree): Promise<void> {
    // TODO: Integrate with existing git worktree creation
    // This should create the actual git worktree and branch
  }

  private async loadWorkItemDetails(projectName: string, workItemId: string): Promise<any> {
    // TODO: Load work item from existing storage
    return null
  }

  private async updateWorkItemWorktreeReference(
    projectName: string, 
    workItemId: string, 
    worktreeId: string | null
  ): Promise<void> {
    // TODO: Update work item to reference this worktree
    // This updates the worktreeName and worktreeStatus fields
  }
}

export const activeWorktreeManager = ActiveWorktreeManager.getInstance()