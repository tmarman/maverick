import { promises as fs } from 'fs'
import path from 'path'

export interface ExecutiveSummary {
  projectName: string
  healthStatus: 'healthy' | 'at-risk' | 'critical' | 'on-track'
  overallProgress: number // 0-100%
  lastUpdated: Date
  nextMilestone: {
    name: string
    dueDate: Date
    progress: number
  } | null
  keyMetrics: {
    featuresDelivered: number
    featuresInProgress: number
    featuresPlanned: number
    teamVelocity: number
  }
}

export interface WorkStream {
  id: string
  title: string
  type: 'feature' | 'epic' | 'task' | 'enhancement'
  status: 'in-progress' | 'blocked' | 'review' | 'testing' | 'planned'
  progress: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimatedCompletion: Date | null
  riskLevel: 'low' | 'medium' | 'high'
  lastActivity: Date
  owner?: string
}

export interface HealthMetrics {
  velocityTrend: number // percentage change
  qualityScore: number // 0-100
  teamCapacity: number // 0-100 percentage
  blockerCount: number
  overdueCount: number
}

export interface RiskItem {
  id: string
  title: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: 'blocked' | 'overdue' | 'dependency' | 'resource' | 'technical'
  description: string
  daysOutstanding: number
  owner?: string
}

export class ExecutiveSummaryService {
  private projectRoot: string
  private workItemsDir: string

  constructor(projectName: string) {
    this.projectRoot = path.join(process.cwd(), 'projects', projectName)
    this.workItemsDir = path.join(this.projectRoot, 'work-items')
  }

  async generateExecutiveSummary(): Promise<ExecutiveSummary> {
    const workItems = await this.loadWorkItems()
    const metrics = this.calculateMetrics(workItems)
    const healthStatus = this.calculateHealthStatus(workItems, metrics)
    
    return {
      projectName: path.basename(this.projectRoot),
      healthStatus,
      overallProgress: this.calculateOverallProgress(workItems),
      lastUpdated: new Date(),
      nextMilestone: this.findNextMilestone(workItems),
      keyMetrics: {
        featuresDelivered: workItems.filter(w => w.status === 'COMPLETED' && w.type === 'FEATURE').length,
        featuresInProgress: workItems.filter(w => w.status === 'IN_PROGRESS' && w.type === 'FEATURE').length,
        featuresPlanned: workItems.filter(w => w.status === 'PLANNED' && w.type === 'FEATURE').length,
        teamVelocity: this.calculateVelocity(workItems)
      }
    }
  }

  async getActiveWorkStreams(): Promise<WorkStream[]> {
    const workItems = await this.loadWorkItems()
    
    return workItems
      .filter(item => ['IN_PROGRESS', 'BLOCKED', 'IN_REVIEW'].includes(item.status))
      .map(item => ({
        id: item.id,
        title: item.title,
        type: item.type.toLowerCase() as WorkStream['type'],
        status: this.mapStatus(item.status),
        progress: this.calculateProgress(item),
        priority: item.priority.toLowerCase() as WorkStream['priority'],
        estimatedCompletion: this.estimateCompletion(item),
        riskLevel: this.assessRisk(item),
        lastActivity: new Date(item.updatedAt),
        owner: item.assignedTo
      }))
      .sort((a, b) => {
        // Sort by priority (critical first) then by risk level
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        const riskOrder = { high: 3, medium: 2, low: 1 }
        
        const aPriorityScore = priorityOrder[a.priority] * 10 + riskOrder[a.riskLevel]
        const bPriorityScore = priorityOrder[b.priority] * 10 + riskOrder[b.riskLevel]
        
        return bPriorityScore - aPriorityScore
      })
  }

  async getHealthMetrics(): Promise<HealthMetrics> {
    const workItems = await this.loadWorkItems()
    
    return {
      velocityTrend: this.calculateVelocityTrend(workItems),
      qualityScore: this.calculateQualityScore(workItems),
      teamCapacity: this.calculateTeamCapacity(workItems),
      blockerCount: workItems.filter(w => w.status === 'BLOCKED').length,
      overdueCount: this.countOverdueItems(workItems)
    }
  }

  async getRiskItems(): Promise<RiskItem[]> {
    const workItems = await this.loadWorkItems()
    const risks: RiskItem[] = []

    // Blocked items
    workItems
      .filter(item => item.status === 'BLOCKED')
      .forEach(item => {
        const daysBlocked = this.calculateDaysSince(new Date(item.updatedAt))
        risks.push({
          id: `blocked-${item.id}`,
          title: `Blocked: ${item.title}`,
          severity: daysBlocked > 5 ? 'high' : daysBlocked > 2 ? 'medium' : 'low',
          type: 'blocked',
          description: `Work item has been blocked for ${daysBlocked} days`,
          daysOutstanding: daysBlocked,
          owner: item.assignedTo
        })
      })

    // Overdue items
    const overdueItems = workItems.filter(item => {
      if (!item.dueDate) return false
      return new Date(item.dueDate) < new Date() && !['COMPLETED', 'CANCELLED'].includes(item.status)
    })

    overdueItems.forEach(item => {
      const daysOverdue = this.calculateDaysSince(new Date(item.dueDate!))
      risks.push({
        id: `overdue-${item.id}`,
        title: `Overdue: ${item.title}`,
        severity: daysOverdue > 7 ? 'critical' : daysOverdue > 3 ? 'high' : 'medium',
        type: 'overdue',
        description: `Work item is ${daysOverdue} days overdue`,
        daysOutstanding: daysOverdue,
        owner: item.assignedTo
      })
    })

    // High priority items without recent activity
    const staleHighPriority = workItems.filter(item => {
      if (item.priority !== 'HIGH' && item.priority !== 'CRITICAL') return false
      if (['COMPLETED', 'CANCELLED'].includes(item.status)) return false
      
      const daysSinceUpdate = this.calculateDaysSince(new Date(item.updatedAt))
      return daysSinceUpdate > 3
    })

    staleHighPriority.forEach(item => {
      const daysSinceUpdate = this.calculateDaysSince(new Date(item.updatedAt))
      risks.push({
        id: `stale-${item.id}`,
        title: `Stale ${item.priority}: ${item.title}`,
        severity: 'medium',
        type: 'resource',
        description: `High priority item with no activity for ${daysSinceUpdate} days`,
        daysOutstanding: daysSinceUpdate,
        owner: item.assignedTo
      })
    })

    return risks.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })
  }

  private async loadWorkItems(): Promise<any[]> {
    try {
      const files = await fs.readdir(this.workItemsDir)
      const markdownFiles = files.filter(file => file.endsWith('.md'))
      
      const workItems = []
      for (const file of markdownFiles) {
        try {
          const content = await fs.readFile(path.join(this.workItemsDir, file), 'utf-8')
          const workItem = this.parseWorkItem(content, file)
          if (workItem) {
            workItems.push(workItem)
          }
        } catch (error) {
          console.warn(`Failed to parse work item ${file}:`, error)
        }
      }
      
      return workItems
    } catch (error) {
      console.warn('Failed to load work items:', error)
      return []
    }
  }

  private parseWorkItem(content: string, filename: string): any | null {
    try {
      const lines = content.split('\n')
      let frontmatterEnd = -1
      
      // Find end of frontmatter
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '---') {
          frontmatterEnd = i
          break
        }
      }
      
      if (frontmatterEnd === -1) return null
      
      const frontmatter = lines.slice(1, frontmatterEnd).join('\n')
      const workItem: any = {}
      
      // Parse frontmatter
      frontmatter.split('\n').forEach(line => {
        const match = line.match(/^(\w+):\s*(.+)$/)
        if (match) {
          const [, key, value] = match
          workItem[key] = value.replace(/['"]/g, '') // Remove quotes
        }
      })
      
      // Default values
      workItem.id = workItem.id || filename.replace('.md', '')
      workItem.status = workItem.status || 'PLANNED'
      workItem.priority = workItem.priority || 'MEDIUM'
      workItem.type = workItem.type || 'TASK'
      workItem.estimatedEffort = workItem.estimatedEffort || '1d'
      workItem.createdAt = workItem.createdAt || new Date().toISOString()
      workItem.updatedAt = workItem.updatedAt || workItem.createdAt
      
      return workItem
    } catch (error) {
      console.warn(`Failed to parse work item ${filename}:`, error)
      return null
    }
  }

  private calculateMetrics(workItems: any[]): any {
    const completed = workItems.filter(w => w.status === 'COMPLETED')
    const inProgress = workItems.filter(w => w.status === 'IN_PROGRESS')
    const blocked = workItems.filter(w => w.status === 'BLOCKED')
    
    return {
      completionRate: workItems.length > 0 ? (completed.length / workItems.length) * 100 : 0,
      blockerRate: workItems.length > 0 ? (blocked.length / workItems.length) * 100 : 0,
      activeRate: workItems.length > 0 ? (inProgress.length / workItems.length) * 100 : 0
    }
  }

  private calculateHealthStatus(workItems: any[], metrics: any): ExecutiveSummary['healthStatus'] {
    const { blockerRate, completionRate } = metrics
    const overdueCount = this.countOverdueItems(workItems)
    const criticalCount = workItems.filter(w => w.priority === 'CRITICAL' && w.status !== 'COMPLETED').length
    
    if (blockerRate > 20 || overdueCount > 3 || criticalCount > 2) {
      return 'critical'
    } else if (blockerRate > 10 || overdueCount > 1 || criticalCount > 0) {
      return 'at-risk'
    } else if (completionRate > 70) {
      return 'healthy'
    } else {
      return 'on-track'
    }
  }

  private calculateOverallProgress(workItems: any[]): number {
    if (workItems.length === 0) return 0
    
    const weights = {
      COMPLETED: 1.0,
      IN_REVIEW: 0.9,
      IN_PROGRESS: 0.5,
      PLANNED: 0.1,
      BLOCKED: 0.3,
      CANCELLED: 0.0
    }
    
    const totalWeight = workItems.reduce((sum, item) => {
      return sum + (weights[item.status as keyof typeof weights] || 0)
    }, 0)
    
    return Math.round((totalWeight / workItems.length) * 100)
  }

  private findNextMilestone(workItems: any[]): ExecutiveSummary['nextMilestone'] {
    const epics = workItems.filter(w => w.type === 'EPIC' && w.status !== 'COMPLETED')
    if (epics.length === 0) return null
    
    // Find the epic with the earliest due date or highest priority
    const nextEpic = epics.sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
      return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
    })[0]
    
    return {
      name: nextEpic.title,
      dueDate: nextEpic.dueDate ? new Date(nextEpic.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days
      progress: this.calculateProgress(nextEpic)
    }
  }

  private calculateVelocity(workItems: any[]): number {
    // Simple velocity calculation based on completed items in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentlyCompleted = workItems.filter(item => 
      item.status === 'COMPLETED' && 
      new Date(item.updatedAt) > thirtyDaysAgo
    )
    
    return recentlyCompleted.length
  }

  private mapStatus(status: string): WorkStream['status'] {
    const statusMap: Record<string, WorkStream['status']> = {
      'IN_PROGRESS': 'in-progress',
      'BLOCKED': 'blocked',
      'IN_REVIEW': 'review',
      'TESTING': 'testing',
      'PLANNED': 'planned'
    }
    
    return statusMap[status] || 'planned'
  }

  private calculateProgress(item: any): number {
    // Simple progress calculation based on status
    const progressMap: Record<string, number> = {
      'PLANNED': 0,
      'IN_PROGRESS': 50,
      'IN_REVIEW': 80,
      'TESTING': 90,
      'COMPLETED': 100,
      'BLOCKED': 25,
      'CANCELLED': 0
    }
    
    return progressMap[item.status] || 0
  }

  private estimateCompletion(item: any): Date | null {
    if (item.dueDate) {
      return new Date(item.dueDate)
    }
    
    // Estimate based on effort and current progress
    const effortDays = this.parseEffort(item.estimatedEffort)
    const progress = this.calculateProgress(item)
    const remainingDays = Math.ceil(effortDays * (1 - progress / 100))
    
    return new Date(Date.now() + remainingDays * 24 * 60 * 60 * 1000)
  }

  private assessRisk(item: any): WorkStream['riskLevel'] {
    if (item.status === 'BLOCKED') return 'high'
    if (item.priority === 'CRITICAL') return 'medium'
    
    const daysSinceUpdate = this.calculateDaysSince(new Date(item.updatedAt))
    if (daysSinceUpdate > 7) return 'high'
    if (daysSinceUpdate > 3) return 'medium'
    
    return 'low'
  }

  private calculateVelocityTrend(workItems: any[]): number {
    // Simplified velocity trend - comparing last 30 days to previous 30 days
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    
    const recent = workItems.filter(item => 
      item.status === 'COMPLETED' && 
      new Date(item.updatedAt) > thirtyDaysAgo
    ).length
    
    const previous = workItems.filter(item => 
      item.status === 'COMPLETED' && 
      new Date(item.updatedAt) > sixtyDaysAgo &&
      new Date(item.updatedAt) <= thirtyDaysAgo
    ).length
    
    if (previous === 0) return recent > 0 ? 100 : 0
    return Math.round(((recent - previous) / previous) * 100)
  }

  private calculateQualityScore(workItems: any[]): number {
    // Simple quality score based on ratio of completed to cancelled/blocked
    const completed = workItems.filter(w => w.status === 'COMPLETED').length
    const problematic = workItems.filter(w => ['CANCELLED', 'BLOCKED'].includes(w.status)).length
    
    if (completed + problematic === 0) return 85 // Default good score
    
    return Math.round((completed / (completed + problematic)) * 100)
  }

  private calculateTeamCapacity(workItems: any[]): number {
    const inProgress = workItems.filter(w => w.status === 'IN_PROGRESS').length
    const blocked = workItems.filter(w => w.status === 'BLOCKED').length
    
    // Estimate capacity based on active work vs blockers
    const activeCapacity = Math.max(0, 100 - (blocked * 20)) // Each blocker reduces capacity by 20%
    return Math.min(activeCapacity, 100)
  }

  private countOverdueItems(workItems: any[]): number {
    return workItems.filter(item => {
      if (!item.dueDate) return false
      return new Date(item.dueDate) < new Date() && !['COMPLETED', 'CANCELLED'].includes(item.status)
    }).length
  }

  private calculateDaysSince(date: Date): number {
    return Math.ceil((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000))
  }

  private parseEffort(effort: string): number {
    // Parse effort strings like "1d", "2w", "3h"
    const match = effort.match(/(\d+)([hdwm])/)
    if (!match) return 1
    
    const [, amount, unit] = match
    const multipliers = { h: 0.125, d: 1, w: 5, m: 20 } // Convert to days
    
    return parseInt(amount) * (multipliers[unit as keyof typeof multipliers] || 1)
  }
}