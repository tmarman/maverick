/**
 * AI Task Analysis Service for Maverick
 * 
 * This service analyzes tasks and work items to identify:
 * - Duplicate or overlapping features
 * - Tasks that can be consolidated
 * - Missing dependencies or relationships
 * - Scope optimization opportunities
 */

import { HierarchicalTodo } from './hierarchical-todos-client'

export interface TaskSimilarity {
  task1: HierarchicalTodo
  task2: HierarchicalTodo
  similarityScore: number
  similarityReasons: string[]
  consolidationSuggestion: string
}

export interface ConsolidationRecommendation {
  id: string
  type: 'DUPLICATE' | 'OVERLAP' | 'MERGE' | 'SPLIT' | 'DEPENDENCY'
  title: string
  description: string
  confidence: number
  tasks: HierarchicalTodo[]
  suggestedAction: string
  estimatedTimeSaved: string
  createdAt: string
}

export interface TaskAnalysisResult {
  totalTasks: number
  duplicatesFound: number
  overlapsFound: number
  consolidationOpportunities: ConsolidationRecommendation[]
  estimatedTimeSavings: string
  analysisTimestamp: string
}

export class AITaskAnalysisService {
  private static instance: AITaskAnalysisService

  static getInstance(): AITaskAnalysisService {
    if (!AITaskAnalysisService.instance) {
      AITaskAnalysisService.instance = new AITaskAnalysisService()
    }
    return AITaskAnalysisService.instance
  }

  /**
   * Analyze all tasks in a project for consolidation opportunities
   */
  async analyzeProject(projectName: string): Promise<TaskAnalysisResult> {
    try {
      const response = await fetch(`/api/projects/${projectName}/task-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Task analysis failed:', error)
      throw error
    }
  }

  /**
   * Calculate similarity between two tasks using multiple factors
   */
  calculateTaskSimilarity(task1: HierarchicalTodo, task2: HierarchicalTodo): TaskSimilarity {
    const similarityReasons: string[] = []
    let score = 0

    // Title similarity (weighted 40%)
    const titleSimilarity = this.calculateStringSimilarity(task1.title, task2.title)
    score += titleSimilarity * 0.4
    if (titleSimilarity > 0.7) {
      similarityReasons.push(`Similar titles (${Math.round(titleSimilarity * 100)}% match)`)
    }

    // Description similarity (weighted 30%)
    if (task1.description && task2.description) {
      const descSimilarity = this.calculateStringSimilarity(task1.description, task2.description)
      score += descSimilarity * 0.3
      if (descSimilarity > 0.6) {
        similarityReasons.push(`Similar descriptions (${Math.round(descSimilarity * 100)}% match)`)
      }
    }

    // Type and functional area match (weighted 20%)
    if (task1.type === task2.type) {
      score += 0.1
      similarityReasons.push('Same task type')
    }
    if (task1.functionalArea === task2.functionalArea) {
      score += 0.1
      similarityReasons.push('Same functional area')
    }

    // Priority and effort similarity (weighted 10%)
    if (task1.priority === task2.priority) {
      score += 0.05
    }
    if (task1.estimatedEffort === task2.estimatedEffort) {
      score += 0.05
    }

    // Generate consolidation suggestion
    let consolidationSuggestion = ''
    if (score > 0.8) {
      consolidationSuggestion = 'These tasks appear to be duplicates and should be merged.'
    } else if (score > 0.6) {
      consolidationSuggestion = 'These tasks have significant overlap and could potentially be combined.'
    } else if (score > 0.4) {
      consolidationSuggestion = 'These tasks are related and should be reviewed for dependencies.'
    }

    return {
      task1,
      task2,
      similarityScore: score,
      similarityReasons,
      consolidationSuggestion
    }
  }

  /**
   * Find all similar task pairs in a list
   */
  findSimilarTasks(tasks: HierarchicalTodo[], minSimilarity = 0.4): TaskSimilarity[] {
    const similarities: TaskSimilarity[] = []

    for (let i = 0; i < tasks.length; i++) {
      for (let j = i + 1; j < tasks.length; j++) {
        const similarity = this.calculateTaskSimilarity(tasks[i], tasks[j])
        if (similarity.similarityScore >= minSimilarity) {
          similarities.push(similarity)
        }
      }
    }

    return similarities.sort((a, b) => b.similarityScore - a.similarityScore)
  }

  /**
   * Generate consolidation recommendations from task similarities
   */
  generateConsolidationRecommendations(similarities: TaskSimilarity[]): ConsolidationRecommendation[] {
    const recommendations: ConsolidationRecommendation[] = []

    similarities.forEach((similarity, index) => {
      let type: ConsolidationRecommendation['type'] = 'OVERLAP'
      let estimatedTimeSaved = '2-4 hours'

      if (similarity.similarityScore > 0.8) {
        type = 'DUPLICATE'
        estimatedTimeSaved = '4-8 hours'
      } else if (similarity.similarityScore > 0.6) {
        type = 'MERGE'
        estimatedTimeSaved = '2-6 hours'
      }

      recommendations.push({
        id: `consolidation-${index + 1}`,
        type,
        title: `${type.toLowerCase().replace('_', ' ')} Opportunity: "${similarity.task1.title}" and "${similarity.task2.title}"`,
        description: similarity.consolidationSuggestion,
        confidence: Math.round(similarity.similarityScore * 100),
        tasks: [similarity.task1, similarity.task2],
        suggestedAction: this.generateActionSuggestion(type, similarity),
        estimatedTimeSaved,
        createdAt: new Date().toISOString()
      })
    })

    return recommendations
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim()
    const s2 = str2.toLowerCase().trim()

    if (s1 === s2) return 1

    const longer = s1.length > s2.length ? s1 : s2
    const shorter = s1.length > s2.length ? s2 : s1

    if (longer.length === 0) return 1

    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Generate specific action suggestions based on recommendation type
   */
  private generateActionSuggestion(type: ConsolidationRecommendation['type'], similarity: TaskSimilarity): string {
    switch (type) {
      case 'DUPLICATE':
        return `Merge "${similarity.task2.title}" into "${similarity.task1.title}" and archive the duplicate. Transfer any unique subtasks or notes.`
      
      case 'MERGE':
        return `Combine these related tasks into a single comprehensive task. Create subtasks for any distinct requirements.`
      
      case 'OVERLAP':
        return `Review both tasks to identify shared requirements. Consider creating a parent epic with these as subtasks.`
      
      case 'DEPENDENCY':
        return `Establish a dependency relationship between these tasks. One should be completed before the other begins.`
      
      case 'SPLIT':
        return `This task appears too large. Consider splitting it into smaller, more manageable subtasks.`
      
      default:
        return 'Review these tasks for potential consolidation or relationship establishment.'
    }
  }

  /**
   * Analyze task distribution and identify potential issues
   */
  analyzeTaskDistribution(tasks: HierarchicalTodo[]): {
    byType: Record<string, number>
    byStatus: Record<string, number>
    byPriority: Record<string, number>
    byFunctionalArea: Record<string, number>
    averageDepth: number
    orphanedTasks: HierarchicalTodo[]
  } {
    const distribution = {
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      byFunctionalArea: {} as Record<string, number>,
      averageDepth: 0,
      orphanedTasks: [] as HierarchicalTodo[]
    }

    let totalDepth = 0

    tasks.forEach(task => {
      // Count by type
      distribution.byType[task.type] = (distribution.byType[task.type] || 0) + 1
      
      // Count by status
      distribution.byStatus[task.status] = (distribution.byStatus[task.status] || 0) + 1
      
      // Count by priority
      distribution.byPriority[task.priority] = (distribution.byPriority[task.priority] || 0) + 1
      
      // Count by functional area
      distribution.byFunctionalArea[task.functionalArea] = (distribution.byFunctionalArea[task.functionalArea] || 0) + 1
      
      // Calculate depth
      totalDepth += task.depth
      
      // Find orphaned tasks (subtasks without parents in the current list)
      if (task.parentId && !tasks.find(t => t.id === task.parentId)) {
        distribution.orphanedTasks.push(task)
      }
    })

    distribution.averageDepth = tasks.length > 0 ? totalDepth / tasks.length : 0

    return distribution
  }
}

export const aiTaskAnalysisService = AITaskAnalysisService.getInstance()