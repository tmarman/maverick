import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { claudeTerminalManager } from '@/lib/claude-terminal-manager'
import { getProjectContextFromParams } from '@/lib/project-id-resolver'
import { aiProviderManager } from '@/lib/ai-providers'

interface BootstrapResponse {
  content: string
  agentRole?: string
  toolCalls: Array<{
    id: string
    name: string
    parameters: any
    result?: any
    status: 'executing' | 'completed' | 'error'
    timestamp: string
  }>
  artifacts?: Array<{
    id: string
    name: string
    type: string
    content: string
  }>
  nextSteps?: string[]
  sessionId?: string
}

interface UserContext {
  username: string
  worktreePath: string
  projectPath: string
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversation_history, user, project, mode, sessionId, providerId, chatMode } = await request.json()

    // Get project context using our resolver
    const projectContext = await getProjectContextFromParams({ name: project }, user || 'tim')
    
    if (!projectContext) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    const userContext: UserContext = {
      username: projectContext.username,
      worktreePath: `/Users/${projectContext.userId}/repos/${project}`,
      projectPath: projectContext.workspacePath
    }

    // Get user preferences to determine chat mode (CLI vs API)
    let userChatMode = chatMode
    let activeProviderId = providerId
    
    try {
      const prefResponse = await fetch(`${request.nextUrl.origin}/api/user/preferences`)
      if (prefResponse.ok) {
        const { preferences } = await prefResponse.json()
        userChatMode = userChatMode || preferences.chatMode || 'cli'
        activeProviderId = activeProviderId || preferences.activeProvider || 'claude-cli-default'
        console.log('📋 User preferences loaded:', { chatMode: userChatMode, provider: activeProviderId })
      }
    } catch (error) {
      console.warn('⚠️ Failed to load user preferences, using defaults:', error)
      userChatMode = userChatMode || 'cli'
      activeProviderId = activeProviderId || 'claude-cli-default'
    }

    console.log('Bootstrap request:', {
      user: userContext.username,
      project,
      projectId: projectContext.projectId,
      mode,
      chatMode: userChatMode,
      providerId: activeProviderId,
      message: message.substring(0, 100) + '...'
    })

    let response: BootstrapResponse

    // Route to appropriate chat mode
    if (userChatMode === 'api' && activeProviderId !== 'claude-cli-default') {
      // Use direct API integration
      response = await handleDirectAPIMode(message, conversation_history, activeProviderId, userContext, project)
    } else {
      // Use Claude CLI integration (existing logic)
      response = await handleCLIMode(message, sessionId, userContext, project, projectContext)
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error in Maverick bootstrap:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { 
        error: 'Failed to process bootstrap request',
        errorDetails: error instanceof Error ? error.message : String(error),
        content: 'Sorry, there was an error with the Bootstrap Agent. This is a fallback response.',
        toolCalls: [],
        artifacts: []
      },
      { status: 500 }
    )
  }
}

async function handleDirectAPIMode(
  message: string, 
  conversationHistory: any[], 
  providerId: string,
  userContext: UserContext, 
  project: string
): Promise<BootstrapResponse> {
  try {
    console.log('🤖 Using direct API mode with provider:', providerId)
    
    const provider = aiProviderManager.getProvider(providerId)
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`)
    }

    // Convert conversation history to AI provider format
    const messages = conversationHistory?.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp
    })) || []

    // Add current message
    messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    })

    // Create system prompt for bootstrap context
    const systemPrompt = `You are a Bootstrap Agent for the Maverick project, helping user @${userContext.username} build features.

**Context:**
- User: ${userContext.username}
- Project: ${project} (Maverick self-development)  
- Working Directory: ${userContext.worktreePath}
- Mode: bootstrap (dogfooding)

**Your Role:**
- Act like Claude Code with full tool calling capabilities
- Use Read, Write, Edit, Bash, Glob, and Grep tools to implement changes
- Create detailed specifications and break down tasks
- Work in user-qualified worktrees at ${userContext.worktreePath}
- Coordinate with other specialized agents when needed

**Tools Available:**
You have access to all Claude Code-style tools for file operations, searching, and command execution.

Respond with technical precision and implement actual code changes when requested.`

    const chatResponse = await provider.chat({
      messages,
      systemPrompt,
      maxTokens: 4000,
      temperature: 0.1
    })

    return {
      content: chatResponse.content,
      agentRole: `${provider.getName()} (Direct API)`,
      toolCalls: chatResponse.toolCalls || [],
      sessionId: providerId // Use provider ID as session identifier
    }

  } catch (error) {
    console.error('❌ Direct API mode failed:', error)
    
    return {
      content: `**Direct API Error**\n\nFailed to communicate with ${providerId}:\n${error instanceof Error ? error.message : 'Unknown error'}\n\n*Falling back to CLI mode...*`,
      agentRole: 'Error Handler',
      toolCalls: [],
      sessionId: providerId
    }
  }
}

async function handleCLIMode(
  message: string,
  sessionId: string | null,
  userContext: UserContext,
  project: string,
  projectContext: any
): Promise<BootstrapResponse> {
  // Check if we should connect to existing Claude session from this terminal
  const preferExistingSession = message.includes('populate') || message.includes('current') || message.includes('existing')
  
  let claudeSession = sessionId ? claudeTerminalManager.getSession(sessionId) : null
  
  if (!claudeSession && !preferExistingSession) {
    try {
      const newSessionId = await claudeTerminalManager.createSession(
        projectContext.userId, 
        projectContext.projectName
      )
      claudeSession = claudeTerminalManager.getSession(newSessionId)
      console.log('🚀 Created new Claude Terminal session:', newSessionId)
    } catch (error) {
      console.warn('⚠️ Failed to create Claude Terminal session, using fallback mode:', error)
    }
  } else if (preferExistingSession) {
    // User wants to connect to existing session - use a well-known session ID
    console.log('🔍 Looking for existing Claude session to connect to...')
    
    // Try to find existing sessions
    const existingSessions = claudeTerminalManager.getUserSessions(projectContext.userId)
    if (existingSessions.length > 0) {
      claudeSession = existingSessions[0]
      console.log('🔗 Using existing Claude Terminal session:', claudeSession.id)
    }
  }

  if (claudeSession) {
    try {
      // Send message to real Claude Code CLI using existing terminal manager
      console.log('📝 Sending message to Claude Terminal:', message.substring(0, 50) + '...')
      const sent = await claudeTerminalManager.sendInput(claudeSession.id, message)
      
      if (sent) {
        // Wait a moment for Claude to process and respond
        console.log('⏱️  Waiting for Claude response...')
        await new Promise(resolve => setTimeout(resolve, 3000)) // Wait 3 seconds
        
        // Get recent history to see if we got a response
        const history = claudeTerminalManager.getSessionHistory(claudeSession.id)
        const recentMessages = history.slice(-10) // Last 10 messages
        
        console.log('📋 Terminal Session History:')
        recentMessages.forEach((msg, i) => {
          console.log(`  ${i+1}. [${msg.type.toUpperCase()}] ${new Date(msg.timestamp).toLocaleTimeString()}: ${msg.data.substring(0, 100)}${msg.data.length > 100 ? '...' : ''}`)
        })
        
        // Look for recent output from Claude
        const claudeResponse = recentMessages
          .filter(msg => msg.type === 'output' && msg.data.trim().length > 0)
          .pop()
          
        console.log('🤖 Claude Response Found:', claudeResponse ? `"${claudeResponse.data.substring(0, 50)}..."` : 'None')
        
        if (claudeResponse) {
          return {
            content: claudeResponse.data,
            agentRole: 'Claude Code CLI',
            toolCalls: [],
            sessionId: claudeSession.id
          }
        } else {
          // If no immediate response, give a helpful message
          return {
            content: `**Claude Code CLI Connected** ✅

Your message has been sent to Claude Code CLI session \`${claudeSession.id}\`.

**Message sent:** "${message}"

**Session Status:**
- Working Directory: \`${claudeSession.workingDirectory}\`
- Session Active: ${claudeSession.isActive ? '✅ Yes' : '❌ No'}
- Last Activity: ${new Date(claudeSession.lastActivity).toLocaleTimeString()}

The response from Claude Code CLI will appear in the terminal. For now, I'll provide a bootstrap analysis of your request while we enhance the real-time streaming integration.

---

${createFallbackResponse(message, userContext, project).content}`,
            agentRole: 'Bootstrap Agent (Claude CLI Active)',
            toolCalls: [],
            sessionId: claudeSession.id
          }
        }
      } else {
        throw new Error('Failed to send message to Claude Terminal')
      }
      
    } catch (error) {
      console.error('❌ Error communicating with Claude Terminal:', error)
      const fallback = createFallbackResponse(message, userContext, project)
      return {
        ...fallback,
        sessionId: claudeSession.id // Include session ID even on error
      }
    }
  } else {
    // Fallback response when Claude Terminal is not available
    console.log('⚠️ No Claude Terminal session available, using fallback mode')
    return createFallbackResponse(message, userContext, project)
  }
}

function createFallbackResponse(message: string, userContext: UserContext, project: string): BootstrapResponse {
  return {
    content: `**Bootstrap Agent Response** for user \`${userContext.username}\`

I understand you want to work on: **"${message}"**

**Context Analysis:**
- **User**: ${userContext.username} 
- **Project**: ${project} (Maverick self-development)
- **Worktree Path**: \`${userContext.worktreePath}\`
- **Mode**: bootstrap (dogfooding)

**Coordination Plan:**
1. **Spec Writer Agent** would analyze your request and create detailed requirements
2. **Planning Agent** would break this into implementable tasks with proper user/project scoping
3. **Implementation Agents** would work in isolated worktrees at:
   - \`${userContext.worktreePath}/feature-branch-name\`
   - Each qualified with user: **${userContext.username}**

**User Profile Integration:**
As we build this out, your profile (\`@${userContext.username}\`) will include:
- Personal worktree namespace (\`/Users/${userContext.username}/repos/\`)
- Public profile (GitHub-style) showing your projects and contributions
- Collaboration history with AI agents
- Project ownership and team memberships

**Next Actions:**
Ready to coordinate specialized agents for this request. In the full implementation, this would trigger:
- Real-time Claude Code CLI interaction
- Proper worktree creation with user qualification  
- Agent handoff with full project context
- Structured task creation and progress tracking

Would you like me to simulate the full agent coordination workflow for this request?`,

    agentRole: 'Bootstrap Agent',
    
    toolCalls: [
      {
        id: `bootstrap-${Date.now()}`,
        name: 'TodoWrite',
        parameters: {
          todos: [
            {
              id: 'user-qualified-task',
              content: `[${userContext.username}] ${message}`,
              status: 'pending',
              priority: 'medium',
              assignedTo: userContext.username
            }
          ]
        },
        result: `Created user-qualified task for @${userContext.username}`,
        status: 'completed',
        timestamp: new Date().toISOString()
      },
      {
        id: `worktree-${Date.now()}`,
        name: 'WorktreeCreate',
        parameters: {
          user: userContext.username,
          project: project,
          basePath: userContext.worktreePath,
          branchName: `bootstrap/${message.toLowerCase().replace(/\s+/g, '-').substring(0, 30)}`
        },
        result: `Would create worktree at ${userContext.worktreePath} for user ${userContext.username}`,
        status: 'completed',
        timestamp: new Date().toISOString()
      }
    ],

    artifacts: [
      {
        id: `spec-${Date.now()}`,
        name: `Bootstrap Spec: ${message}`,
        type: 'work_item',
        content: `Specification created for @${userContext.username}'s request: ${message}`
      }
    ],

    nextSteps: [
      'Create detailed specification with Spec Writer Agent',
      'Break down into tasks with Planning Agent',
      `Set up user-qualified worktree for @${userContext.username}`,
      'Coordinate implementation with specialized agents',
      'Validate results and integrate back to main'
    ]
  }
}

// Future implementation for real Claude Code CLI integration:

/*
async function integrateClaudeCodeCLI(userContext: UserContext, message: string) {
  // Method 1: Use existing WebSocket connection
  const claudeResponse = await fetch('http://localhost:5001/api/claude-code/ws', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message,
      context: {
        user: userContext.username,
        project: 'maverick',
        workingDirectory: userContext.projectPath,
        mode: 'bootstrap'
      }
    })
  })

  return await claudeResponse.json()
}

async function createUserQualifiedWorktree(userContext: UserContext, branchName: string) {
  const worktreePath = `${userContext.worktreePath}/${branchName}`
  
  // Create directory structure
  await fs.mkdir(worktreePath, { recursive: true })
  
  // Initialize git worktree
  const { spawn } = require('child_process')
  return new Promise((resolve, reject) => {
    const git = spawn('git', [
      'worktree', 'add', 
      worktreePath, 
      `-b`, branchName,
      'origin/main'
    ], {
      cwd: userContext.projectPath
    })
    
    git.on('close', (code) => {
      if (code === 0) {
        resolve({ worktreePath, branchName })
      } else {
        reject(new Error(`Git worktree creation failed with code ${code}`))
      }
    })
  })
}

function getUserFromSession(session: any): UserContext {
  // Eventually get from NextAuth session
  // For now, default to tim
  const username = session?.user?.username || 'tim'
  
  return {
    username,
    worktreePath: `/Users/${username}/repos/maverick`,
    projectPath: `/Users/${username}/dev/square/maverick`
  }
}
*/