import { randomUUID } from 'crypto'
import * as fs from 'fs/promises'
import * as path from 'path'

interface ClaudeSession {
  id: string
  workItemId: string
  projectName: string
  worktreeName?: string
  githubBranch?: string
  sessionType: 'planning' | 'development' | 'review' | 'testing'
  messages: ClaudeMessage[]
  context: {
    workItemTitle: string
    workItemDescription: string
    workItemType: string
    projectDescription: string
    repositoryUrl?: string
    technicalContext: string[]
    businessContext: string[]
  }
  createdAt: string
  lastActiveAt: string
  status: 'active' | 'paused' | 'completed'
}

interface ClaudeMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: {
    codeGenerated?: boolean
    filesModified?: string[]
    commandsExecuted?: string[]
    decisionsMade?: string[]
  }
}

class ClaudeSessionManager {
  private sessionsDir: string

  constructor(projectName: string) {
    this.sessionsDir = path.join(process.cwd(), 'projects', projectName, '.maverick', 'claude-sessions')
  }

  async createSession(
    workItemId: string,
    workItem: any,
    project: any,
    sessionType: ClaudeSession['sessionType'] = 'development'
  ): Promise<ClaudeSession> {
    const sessionId = randomUUID()
    const timestamp = new Date().toISOString()

    // Generate rich system context
    const systemPrompt = this.generateSystemPrompt(workItem, project, sessionType)
    
    const session: ClaudeSession = {
      id: sessionId,
      workItemId,
      projectName: project.name,
      worktreeName: workItem.worktreeName,
      githubBranch: workItem.githubBranch,
      sessionType,
      messages: [
        {
          id: 'system-init',
          role: 'system',
          content: systemPrompt,
          timestamp,
          metadata: {}
        }
      ],
      context: {
        workItemTitle: workItem.title,
        workItemDescription: workItem.description || '',
        workItemType: workItem.type,
        projectDescription: project.description || '',
        repositoryUrl: project.repositoryUrl,
        technicalContext: await this.extractTechnicalContext(project),
        businessContext: await this.extractBusinessContext(workItem, project)
      },
      createdAt: timestamp,
      lastActiveAt: timestamp,
      status: 'active'
    }

    await this.saveSession(session)
    return session
  }

  async getOrCreateSession(
    workItemId: string,
    workItem: any,
    project: any,
    sessionType: ClaudeSession['sessionType'] = 'development'
  ): Promise<ClaudeSession> {
    const existingSession = await this.findActiveSession(workItemId, sessionType)
    
    if (existingSession) {
      // Update last active time
      existingSession.lastActiveAt = new Date().toISOString()
      await this.saveSession(existingSession)
      return existingSession
    }

    return await this.createSession(workItemId, workItem, project, sessionType)
  }

  async addMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: ClaudeMessage['metadata']
  ): Promise<ClaudeSession> {
    const session = await this.loadSession(sessionId)
    if (!session) throw new Error('Session not found')

    const message: ClaudeMessage = {
      id: randomUUID(),
      role,
      content,
      timestamp: new Date().toISOString(),
      metadata: metadata || {}
    }

    session.messages.push(message)
    session.lastActiveAt = message.timestamp

    await this.saveSession(session)
    return session
  }

  private generateSystemPrompt(workItem: any, project: any, sessionType: string): string {
    const baseContext = `You are Claude, an AI assistant working on the "${project.name}" project. You're specifically focused on this work item:

**Work Item:** ${workItem.title}
**Type:** ${workItem.type}
**Priority:** ${workItem.priority}
**Description:** ${workItem.description || 'No description provided'}

**Project Context:**
- Project: ${project.name}
- Type: ${project.type}
- Repository: ${project.repositoryUrl || 'Not specified'}
${workItem.worktreeName ? `- Working Branch: ${workItem.worktreeName}` : ''}

**Your Role:** You are the technical lead responsible for this specific work item. You understand both the business requirements and technical implementation details.`

    const sessionSpecificPrompts = {
      planning: `
**PLANNING SESSION GUIDELINES:**

You're in planning mode. Your job is to:
1. Understand the business requirements deeply
2. Break down the work into clear, actionable steps
3. Identify technical dependencies and risks
4. Propose architecture and implementation approaches
5. Create detailed specifications that developers can follow

Always consider:
- User experience and business value
- Technical feasibility and maintainability
- Integration with existing systems
- Performance and scalability implications
- Testing and quality assurance needs

Be thorough but practical. Ask clarifying questions when requirements are unclear.`,

      development: `
**DEVELOPMENT SESSION GUIDELINES:**

You're in active development mode. You have full access to:
- The project codebase and file system
- Terminal commands and development tools
- Git operations and branch management
- Testing and debugging capabilities

Your responsibilities:
1. Write clean, maintainable code that follows project conventions
2. Implement features according to the requirements
3. Write appropriate tests and documentation
4. Commit changes with clear, descriptive messages
5. Consider security, performance, and edge cases

Development approach:
- Start with the simplest working solution
- Follow existing code patterns and conventions
- Write tests as you develop
- Make small, focused commits
- Document any architectural decisions

Always prioritize code quality and maintainability over speed.`,

      review: `
**REVIEW SESSION GUIDELINES:**

You're in review mode. Your focus is on:
1. Code quality and adherence to standards
2. Testing coverage and edge cases
3. Documentation completeness
4. Performance and security considerations
5. User experience validation

Review criteria:
- Does the code solve the stated problem?
- Is it maintainable and well-documented?
- Are there sufficient tests?
- Does it follow project conventions?
- Are there any security concerns?
- Is the user experience optimal?

Provide constructive feedback and specific suggestions for improvement.`,

      testing: `
**TESTING SESSION GUIDELINES:**

You're in testing mode. Your responsibilities:
1. Develop comprehensive test strategies
2. Write unit, integration, and end-to-end tests
3. Identify edge cases and error conditions
4. Validate user workflows and acceptance criteria
5. Performance and load testing considerations

Testing approach:
- Cover happy path scenarios first
- Test error conditions and edge cases
- Verify all acceptance criteria
- Test user workflows end-to-end
- Consider performance under load
- Validate security requirements

Ensure thorough test coverage before marking work as complete.`
    }

    return `${baseContext}

${sessionSpecificPrompts[sessionType as keyof typeof sessionSpecificPrompts] || sessionSpecificPrompts.development}

**Communication Style:**
- Be direct and practical
- Ask clarifying questions when needed
- Explain your reasoning for technical decisions
- Provide code examples when helpful
- Keep the business context in mind
- Focus on delivering working solutions

Remember: You're working on a specific work item with clear goals. Stay focused on completing this work item successfully while maintaining high quality standards.`
  }

  private async extractTechnicalContext(project: any): Promise<string[]> {
    // This would analyze the project structure, package.json, etc.
    // For now, return some basic context
    return [
      'Next.js 15.4 with React 18.3',
      'TypeScript with strict mode',
      'Tailwind CSS for styling',
      'Prisma ORM with SQL Server',
      'Git-based project management',
      'Markdown-based work item storage'
    ]
  }

  private async extractBusinessContext(workItem: any, project: any): Promise<string[]> {
    return [
      `Working on ${workItem.type.toLowerCase()} for ${project.name}`,
      `Priority level: ${workItem.priority}`,
      `Part of ${workItem.functionalArea} functionality`,
      'Focus on user experience and business value',
      'Non-technical users will interact with this feature'
    ]
  }

  private async findActiveSession(workItemId: string, sessionType: string): Promise<ClaudeSession | null> {
    try {
      await fs.mkdir(this.sessionsDir, { recursive: true })
      const files = await fs.readdir(this.sessionsDir)
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const content = await fs.readFile(path.join(this.sessionsDir, file), 'utf-8')
            const session: ClaudeSession = JSON.parse(content)
            
            if (session.workItemId === workItemId && 
                session.sessionType === sessionType && 
                session.status === 'active') {
              return session
            }
          } catch (error) {
            console.error(`Error reading session file ${file}:`, error)
          }
        }
      }
    } catch (error) {
      console.error('Error finding active session:', error)
    }
    
    return null
  }

  private async loadSession(sessionId: string): Promise<ClaudeSession | null> {
    try {
      const filePath = path.join(this.sessionsDir, `${sessionId}.json`)
      const content = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      console.error('Error loading session:', error)
      return null
    }
  }

  private async saveSession(session: ClaudeSession): Promise<void> {
    try {
      await fs.mkdir(this.sessionsDir, { recursive: true })
      const filePath = path.join(this.sessionsDir, `${session.id}.json`)
      await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8')
    } catch (error) {
      console.error('Error saving session:', error)
      throw error
    }
  }

  async getSessionHistory(sessionId: string): Promise<ClaudeMessage[]> {
    const session = await this.loadSession(sessionId)
    return session?.messages || []
  }

  async completeSession(sessionId: string): Promise<void> {
    const session = await this.loadSession(sessionId)
    if (session) {
      session.status = 'completed'
      session.lastActiveAt = new Date().toISOString()
      await this.saveSession(session)
    }
  }

  async pauseSession(sessionId: string): Promise<void> {
    const session = await this.loadSession(sessionId)
    if (session) {
      session.status = 'paused'
      session.lastActiveAt = new Date().toISOString()
      await this.saveSession(session)
    }
  }

  async getWorkItemSessions(workItemId: string): Promise<ClaudeSession[]> {
    try {
      await fs.mkdir(this.sessionsDir, { recursive: true })
      const files = await fs.readdir(this.sessionsDir)
      const sessions: ClaudeSession[] = []
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const content = await fs.readFile(path.join(this.sessionsDir, file), 'utf-8')
            const session: ClaudeSession = JSON.parse(content)
            
            if (session.workItemId === workItemId) {
              sessions.push(session)
            }
          } catch (error) {
            console.error(`Error reading session file ${file}:`, error)
          }
        }
      }
      
      // Sort by last active (most recent first)
      return sessions.sort((a, b) => 
        new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
      )
    } catch (error) {
      console.error('Error getting work item sessions:', error)
      return []
    }
  }
}

export { ClaudeSessionManager, type ClaudeSession, type ClaudeMessage }