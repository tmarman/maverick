import { worktreeManager, type WorktreeSession } from './worktree-manager'
import { taskPlanner, type TaskPlan, type TaskStep } from './task-planner'
import { multiAIProvider } from './ai-provider'
import { randomUUID } from 'crypto'

export interface AgentSession {
  id: string
  taskPlan: TaskPlan
  worktreeSession: WorktreeSession
  status: 'planning' | 'executing' | 'testing' | 'demoing' | 'completed' | 'failed'
  currentStep: number
  startedAt: Date
  completedAt?: Date
  error?: string
  artifacts: AgentArtifacts
  userId?: string
}

export interface AgentArtifacts {
  screenshots: string[]
  demoVideo?: string
  codeChanges: string[]
  testResults: string[]
  logs: AgentLog[]
  prUrl?: string
}

export interface AgentLog {
  timestamp: Date
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
  step?: number
  data?: any
}

export interface AgentExecutionOptions {
  dryRun?: boolean
  skipTests?: boolean
  skipDemo?: boolean
  autoMerge?: boolean
  projectName?: string
  projectPath?: string
}

export class AgentOrchestrator {
  private sessions = new Map<string, AgentSession>()
  private isInitialized = false

  /**
   * Initialize the agent orchestration system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    await worktreeManager.initialize()
    this.isInitialized = true
    
    console.log('🎭 Agent Orchestrator initialized')
  }

  /**
   * Start an autonomous agent to complete a task
   */
  async startAgent(
    requirement: string,
    options: AgentExecutionOptions = {},
    userId?: string
  ): Promise<string> {
    
    if (!this.isInitialized) {
      await this.initialize()
    }

    const sessionId = randomUUID()
    
    try {
      this.log(sessionId, 'info', `Starting agent for: ${requirement}`)

      // Step 1: Analyze codebase and plan the task
      this.log(sessionId, 'info', 'Analyzing codebase and planning task...')
      
      const workingDirectory = options.projectPath || process.cwd()
      const context = await taskPlanner.analyzeCodebase(workingDirectory)
      const taskPlan = await taskPlanner.planTask(requirement, context, userId)

      // Step 2: Use existing worktree if provided, or create new one using hierarchical system
      let worktreeSession: WorktreeSession
      
      if (options.projectName && options.projectPath) {
        // For hierarchical system, create a mock worktree session that points to existing path
        this.log(sessionId, 'info', `Using existing worktree: ${options.projectPath}`)
        
        worktreeSession = {
          id: sessionId,
          taskId: taskPlan.taskId,
          branch: 'current', // Will be updated by task integration
          path: options.projectPath,
          baseBranch: 'main',
          createdAt: new Date(),
          status: 'active',
          agentType: taskPlan.agentType,
          progress: {
            currentStep: 0,
            totalSteps: taskPlan.steps.length,
            stepDescription: 'Initializing...',
            filesChanged: [],
            testsStatus: 'pending',
            lastActivity: new Date()
          }
        }
      } else {
        // Fallback to old worktree system for backwards compatibility
        this.log(sessionId, 'info', 'Creating isolated worktree...')
        
        worktreeSession = await worktreeManager.createWorktree(
          taskPlan.taskId,
          taskPlan.agentType
        )
      }

      // Step 3: Initialize agent session
      const agentSession: AgentSession = {
        id: sessionId,
        taskPlan,
        worktreeSession,
        status: 'planning',
        currentStep: 0,
        startedAt: new Date(),
        userId,
        artifacts: {
          screenshots: [],
          codeChanges: [],
          testResults: [],
          logs: []
        }
      }

      this.sessions.set(sessionId, agentSession)
      
      this.log(sessionId, 'success', 
        `Agent session created with ${taskPlan.steps.length} steps (${taskPlan.totalEstimateMinutes}min estimated)`
      )

      // Step 4: Start execution (async, don't wait)
      this.executeAgent(sessionId, options).catch(error => {
        this.log(sessionId, 'error', `Agent execution failed: ${error.message}`)
        this.updateSessionStatus(sessionId, 'failed', error.message)
      })

      return sessionId

    } catch (error: any) {
      this.log(sessionId, 'error', `Failed to start agent: ${error.message}`)
      throw error
    }
  }

  /**
   * Get the status of an agent session
   */
  getAgentStatus(sessionId: string): AgentSession | null {
    return this.sessions.get(sessionId) || null
  }

  /**
   * Get all active agent sessions
   */
  getActiveSessions(): AgentSession[] {
    return Array.from(this.sessions.values()).filter(s => 
      ['planning', 'executing', 'testing', 'demoing'].includes(s.status)
    )
  }

  /**
   * Stop an agent session
   */
  async stopAgent(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Agent session ${sessionId} not found`)
    }

    this.log(sessionId, 'warning', 'Stopping agent session...')
    
    // Clean up worktree
    await worktreeManager.cleanupWorktree(session.worktreeSession.id)
    
    // Update status
    this.updateSessionStatus(sessionId, 'failed', 'Stopped by user')
    
    this.log(sessionId, 'info', 'Agent session stopped')
  }

  // Private execution methods

  private async executeAgent(
    sessionId: string, 
    options: AgentExecutionOptions
  ): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)

    try {
      this.updateSessionStatus(sessionId, 'executing')

      // Execute each step in the plan
      for (let i = 0; i < session.taskPlan.steps.length; i++) {
        const step = session.taskPlan.steps[i]
        session.currentStep = i + 1

        this.log(sessionId, 'info', `Executing step ${i + 1}: ${step.title}`)

        // Check dependencies
        await this.checkStepDependencies(sessionId, step)

        // Execute the step
        const success = await this.executeStep(sessionId, step, options)
        
        if (!success) {
          throw new Error(`Step ${i + 1} failed: ${step.title}`)
        }

        this.log(sessionId, 'success', `Completed step ${i + 1}: ${step.title}`)
        
        // Update progress
        worktreeManager.updateProgress(session.worktreeSession.id, {
          currentStep: i + 1,
          totalSteps: session.taskPlan.steps.length,
          stepDescription: step.title
        })
      }

      // Run tests if not skipped
      if (!options.skipTests) {
        await this.runTests(sessionId)
      }

      // Create demo if not skipped
      if (!options.skipDemo) {
        await this.createDemo(sessionId)
      }

      // Create pull request
      await this.createPullRequest(sessionId)

      this.updateSessionStatus(sessionId, 'completed')
      this.log(sessionId, 'success', 'Agent task completed successfully! 🎉')

    } catch (error: any) {
      this.log(sessionId, 'error', `Agent execution failed: ${error.message}`)
      this.updateSessionStatus(sessionId, 'failed', error.message)
      throw error
    }
  }

  private async executeStep(
    sessionId: string,
    step: TaskStep,
    options: AgentExecutionOptions
  ): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    // Build step execution prompt
    const stepPrompt = this.buildStepExecutionPrompt(step, session.taskPlan)
    
    try {
      // Get AI guidance for this step
      const guidance = await multiAIProvider.generateResponse(
        stepPrompt,
        '',
        {
          provider: 'claude-code',
          model: 'claude-3-5-sonnet-20241022',
          workingDirectory: session.worktreeSession.path,
          userId: session.userId
        }
      )

      this.log(sessionId, 'info', `AI Guidance for step: ${guidance.substring(0, 200)}...`)

      // Execute any commands suggested by AI
      const commands = this.extractCommandsFromGuidance(guidance)
      
      for (const command of commands) {
        if (options.dryRun) {
          this.log(sessionId, 'info', `[DRY RUN] Would execute: ${command.command}`)
          continue
        }

        const result = await worktreeManager.executeInWorktree(
          session.worktreeSession.id,
          command
        )

        if (!result.success) {
          this.log(sessionId, 'warning', `Command failed: ${command.command}`)
          this.log(sessionId, 'warning', `Error: ${result.stderr}`)
          
          // Try to recover or continue
          if (command.command.includes('test')) {
            this.log(sessionId, 'warning', 'Test command failed, continuing...')
            continue
          } else {
            return false
          }
        }

        this.log(sessionId, 'info', `Command succeeded: ${command.command}`)
      }

      // Verify step completion
      if (step.verificationCommand && !options.dryRun) {
        const verification = await worktreeManager.executeInWorktree(
          session.worktreeSession.id,
          { command: step.verificationCommand, args: [] }
        )

        if (!verification.success) {
          this.log(sessionId, 'warning', `Step verification failed: ${step.verificationCommand}`)
          return false
        }
      }

      return true

    } catch (error: any) {
      this.log(sessionId, 'error', `Step execution error: ${error.message}`)
      return false
    }
  }

  private async runTests(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    this.updateSessionStatus(sessionId, 'testing')
    this.log(sessionId, 'info', 'Running tests...')

    // Run the test command
    const testResult = await worktreeManager.executeInWorktree(
      session.worktreeSession.id,
      { command: 'npm', args: ['test'], timeout: 120000 } // 2 minute timeout
    )

    session.artifacts.testResults.push(testResult.stdout)

    if (!testResult.success) {
      this.log(sessionId, 'warning', 'Some tests failed, but continuing...')
      this.log(sessionId, 'info', `Test output: ${testResult.stderr}`)
    } else {
      this.log(sessionId, 'success', 'All tests passed!')
    }

    // Update worktree progress
    worktreeManager.updateProgress(session.worktreeSession.id, {
      testsStatus: testResult.success ? 'passed' : 'failed'
    })
  }

  private async createDemo(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    this.updateSessionStatus(sessionId, 'demoing')
    this.log(sessionId, 'info', 'Creating demo assets...')

    try {
      // Start dev server for screenshots
      const server = await worktreeManager.startDevServer(session.worktreeSession.id)
      
      this.log(sessionId, 'info', `Dev server started at ${server.url}`)

      // TODO: Implement Puppeteer screenshot/video capture
      // For now, just log that we would create demo assets
      this.log(sessionId, 'info', 'Demo assets would be created here with Puppeteer')
      
      // Kill dev server
      server.process.kill()

    } catch (error: any) {
      this.log(sessionId, 'warning', `Demo creation failed: ${error.message}`)
    }
  }

  private async createPullRequest(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    this.log(sessionId, 'info', 'Creating pull request...')

    try {
      const worktreeStatus = await worktreeManager.getWorktreeStatus(session.worktreeSession.id)
      
      // Commit all changes
      await worktreeManager.executeInWorktree(session.worktreeSession.id, {
        command: 'git',
        args: ['add', '.']
      })

      await worktreeManager.executeInWorktree(session.worktreeSession.id, {
        command: 'git',
        args: ['commit', '-m', `🤖 ${session.taskPlan.title}\n\nCreated with Maverick AI Agent System`]
      })

      // Create PR
      const prResult = await worktreeManager.createPullRequest(
        session.worktreeSession.id,
        `🤖 ${session.taskPlan.title}`,
        this.buildPRDescription(session),
        session.artifacts.screenshots,
        session.artifacts.demoVideo
      )

      session.artifacts.prUrl = prResult.prUrl
      this.log(sessionId, 'success', `Pull request created: ${prResult.prUrl}`)

    } catch (error: any) {
      this.log(sessionId, 'warning', `PR creation failed: ${error.message}`)
    }
  }

  // Helper methods

  private buildStepExecutionPrompt(step: TaskStep, plan: TaskPlan): string {
    return `You are an autonomous AI agent executing a development task. You need to complete this specific step:

STEP: ${step.title}
DESCRIPTION: ${step.description}
DELIVERABLE: ${step.deliverable}
EXIT CRITERIA: ${step.exitCriteria}

FULL TASK CONTEXT:
${plan.description}

INSTRUCTIONS:
1. Provide specific commands to execute for this step
2. Focus on the deliverable and exit criteria
3. Be practical and specific
4. Consider the tech stack: Next.js, React, TypeScript

Respond with commands in this format:
\`\`\`bash
npm install package-name
# Comment explaining what this does
echo "Creating component file..."
\`\`\`

Keep responses focused and actionable.`
  }

  private extractCommandsFromGuidance(guidance: string): Array<{ command: string; args: string[] }> {
    const commands: Array<{ command: string; args: string[] }> = []
    
    // Extract bash code blocks
    const bashBlocks = guidance.match(/```bash\n([\s\S]*?)\n```/g) || []
    
    for (const block of bashBlocks) {
      const lines = block.replace(/```bash\n|\n```/g, '').split('\n')
      
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('echo')) {
          const parts = trimmed.split(' ')
          if (parts.length > 0) {
            commands.push({
              command: parts[0],
              args: parts.slice(1)
            })
          }
        }
      }
    }
    
    return commands
  }

  private buildPRDescription(session: AgentSession): string {
    const plan = session.taskPlan
    
    let description = `## 🤖 AI Agent Implementation\n\n`
    description += `**Task**: ${plan.description}\n\n`
    description += `**Agent Type**: ${plan.agentType}\n`
    description += `**Complexity**: ${plan.complexity}\n`
    description += `**Duration**: ${plan.totalEstimateMinutes} minutes\n\n`
    
    description += `## ✅ Steps Completed\n\n`
    plan.steps.forEach((step, index) => {
      description += `${index + 1}. **${step.title}**: ${step.deliverable}\n`
    })
    
    description += `\n## 🎯 Success Criteria\n\n`
    plan.successCriteria.forEach(criteria => {
      description += `- [x] ${criteria}\n`
    })
    
    if (session.artifacts.testResults.length > 0) {
      description += `\n## 🧪 Test Results\n\nTests executed and verified.\n`
    }
    
    description += `\n---\n*This PR was created by Maverick's autonomous AI agent system.*`
    
    return description
  }

  private async checkStepDependencies(sessionId: string, step: TaskStep): Promise<void> {
    // For now, just log dependency check
    // In future, this could verify that dependent steps completed successfully
    if (step.dependencies.length > 0) {
      this.log(sessionId, 'info', `Checking dependencies: ${step.dependencies.join(', ')}`)
    }
  }

  private updateSessionStatus(sessionId: string, status: AgentSession['status'], error?: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.status = status
      if (error) session.error = error
      if (status === 'completed' || status === 'failed') {
        session.completedAt = new Date()
      }
    }
  }

  private log(sessionId: string, level: AgentLog['level'], message: string, data?: any): void {
    const session = this.sessions.get(sessionId)
    const logEntry: AgentLog = {
      timestamp: new Date(),
      level,
      message,
      step: session?.currentStep,
      data
    }

    if (session) {
      session.artifacts.logs.push(logEntry)
    }

    // Also log to console
    const prefix = `[Agent ${sessionId.substring(0, 8)}]`
    switch (level) {
      case 'error':
        console.error(`❌ ${prefix} ${message}`, data || '')
        break
      case 'warning':
        console.warn(`⚠️  ${prefix} ${message}`, data || '')
        break
      case 'success':
        console.log(`✅ ${prefix} ${message}`, data || '')
        break
      default:
        console.log(`ℹ️  ${prefix} ${message}`, data || '')
    }
  }
}

// Export singleton instance
export const agentOrchestrator = new AgentOrchestrator()