/**
 * Task Auto-Organizer
 * Automatically organizes tasks into hierarchical epic-level structures
 * Analyzes task complexity, dependencies, and relationships to create logical groupings
 */

export interface TaskOrganizationSuggestion {
  type: 'CREATE_EPIC' | 'GROUP_UNDER_EPIC' | 'SPLIT_TASK' | 'CREATE_SUBTASKS' | 'REORDER'
  confidence: number
  reasoning: string
  
  // For CREATE_EPIC
  epicTitle?: string
  epicDescription?: string
  childTaskIds?: string[]
  
  // For GROUP_UNDER_EPIC  
  parentEpicId?: string
  taskId?: string
  
  // For SPLIT_TASK
  splitFromTaskId?: string
  suggestedSubtasks?: Array<{
    title: string
    description: string
    type: 'TASK' | 'SUBTASK'
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
    estimatedEffort: string
  }>
  
  // For CREATE_SUBTASKS
  parentTaskId?: string
  subtasks?: Array<{
    title: string
    description: string
    estimatedEffort: string
    dependency?: string // subtask id this depends on
  }>
}

export interface TaskAnalysisResult {
  taskId: string
  title: string
  analysis: {
    complexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EPIC'
    estimatedSubtasks: number
    suggestedType: 'TASK' | 'FEATURE' | 'EPIC'
    keywords: string[]
    functionalArea: string
    dependencies: string[] // other task IDs
    relatedTasks: string[] // similar tasks
    shouldBeBrokenDown: boolean
  }
  suggestions: TaskOrganizationSuggestion[]
}

export class TaskAutoOrganizer {
  private static instance: TaskAutoOrganizer
  
  static getInstance(): TaskAutoOrganizer {
    if (!TaskAutoOrganizer.instance) {
      TaskAutoOrganizer.instance = new TaskAutoOrganizer()
    }
    return TaskAutoOrganizer.instance
  }

  /**
   * Analyze all tasks and suggest organizational improvements
   */
  async analyzeAndSuggestOrganization(
    projectName: string,
    workItems: any[]
  ): Promise<{
    suggestions: TaskOrganizationSuggestion[]
    analysis: TaskAnalysisResult[]
    recommendedActions: Array<{
      priority: 'HIGH' | 'MEDIUM' | 'LOW'
      action: string
      impact: string
      suggestion: TaskOrganizationSuggestion
    }>
  }> {
    console.log(`🧠 Analyzing ${workItems.length} work items for organization opportunities...`)
    
    // Step 1: Analyze individual tasks
    const analysis = await Promise.all(
      workItems.map(item => this.analyzeTask(item, workItems))
    )
    
    // Step 2: Find organizational patterns
    const suggestions = await this.generateOrganizationSuggestions(analysis, workItems)
    
    // Step 3: Prioritize recommendations
    const recommendedActions = this.prioritizeRecommendations(suggestions)
    
    console.log(`✅ Generated ${suggestions.length} organization suggestions`)
    
    return {
      suggestions,
      analysis,
      recommendedActions
    }
  }

  /**
   * Auto-apply safe organizational improvements
   */
  async autoApplyOrganization(
    projectName: string,
    suggestions: TaskOrganizationSuggestion[],
    options: {
      autoApplyThreshold: number // confidence threshold (0-1)
      dryRun: boolean
    } = { autoApplyThreshold: 0.8, dryRun: false }
  ): Promise<{
    applied: TaskOrganizationSuggestion[]
    skipped: TaskOrganizationSuggestion[]
    errors: Array<{ suggestion: TaskOrganizationSuggestion; error: string }>
  }> {
    const applied: TaskOrganizationSuggestion[] = []
    const skipped: TaskOrganizationSuggestion[] = []
    const errors: Array<{ suggestion: TaskOrganizationSuggestion; error: string }> = []
    
    for (const suggestion of suggestions) {
      if (suggestion.confidence < options.autoApplyThreshold) {
        skipped.push(suggestion)
        continue
      }
      
      try {
        if (!options.dryRun) {
          await this.applySuggestion(projectName, suggestion)
        }
        applied.push(suggestion)
      } catch (error) {
        errors.push({ 
          suggestion, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }
    
    return { applied, skipped, errors }
  }

  /**
   * Analyze a single task for complexity and organization needs
   */
  private async analyzeTask(
    task: any, 
    allTasks: any[]
  ): Promise<TaskAnalysisResult> {
    const title = task.title || ''
    const description = task.description || ''
    const content = `${title} ${description}`.toLowerCase()
    
    // Analyze complexity
    const complexity = this.assessComplexity(task, content)
    
    // Estimate subtasks needed
    const estimatedSubtasks = this.estimateSubtasks(task, content, complexity)
    
    // Extract keywords
    const keywords = this.extractKeywords(content)
    
    // Find related tasks
    const relatedTasks = this.findRelatedTasks(task, allTasks)
    
    // Detect dependencies
    const dependencies = this.detectDependencies(task, allTasks, content)
    
    // Generate suggestions for this specific task
    const suggestions = await this.generateTaskSuggestions(task, {
      complexity,
      estimatedSubtasks,
      keywords,
      relatedTasks,
      dependencies
    })
    
    return {
      taskId: task.id,
      title: task.title,
      analysis: {
        complexity,
        estimatedSubtasks,
        suggestedType: this.suggestTaskType(complexity, estimatedSubtasks),
        keywords,
        functionalArea: task.functionalArea || 'SOFTWARE',
        dependencies,
        relatedTasks: relatedTasks.map(t => t.id),
        shouldBeBrokenDown: complexity === 'EPIC' || estimatedSubtasks > 3
      },
      suggestions
    }
  }

  /**
   * Assess task complexity based on various factors
   */
  private assessComplexity(task: any, content: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'EPIC' {
    let complexityScore = 0
    
    // Content length indicators
    if (content.length > 1000) complexityScore += 3
    else if (content.length > 500) complexityScore += 2
    else if (content.length > 200) complexityScore += 1
    
    // Complex keywords
    const complexKeywords = [
      'system', 'platform', 'architecture', 'infrastructure', 'integration',
      'refactor', 'migration', 'overhaul', 'redesign', 'rebuild'
    ]
    complexKeywords.forEach(keyword => {
      if (content.includes(keyword)) complexityScore += 2
    })
    
    // Multiple technology mentions
    const techKeywords = [
      'database', 'api', 'frontend', 'backend', 'authentication', 'security',
      'deployment', 'testing', 'monitoring', 'caching', 'queue'
    ]
    const techMentions = techKeywords.filter(keyword => content.includes(keyword)).length
    if (techMentions >= 3) complexityScore += 2
    else if (techMentions >= 2) complexityScore += 1
    
    // Task type implications
    if (task.type === 'EPIC') complexityScore += 3
    else if (task.type === 'FEATURE') complexityScore += 1
    
    // Multiple acceptance criteria or steps
    const stepIndicators = content.match(/\d+\./g) || []
    if (stepIndicators.length > 5) complexityScore += 2
    else if (stepIndicators.length > 3) complexityScore += 1
    
    // Determine complexity level
    if (complexityScore >= 8) return 'EPIC'
    if (complexityScore >= 5) return 'HIGH'
    if (complexityScore >= 3) return 'MEDIUM'
    return 'LOW'
  }

  /**
   * Estimate how many subtasks this task likely needs
   */
  private estimateSubtasks(task: any, content: string, complexity: string): number {
    let estimatedSubtasks = 1
    
    // Base estimation by complexity
    switch (complexity) {
      case 'EPIC': estimatedSubtasks = 8; break
      case 'HIGH': estimatedSubtasks = 4; break
      case 'MEDIUM': estimatedSubtasks = 2; break
      case 'LOW': estimatedSubtasks = 1; break
    }
    
    // Adjust based on explicit steps/phases mentioned
    const phaseKeywords = [
      'phase', 'step', 'stage', 'part', 'component', 'module', 'section'
    ]
    let explicitSteps = 0
    phaseKeywords.forEach(keyword => {
      const matches = content.match(new RegExp(keyword + '\\s*\\d+', 'g')) || []
      explicitSteps += matches.length
    })
    
    if (explicitSteps > 0) {
      estimatedSubtasks = Math.max(estimatedSubtasks, explicitSteps)
    }
    
    // Look for numbered lists
    const numberedItems = content.match(/^\d+\./gm) || []
    if (numberedItems.length > 2) {
      estimatedSubtasks = Math.max(estimatedSubtasks, Math.min(numberedItems.length, 10))
    }
    
    return Math.min(estimatedSubtasks, 12) // Cap at reasonable number
  }

  /**
   * Extract key terms that might indicate relationships
   */
  private extractKeywords(content: string): string[] {
    // Simple keyword extraction - can be enhanced with NLP
    const importantWords = content
      .match(/\b[a-z]{3,}\b/g) || []
    
    // Filter to meaningful keywords
    const stopWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'way', 'web', 'app', 'add', 'new', 'can', 'get', 'set'
    ])
    
    return Array.from(new Set(importantWords))
      .filter(word => !stopWords.has(word) && word.length > 3)
      .slice(0, 10) // Top 10 keywords
  }

  /**
   * Find tasks that might be related based on content similarity
   */
  private findRelatedTasks(task: any, allTasks: any[]): any[] {
    const taskContent = `${task.title} ${task.description}`.toLowerCase()
    const taskKeywords = this.extractKeywords(taskContent)
    
    return allTasks
      .filter(other => other.id !== task.id)
      .map(other => ({
        ...other,
        similarity: this.calculateSimilarity(taskKeywords, other)
      }))
      .filter(other => other.similarity > 0.3) // 30% similarity threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5) // Top 5 related tasks
  }

  private calculateSimilarity(keywords: string[], otherTask: any): number {
    const otherContent = `${otherTask.title} ${otherTask.description}`.toLowerCase()
    const otherKeywords = this.extractKeywords(otherContent)
    
    const intersection = keywords.filter(k => otherKeywords.includes(k))
    const union = Array.from(new Set([...keywords, ...otherKeywords]))
    
    return intersection.length / Math.max(union.length, 1)
  }

  /**
   * Detect potential dependencies between tasks
   */
  private detectDependencies(task: any, allTasks: any[], content: string): string[] {
    const dependencies: string[] = []
    
    // Look for explicit dependency mentions
    const dependencyKeywords = ['depends on', 'requires', 'needs', 'after', 'once']
    
    for (const other of allTasks) {
      if (other.id === task.id) continue
      
      const otherTitle = other.title.toLowerCase()
      
      // Check if this task mentions the other task
      if (content.includes(otherTitle) && 
          dependencyKeywords.some(keyword => content.includes(keyword))) {
        dependencies.push(other.id)
      }
    }
    
    return dependencies
  }

  /**
   * Suggest the appropriate task type based on analysis
   */
  private suggestTaskType(complexity: string, estimatedSubtasks: number): 'TASK' | 'FEATURE' | 'EPIC' {
    if (complexity === 'EPIC' || estimatedSubtasks >= 6) return 'EPIC'
    if (complexity === 'HIGH' || estimatedSubtasks >= 3) return 'FEATURE'
    return 'TASK'
  }

  /**
   * Generate organization suggestions based on all task analysis
   */
  private async generateOrganizationSuggestions(
    analyses: TaskAnalysisResult[],
    workItems: any[]
  ): Promise<TaskOrganizationSuggestion[]> {
    const suggestions: TaskOrganizationSuggestion[] = []
    
    // Find tasks that should become epics
    for (const analysis of analyses) {
      if (analysis.analysis.shouldBeBrokenDown) {
        suggestions.push({
          type: 'SPLIT_TASK',
          confidence: 0.9,
          reasoning: `Task "${analysis.title}" is complex (${analysis.analysis.complexity}) and should be broken down into ${analysis.analysis.estimatedSubtasks} subtasks`,
          splitFromTaskId: analysis.taskId,
          suggestedSubtasks: await this.generateSubtaskSuggestions(analysis)
        })
      }
    }
    
    // Find groups of related tasks that should be under an epic
    const potentialEpics = this.findPotentialEpics(analyses)
    suggestions.push(...potentialEpics)
    
    return suggestions
  }

  /**
   * Generate subtask suggestions for a complex task
   */
  private async generateSubtaskSuggestions(analysis: TaskAnalysisResult): Promise<Array<{
    title: string
    description: string
    type: 'TASK' | 'SUBTASK'
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
    estimatedEffort: string
  }>> {
    // This is a simplified version - could be enhanced with AI
    const baseTitle = analysis.title
    const complexity = analysis.analysis.complexity
    
    const subtasks: Array<{
      title: string
      description: string
      type: 'TASK' | 'SUBTASK'
      priority: 'LOW' | 'MEDIUM' | 'HIGH'
      estimatedEffort: string
    }> = []
    
    // Generate standard development lifecycle subtasks
    if (complexity === 'EPIC' || complexity === 'HIGH') {
      subtasks.push(
        {
          title: `${baseTitle}: Research and Planning`,
          description: `Research requirements and create detailed plan for ${baseTitle}`,
          type: 'SUBTASK',
          priority: 'HIGH',
          estimatedEffort: 'S'
        },
        {
          title: `${baseTitle}: Core Implementation`,
          description: `Implement the main functionality for ${baseTitle}`,
          type: 'SUBTASK', 
          priority: 'HIGH',
          estimatedEffort: 'M'
        },
        {
          title: `${baseTitle}: Testing and Validation`,
          description: `Create tests and validate functionality for ${baseTitle}`,
          type: 'SUBTASK',
          priority: 'MEDIUM',
          estimatedEffort: 'S'
        },
        {
          title: `${baseTitle}: Documentation and Deployment`,
          description: `Document and deploy ${baseTitle}`,
          type: 'SUBTASK',
          priority: 'MEDIUM',
          estimatedEffort: 'XS'
        }
      )
    }
    
    return subtasks
  }

  /**
   * Find groups of related tasks that could be organized under epics
   */
  private findPotentialEpics(analyses: TaskAnalysisResult[]): TaskOrganizationSuggestion[] {
    const suggestions: TaskOrganizationSuggestion[] = []
    
    // Group by functional area and keywords
    const groups = new Map<string, TaskAnalysisResult[]>()
    
    for (const analysis of analyses) {
      const groupKey = `${analysis.analysis.functionalArea}-${analysis.analysis.keywords.slice(0, 2).join('-')}`
      if (!groups.has(groupKey)) {
        groups.set(groupKey, [])
      }
      groups.get(groupKey)!.push(analysis)
    }
    
    // Find groups with multiple related tasks
    for (const [groupKey, groupTasks] of Array.from(groups)) {
      if (groupTasks.length >= 3) {
        const epicTitle = this.generateEpicTitle(groupTasks)
        suggestions.push({
          type: 'CREATE_EPIC',
          confidence: 0.7,
          reasoning: `Found ${groupTasks.length} related tasks in ${groupKey} that could be organized under a single epic`,
          epicTitle,
          epicDescription: `Epic to organize related tasks: ${groupTasks.map((t: TaskAnalysisResult) => t.title).join(', ')}`,
          childTaskIds: groupTasks.map((t: TaskAnalysisResult) => t.taskId)
        })
      }
    }
    
    return suggestions
  }

  /**
   * Generate an epic title from a group of related tasks
   */
  private generateEpicTitle(tasks: TaskAnalysisResult[]): string {
    // Find common keywords
    const allKeywords = tasks.flatMap(t => t.analysis.keywords)
    const keywordCounts = new Map<string, number>()
    
    allKeywords.forEach(keyword => {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1)
    })
    
    const commonKeywords = Array.from(keywordCounts.entries())
      .filter(([_, count]) => count >= Math.ceil(tasks.length / 2))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([keyword]) => keyword)
    
    if (commonKeywords.length > 0) {
      return `${commonKeywords.join(' & ')} System Epic`
    }
    
    return `${tasks[0].analysis.functionalArea} Epic`
  }

  /**
   * Generate suggestions for a specific task
   */
  private async generateTaskSuggestions(
    task: any,
    analysis: any
  ): Promise<TaskOrganizationSuggestion[]> {
    const suggestions: TaskOrganizationSuggestion[] = []
    
    if (analysis.shouldBeBrokenDown) {
      suggestions.push({
        type: 'CREATE_SUBTASKS',
        confidence: 0.85,
        reasoning: `Task appears complex and would benefit from being broken into ${analysis.estimatedSubtasks} subtasks`,
        parentTaskId: task.id,
        subtasks: [] // Would be populated with actual subtask suggestions
      })
    }
    
    return suggestions
  }

  /**
   * Prioritize recommendations by impact and confidence
   */
  private prioritizeRecommendations(
    suggestions: TaskOrganizationSuggestion[]
  ): Array<{
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
    action: string
    impact: string
    suggestion: TaskOrganizationSuggestion
  }> {
    return suggestions
      .map(suggestion => ({
        priority: (suggestion.confidence > 0.8 ? 'HIGH' : 
                  suggestion.confidence > 0.6 ? 'MEDIUM' : 'LOW') as 'HIGH' | 'MEDIUM' | 'LOW',
        action: this.getActionDescription(suggestion),
        impact: this.getImpactDescription(suggestion),
        suggestion
      }))
      .sort((a, b) => {
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
  }

  private getActionDescription(suggestion: TaskOrganizationSuggestion): string {
    switch (suggestion.type) {
      case 'CREATE_EPIC':
        return `Create epic "${suggestion.epicTitle}" with ${suggestion.childTaskIds?.length} child tasks`
      case 'SPLIT_TASK':
        return `Split complex task into ${suggestion.suggestedSubtasks?.length} subtasks`
      case 'CREATE_SUBTASKS':
        return `Break down task into manageable subtasks`
      case 'GROUP_UNDER_EPIC':
        return `Move task under appropriate epic`
      case 'REORDER':
        return `Reorder tasks for better organization`
      default:
        return 'Organize task structure'
    }
  }

  private getImpactDescription(suggestion: TaskOrganizationSuggestion): string {
    switch (suggestion.type) {
      case 'CREATE_EPIC':
        return 'Improves project organization and makes progress tracking clearer'
      case 'SPLIT_TASK':
        return 'Makes complex work more manageable and trackable'
      case 'CREATE_SUBTASKS':
        return 'Enables better progress tracking and parallel work'
      case 'GROUP_UNDER_EPIC':
        return 'Improves task hierarchy and project visibility'
      case 'REORDER':
        return 'Optimizes workflow and dependency management'
      default:
        return 'Improves project organization'
    }
  }

  /**
   * Apply a suggestion (implement the actual organizational change)
   */
  private async applySuggestion(
    projectName: string,
    suggestion: TaskOrganizationSuggestion
  ): Promise<void> {
    // TODO: Implement actual application of suggestions
    // This would involve creating/updating work items in the system
    console.log(`Applying suggestion: ${suggestion.type}`)
  }
}

export const taskAutoOrganizer = TaskAutoOrganizer.getInstance()