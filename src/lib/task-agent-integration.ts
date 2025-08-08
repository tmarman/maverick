/**
 * Task-Agent Integration Service
 * 
 * Connects the hierarchical task management system with the agent orchestrator
 * to enable automated task execution with documentation and progress tracking.
 */

import { AgentOrchestrator, type AgentExecutionOptions } from './agent-orchestrator'
import { hierarchicalTodoService } from './hierarchical-todos'
import { hierarchicalTodoClientService, type HierarchicalTodo } from './hierarchical-todos-client'
import { projectContextService } from './project-context-service'

export interface TaskExecutionRequest {
  taskId: string
  projectName: string
  options?: TaskAgentOptions
}

export interface TaskAgentOptions extends AgentExecutionOptions {
  captureScreenshots?: boolean
  captureVideo?: boolean
  createDocumentation?: boolean
  autoUpdateStatus?: boolean
}

export interface TaskExecutionResult {
  sessionId: string
  success: boolean
  worktreePath?: string
  branchName?: string
  error?: string
  artifacts?: {
    screenshots: string[]
    demoVideo?: string
    documentation?: string
    codeChanges: string[]
  }
  // Smart worktree additions
  category?: {
    id: string
    name: string
    description: string
    team: string
    color: string
  }
  queuePosition?: number
}

export class TaskAgentIntegration {
  private static instance: TaskAgentIntegration
  private agentOrchestrator: AgentOrchestrator

  static getInstance(): TaskAgentIntegration {
    if (!TaskAgentIntegration.instance) {
      TaskAgentIntegration.instance = new TaskAgentIntegration()
    }
    return TaskAgentIntegration.instance
  }

  constructor() {
    this.agentOrchestrator = new AgentOrchestrator()
  }

  /**
   * Execute a task using the smart worktree system with queue management
   */
  async executeTask(request: TaskExecutionRequest): Promise<TaskExecutionResult> {
    const { taskId, projectName, options = {} } = request

    try {
      // Get task details
      const context = await projectContextService.getProjectContext(projectName)
      if (!context) {
        throw new Error(`Project ${projectName} not found`)
      }

      const task = await hierarchicalTodoService.getTodo(projectName, context.maverickPath, taskId)
      if (!task) {
        throw new Error(`Task ${taskId} not found`)
      }

      // Use smart worktree categorization
      const { SmartWorktreeManager } = await import('./smart-worktree-manager')
      const { WorktreeQueueService } = await import('./worktree-queue-service')
      
      const suggestion = SmartWorktreeManager.suggestWorktreeName(
        task.title,
        task.description || '',
        task.type || 'TASK',
        task.functionalArea || '',
        [] // TODO: Load categories from project
      )
      
      const worktreeName = suggestion.worktreeName
      const category = suggestion.category
      
      console.log(`🤖 Smart categorization: ${task.title} → ${category?.team || 'uncategorized'} (${worktreeName})`)
      
      // Convert task to agent requirement
      const requirement = this.convertTaskToRequirement(task)
      
      // Create or use existing smart worktree
      const { WorktreeManager } = await import('./worktree-manager')
      const worktreeManager = new WorktreeManager(context.worktreePath)
      await worktreeManager.initialize()
      
      let worktreePath: string
      
      try {
        // Try to create the smart worktree (will succeed if it doesn't exist)
        worktreePath = await worktreeManager.createHierarchicalWorktree(
          projectName, 
          worktreeName, 
          'main'
        )
        console.log(`✅ Created new worktree: ${worktreeName}`)
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
          // Worktree already exists, use it
          worktreePath = worktreeManager.getWorktreePath(projectName, worktreeName)
          console.log(`🔄 Using existing worktree: ${worktreeName}`)
        } else {
          throw error
        }
      }
      
      // Add task to the worktree queue
      const queueService = WorktreeQueueService.getInstance()
      try {
        await queueService.addTaskToQueue(
          projectName,
          worktreeName,
          taskId,
          task.title,
          (task.type || 'TASK') as any,
          (task.priority || 'MEDIUM') as any
        )
        console.log(`📋 Added task to ${worktreeName} queue`)
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
          console.log(`⚠️ Task already in queue: ${taskId}`)
        } else {
          throw error
        }
      }
      
      // Start working on this task in the queue
      await queueService.startNextTask(projectName, worktreeName)
      
      // Configure agent options with smart worktree path
      const agentOptions: AgentExecutionOptions = {
        dryRun: options.dryRun || false,
        skipTests: options.skipTests || false,
        skipDemo: options.skipDemo || false,
        autoMerge: options.autoMerge || false,
        projectName: projectName,
        projectPath: worktreePath,
        ...options
      }

      // Update task status to IN_PROGRESS and store smart worktree info
      if (options.autoUpdateStatus !== false) {
        await hierarchicalTodoService.updateTodo(context.maverickPath, taskId, {
          status: 'IN_PROGRESS',
          worktreeName: worktreeName,
          worktreePath: worktreePath,
          worktreeStatus: 'ACTIVE'
        })
      }

      // Start agent execution
      const sessionId = await this.agentOrchestrator.startAgent(
        requirement,
        agentOptions
      )

      return {
        sessionId,
        success: true,
        worktreePath: worktreePath,
        branchName: worktreeName, // Now using smart team-based names
        artifacts: {
          screenshots: [],
          codeChanges: []
        },
        // Additional smart worktree info
        category: category || undefined,
        queuePosition: await this.getQueuePosition(projectName, worktreeName, taskId)
      }

    } catch (error) {
      console.error('Task execution failed:', error)
      return {
        sessionId: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * Get the position of a task in the worktree queue
   */
  private async getQueuePosition(projectName: string, worktreeName: string, taskId: string): Promise<number> {
    try {
      const { WorktreeQueueService } = await import('./worktree-queue-service')
      const queueService = WorktreeQueueService.getInstance()
      const queue = await queueService.loadQueue(projectName, worktreeName)
      
      const taskIndex = queue.tasks.findIndex(t => t.taskId === taskId)
      return taskIndex + 1 // 1-based position
    } catch (error) {
      return 0
    }
  }

  /**
   * Convert a hierarchical todo to an agent requirement string
   */
  private convertTaskToRequirement(task: HierarchicalTodo): string {
    let requirement = task.title

    // Add context from description if available
    if (task.description && task.description.trim()) {
      requirement += `\n\nDescription: ${task.description}`
    }

    // Add type-specific context
    switch (task.type) {
      case 'BUG':
        requirement = `Fix bug: ${requirement}`
        break
      case 'FEATURE':
        requirement = `Implement feature: ${requirement}`
        break
      case 'SUBTASK':
        requirement = `Complete subtask: ${requirement}`
        break
      case 'EPIC':
        requirement = `Implement epic: ${requirement}`
        break
    }

    // Add effort context
    if (task.estimatedEffort) {
      const effortGuide = {
        'XS': 'This is a very small task (< 30 mins)',
        'S': 'This is a small task (1-2 hours)',
        'M': 'This is a medium task (half day)',
        'L': 'This is a large task (1-2 days)',
        'XL': 'This is a very large task (3-5 days)',
        'XXL': 'This is an epic-sized task (1+ weeks)'
      }
      requirement += `\n\nEffort estimate: ${task.estimatedEffort} - ${effortGuide[task.estimatedEffort]}`
    }

    // Add priority context
    if (task.priority && task.priority !== 'MEDIUM') {
      requirement += `\n\nPriority: ${task.priority}`
    }

    return requirement
  }

  /**
   * Monitor agent execution and capture documentation artifacts
   * TODO: Complete implementation once AgentOrchestrator API is finalized
   */
  // private async monitorExecution(
  //   sessionId: string, 
  //   task: HierarchicalTodo, 
  //   maverickPath: string
  // ): Promise<{
  //   success: boolean
  //   worktreePath?: string
  //   branchName?: string
  //   artifacts?: any
  // }> {
    
  //   return new Promise((resolve) => {
  //     const checkStatus = async () => {
  //       try {
  //         const session = await this.agentOrchestrator.getSession(sessionId)
          
  //         if (!session) {
  //           resolve({ success: false })
  //           return
  //         }

  //         // Check if execution is complete
  //         if (session.status === 'completed') {
  //           // Update task status
  //           await hierarchicalTodoService.updateTodo(maverickPath, task.id, {
  //             status: 'DONE',
  //             worktreeName: session.worktreeSession.branchName,
  //             worktreePath: session.worktreeSession.worktreePath
  //           })

  //           // Generate comprehensive documentation
  //           const documentation = await this.generateTaskDocumentation(session, task)

  //           resolve({
  //             success: true,
  //             worktreePath: session.worktreeSession.worktreePath,
  //             branchName: session.worktreeSession.branchName,
  //             artifacts: {
  //               screenshots: session.artifacts.screenshots,
  //               demoVideo: session.artifacts.demoVideo,
  //               documentation,
  //               codeChanges: session.artifacts.codeChanges
  //             }
  //           })
  //           return
  //         }

  //         // Check if execution failed
  //         if (session.status === 'failed') {
  //           // Update task status back to PLANNED
  //           await hierarchicalTodoService.updateTodo(maverickPath, task.id, {
  //             status: 'PLANNED'
  //           })

  //           resolve({ 
  //             success: false,
  //             artifacts: {
  //               screenshots: session.artifacts.screenshots,
  //               codeChanges: session.artifacts.codeChanges
  //             }
  //           })
  //           return
  //         }

  //         // Still in progress, check again
  //         setTimeout(checkStatus, 5000) // Check every 5 seconds
  //       } catch (error) {
  //         console.error('Error monitoring execution:', error)
  //         resolve({ success: false })
  //       }
  //     }

  //     // Start monitoring
  //     checkStatus()
  //   })
  // }

  /**
   * Generate comprehensive documentation for completed task
   */
  private async generateTaskDocumentation(session: any, task: HierarchicalTodo): Promise<string> {
    const timestamp = new Date().toISOString()
    
    const documentation = `# Task Completion Report

## Task Details
- **ID**: ${task.id}
- **Title**: ${task.title}
- **Type**: ${task.type}
- **Priority**: ${task.priority}
- **Estimated Effort**: ${task.estimatedEffort || 'Not specified'}

## Execution Summary
- **Started**: ${session.startedAt}
- **Completed**: ${session.completedAt}
- **Duration**: ${this.calculateDuration(session.startedAt, session.completedAt)}
- **Worktree**: ${session.worktreeSession.branchName}
- **Status**: ${session.status}

## Artifacts Generated
- **Screenshots**: ${session.artifacts.screenshots.length} captured
- **Demo Video**: ${session.artifacts.demoVideo ? 'Yes' : 'No'}
- **Code Changes**: ${session.artifacts.codeChanges.length} files modified
- **Test Results**: ${session.artifacts.testResults.length} tests executed

## Implementation Details
${session.artifacts.codeChanges.map((change: string, index: number) => `
### Change ${index + 1}
\`\`\`
${change}
\`\`\`
`).join('\n')}

## Agent Logs
${session.artifacts.logs.map((log: any) => `
**${log.timestamp}** [${log.level}] ${log.message}
`).join('\n')}

## Screenshots
${session.artifacts.screenshots.map((screenshot: string, index: number) => `
![Step ${index + 1}](${screenshot})
`).join('\n')}

${session.artifacts.demoVideo ? `## Demo Video
![Demo Video](${session.artifacts.demoVideo})` : ''}

---
*Generated automatically by Maverick Task-Agent Integration*
*Report created: ${timestamp}*
`

    return documentation
  }

  /**
   * Get current execution status for a task
   * TODO: Complete implementation once AgentOrchestrator API is finalized
   */
  async getTaskExecutionStatus(taskId: string): Promise<{
    isExecuting: boolean
    sessionId?: string
    status?: string
    progress?: number
  }> {
    // TODO: Find active session for this task once getActiveSessions is implemented
    // const sessions = await this.agentOrchestrator.getActiveSessions()
    
    return { isExecuting: false }
  }

  /**
   * Stop task execution
   */
  async stopTaskExecution(sessionId: string): Promise<boolean> {
    try {
      await this.agentOrchestrator.stopAgent(sessionId)
      return true
    } catch (error) {
      console.error('Failed to stop task execution:', error)
      return false
    }
  }

  /**
   * Calculate execution progress percentage
   */
  private calculateProgress(session: any): number {
    if (!session.taskPlan?.steps) return 0
    
    const totalSteps = session.taskPlan.steps.length
    const currentStep = session.currentStep || 0
    
    return Math.round((currentStep / totalSteps) * 100)
  }

  /**
   * Calculate duration between two dates
   */
  private calculateDuration(start: Date, end: Date): string {
    const diff = end.getTime() - start.getTime()
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    
    return `${minutes}m ${seconds}s`
  }

  /**
   * Generate a standardized branch name from task title and type
   */
  private generateBranchName(title: string, type: string): string {
    // Determine prefix based on task type
    const prefixMap: Record<string, string> = {
      'BUG': 'fix',
      'FEATURE': 'feat',
      'TASK': 'task',
      'SUBTASK': 'fix', // Most subtasks are improvements/fixes
      'STORY': 'feat',
      'EPIC': 'feat'
    }
    
    const prefix = prefixMap[type] || 'task'
    
    // Clean and slugify the title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Collapse multiple hyphens
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .slice(0, 50) // Limit length
    
    return `${prefix}-${slug}`
  }
}

export const taskAgentIntegration = TaskAgentIntegration.getInstance()