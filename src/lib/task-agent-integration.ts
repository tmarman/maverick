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
  artifacts?: {
    screenshots: string[]
    demoVideo?: string
    documentation?: string
    codeChanges: string[]
  }
  error?: string
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
   * Execute a task using the agent orchestrator with full documentation
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

      // Convert task to agent requirement
      const requirement = this.convertTaskToRequirement(task)
      
      // Configure agent options with documentation capture
      const agentOptions: AgentExecutionOptions = {
        dryRun: options.dryRun || false,
        skipTests: options.skipTests || false,
        skipDemo: options.skipDemo || false,
        autoMerge: options.autoMerge || false,
        projectName: projectName,
        projectPath: context.workingDirectory,
        ...options
      }

      // Update task status to IN_PROGRESS
      if (options.autoUpdateStatus !== false) {
        await hierarchicalTodoService.updateTodo(context.maverickPath, taskId, {
          status: 'IN_PROGRESS'
        })
      }

      // Start agent execution
      const sessionId = await this.agentOrchestrator.startAgent(
        requirement,
        agentOptions,
        request.options?.userId
      )

      // Monitor execution and capture artifacts
      const result = await this.monitorExecution(sessionId, task, context.maverickPath)

      return {
        sessionId,
        success: result.success,
        worktreePath: result.worktreePath,
        branchName: result.branchName,
        artifacts: result.artifacts
      }

    } catch (error) {
      console.error('Task execution failed:', error)
      return {
        sessionId: '',
        success: false,
        error: error.message
      }
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
   */
  private async monitorExecution(
    sessionId: string, 
    task: HierarchicalTodo, 
    maverickPath: string
  ): Promise<{
    success: boolean
    worktreePath?: string
    branchName?: string
    artifacts?: any
  }> {
    
    return new Promise((resolve) => {
      const checkStatus = async () => {
        try {
          const session = await this.agentOrchestrator.getSession(sessionId)
          
          if (!session) {
            resolve({ success: false })
            return
          }

          // Check if execution is complete
          if (session.status === 'completed') {
            // Update task status
            await hierarchicalTodoService.updateTodo(maverickPath, task.id, {
              status: 'DONE',
              worktreeName: session.worktreeSession.branchName,
              worktreePath: session.worktreeSession.worktreePath
            })

            // Generate comprehensive documentation
            const documentation = await this.generateTaskDocumentation(session, task)

            resolve({
              success: true,
              worktreePath: session.worktreeSession.worktreePath,
              branchName: session.worktreeSession.branchName,
              artifacts: {
                screenshots: session.artifacts.screenshots,
                demoVideo: session.artifacts.demoVideo,
                documentation,
                codeChanges: session.artifacts.codeChanges
              }
            })
            return
          }

          // Check if execution failed
          if (session.status === 'failed') {
            // Update task status back to PLANNED
            await hierarchicalTodoService.updateTodo(maverickPath, task.id, {
              status: 'PLANNED'
            })

            resolve({ 
              success: false,
              artifacts: {
                screenshots: session.artifacts.screenshots,
                codeChanges: session.artifacts.codeChanges
              }
            })
            return
          }

          // Still in progress, check again
          setTimeout(checkStatus, 5000) // Check every 5 seconds
        } catch (error) {
          console.error('Error monitoring execution:', error)
          resolve({ success: false })
        }
      }

      // Start monitoring
      checkStatus()
    })
  }

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
${session.artifacts.codeChanges.map((change, index) => `
### Change ${index + 1}
\`\`\`
${change}
\`\`\`
`).join('\n')}

## Agent Logs
${session.artifacts.logs.map(log => `
**${log.timestamp}** [${log.level}] ${log.message}
`).join('\n')}

## Screenshots
${session.artifacts.screenshots.map((screenshot, index) => `
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
   */
  async getTaskExecutionStatus(taskId: string): Promise<{
    isExecuting: boolean
    sessionId?: string
    status?: string
    progress?: number
  }> {
    // Find active session for this task
    const sessions = await this.agentOrchestrator.getActiveSessions()
    const taskSession = sessions.find(session => 
      session.taskPlan?.requirement?.includes(taskId) ||
      session.worktreeSession?.metadata?.taskId === taskId
    )

    if (!taskSession) {
      return { isExecuting: false }
    }

    return {
      isExecuting: true,
      sessionId: taskSession.id,
      status: taskSession.status,
      progress: this.calculateProgress(taskSession)
    }
  }

  /**
   * Stop task execution
   */
  async stopTaskExecution(sessionId: string): Promise<boolean> {
    return await this.agentOrchestrator.stopAgent(sessionId)
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
}

export const taskAgentIntegration = TaskAgentIntegration.getInstance()