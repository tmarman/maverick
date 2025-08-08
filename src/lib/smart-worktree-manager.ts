/**
 * Smart Worktree Manager
 * Organizes worktrees by team/category with work queues
 */

export interface WorktreeCategory {
  id: string
  name: string
  description: string
  team: string
  color: string // For UI theming
}

export interface WorktreeQueue {
  worktreeName: string
  category: WorktreeCategory
  tasks: QueuedTask[]
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED'
  createdAt: string
  lastActivity: string
}

export interface QueuedTask {
  taskId: string
  title: string
  type: 'FEATURE' | 'BUG' | 'EPIC' | 'STORY' | 'TASK' | 'SUBTASK'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED'
  addedAt: string
  completedAt?: string
  commitSha?: string
}

export class SmartWorktreeManager {
  
  /**
   * Intelligently categorize a task based on its content using provided categories
   */
  static categorizeTask(
    title: string, 
    description: string = '', 
    type: string = '',
    functionalArea: string = '',
    categories: WorktreeCategory[]
  ): WorktreeCategory | null {
    if (!categories || categories.length === 0) {
      return null
    }

    const content = `${title} ${description} ${type} ${functionalArea}`.toLowerCase()
    
    let bestMatch: { category: WorktreeCategory; score: number } | null = null
    
    // Score each category based on keyword matches and description
    for (const category of categories) {
      let score = 0
      
      // Check keywords from category definition (if available)
      if ((category as any).keywords && Array.isArray((category as any).keywords)) {
        for (const keyword of (category as any).keywords) {
          if (content.includes(keyword.toLowerCase())) {
            score += 2 // Strong keyword match
          }
        }
      }
      
      // Check category name words
      const categoryWords = category.name.toLowerCase().split(/[\s&\-]+/)
      for (const word of categoryWords) {
        if (word.length > 2 && content.includes(word)) {
          score += 1 // Name word match
        }
      }
      
      // Check description words
      if (category.description) {
        const descWords = category.description.toLowerCase().split(/[\s,\.]+/)
        for (const word of descWords) {
          if (word.length > 3 && content.includes(word)) {
            score += 0.5 // Description word match
          }
        }
      }
      
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { category, score }
      }
    }
    
    // Only return confident matches (score >= 2)
    if (bestMatch && bestMatch.score >= 2) {
      return bestMatch.category
    }
    
    // Default to first category if no confident match
    return categories[0]
  }
  
  /**
   * Check if content matches any of the keywords
   */
  private static matchesKeywords(content: string, keywords: string[]): boolean {
    return keywords.some(keyword => content.includes(keyword))
  }
  
  /**
   * Find category by ID
   */
  static getCategoryById(id: string, categories: WorktreeCategory[]): WorktreeCategory | undefined {
    return categories.find(c => c.id === id)
  }
  
  /**
   * Suggest worktree name based on task content
   */
  static suggestWorktreeName(
    title: string, 
    description: string = '', 
    type: string = '',
    functionalArea: string = '',
    categories: WorktreeCategory[]
  ): { category: WorktreeCategory | null; worktreeName: string } {
    const category = this.categorizeTask(title, description, type, functionalArea, categories)
    
    return {
      category,
      worktreeName: category?.name || 'general-task'
    }
  }
  
  /**
   * Generate a custom worktree name if user wants something specific
   */
  static generateCustomWorktreeName(baseName: string): string {
    // Clean and normalize the name
    return baseName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Collapse multiple hyphens
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .slice(0, 50) // Limit length
  }
}