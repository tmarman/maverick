import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { projectContextService } from '@/lib/project-context-service'
import { hierarchicalTodoService } from '@/lib/hierarchical-todos'
import { claudeService } from '@/lib/claude-service'
import { ChatProviderFactory, type ChatMessage, type ChatContext, type ChatProviderConfig } from '@/lib/chat-ai-provider'

export const runtime = 'nodejs'

interface ChatScope {
  type: 'project' | 'task' | 'feature' | 'epic'
  id?: string
  title?: string
  projectName: string
  workingDirectory?: string
  branchName?: string
  worktreePath?: string
  context?: Record<string, any>
}

interface ChatMessageWithScope {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  scope: ChatScope
}

// POST /api/chat/claude-stream
export async function POST(request: NextRequest) {
  console.log('🎬 Claude stream API called')
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.log('❌ No session found')
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const { message, scope, conversationHistory, projectContext, provider = 'claude' } = body
    
    console.log('📨 Stream request:', { 
      message: message.substring(0, 100) + '...', 
      scopeType: scope.type,
      provider,
      historyLength: conversationHistory?.length || 0 
    })

    // Get API key for the selected provider
    let apiKey = null
    if (provider === 'claude') {
      apiKey = await claudeService.getApiKey(session.user.id)
    }

    // Build provider configuration
    const providerConfig: ChatProviderConfig = {
      provider,
      apiKey: apiKey || undefined,
      userId: session.user.id
    }

    // Build chat context
    const chatContext: ChatContext = {
      workingDirectory: scope.workingDirectory || projectContext?.workingDirectory,
      projectName: scope.projectName,
      branchName: scope.branchName,
      taskId: scope.id,
      codebaseContext: await getCodebaseContext(scope, projectContext)
    }

    // Convert conversation history to chat format
    const chatMessages: ChatMessage[] = [
      ...conversationHistory.map((msg: ChatMessageWithScope) => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      })),
      { role: 'user' as const, content: message, timestamp: new Date() }
    ]

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log(`🤖 Creating ${provider} provider...`)
          
          // Create the AI provider
          const aiProvider = await ChatProviderFactory.createProvider(providerConfig)
          
          // Check if provider is available
          const isAvailable = await aiProvider.isAvailable()
          if (!isAvailable) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'error',
                error: `${aiProvider.getName()} is not available. Please check your configuration.`
              })}\n\n`)
            )
            controller.close()
            return
          }

          console.log(`✅ ${aiProvider.getName()} provider ready`)

          // Stream the chat response
          await aiProvider.streamChat(chatMessages, chatContext, (chunk) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
            )
          })

        } catch (error) {
          console.error('Streaming error:', error)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : 'Unknown streaming error'
            })}\n\n`)
          )
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

  } catch (error) {
    console.error('Chat stream error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

async function getCodebaseContext(scope: ChatScope, projectContext: any): Promise<string> {
  // Build codebase context for the AI
  let context = `Project: ${scope.projectName}\n`
  
  if (scope.workingDirectory) {
    context += `Working Directory: ${scope.workingDirectory}\n`
  }
  
  if (scope.type === 'task' && scope.id) {
    try {
      const projectCtx = await projectContextService.getProjectContext(scope.projectName)
      if (projectCtx) {
        const task = await hierarchicalTodoService.getTodo(scope.projectName, projectCtx.maverickPath, scope.id)
        if (task) {
          context += `Current Task: ${task.title}\n`
          context += `Task Type: ${task.type}\n`
          context += `Task Status: ${task.status}\n`
          if (task.description) {
            context += `Task Description: ${task.description}\n`
          }
        }
      }
    } catch (error) {
      console.error('Failed to load task context:', error)
    }
  }
  
  return context
}

// Legacy function - keeping for compatibility but now unused
async function buildSystemPrompt(scope: ChatScope, projectContext: any): Promise<string> {
  let systemPrompt = `You are Claude, an AI assistant helping with software development in the Maverick project management system.

IMPORTANT CONTEXT:
- You are working in the context of: ${scope.type} "${scope.title || 'Untitled'}"
- Project: ${scope.projectName}
- Working Directory: ${scope.workingDirectory || projectContext?.workingDirectory || '/tmp/repos/maverick/main'}
`

  if (scope.branchName) {
    systemPrompt += `- Current Branch: ${scope.branchName}\\n`
  }

  if (scope.worktreePath) {
    systemPrompt += `- Worktree Path: ${scope.worktreePath}\\n`
  }

  // Add scope-specific context
  if (scope.type === 'project') {
    systemPrompt += `
You are chatting at the PROJECT level. You can:
- Create new tasks and features
- Analyze the overall project structure
- Suggest architectural improvements
- Help with project planning and roadmaps
- Generate work items from conversations
`
  } else if (scope.type === 'task') {
    systemPrompt += `
You are chatting in the context of a specific TASK. You can:
- Help implement this specific task
- Run commands in the task's worktree/branch
- Create files and make code changes
- Debug issues related to this task
- Update task status and create subtasks
`

    // Load task details if available
    if (scope.id && scope.projectName) {
      try {
        const context = await projectContextService.getProjectContext(scope.projectName)
        if (context) {
          const task = await hierarchicalTodoService.getTodo(scope.projectName, context.maverickPath, scope.id)
          if (task) {
            systemPrompt += `
CURRENT TASK DETAILS:
- Title: ${task.title}
- Type: ${task.type}
- Status: ${task.status}
- Priority: ${task.priority}
- Description: ${task.description || 'No description'}
`
          }
        }
      } catch (error) {
        console.error('Failed to load task context:', error)
      }
    }
  } else if (scope.type === 'feature') {
    systemPrompt += `
You are chatting about a specific FEATURE. You can:
- Break down the feature into tasks
- Plan the implementation approach
- Create technical specifications
- Identify dependencies and risks
`
  }

  systemPrompt += `
CAPABILITIES:
You can suggest and execute actions like:
- Creating new tasks or subtasks
- Running terminal commands
- Creating or modifying files
- Committing changes to git
- Starting work in worktrees

When you want to take action, be specific about what you'd like to do.

CONVERSATION STYLE:
- Be conversational and helpful
- Ask clarifying questions when needed
- Provide practical, actionable advice
- Think step-by-step through problems
- Offer concrete next steps
`

  return systemPrompt
}

async function extractActionsFromResponse(response: string, scope: ChatScope): Promise<any[]> {
  const actions: any[] = []
  
  // Simple pattern matching for now - in production you'd use more sophisticated parsing
  
  // Look for task creation patterns
  if (response.toLowerCase().includes('create') && (response.toLowerCase().includes('task') || response.toLowerCase().includes('todo'))) {
    actions.push({
      id: Date.now().toString(),
      type: 'create_task',
      title: 'Create new task',
      description: 'Create a new task based on the conversation',
      data: {
        scope,
        suggestedContent: response
      }
    })
  }

  // Look for command execution patterns
  const commandPattern = /```(?:bash|shell|cmd)\\n([^`]+)```/g
  let match
  while ((match = commandPattern.exec(response)) !== null) {
    const command = match[1].trim()
    actions.push({
      id: Date.now().toString() + Math.random(),
      type: 'run_command',
      title: `Run: ${command.split('\\n')[0]}`,
      description: `Execute command in ${scope.workingDirectory || 'working directory'}`,
      data: {
        command,
        workingDirectory: scope.workingDirectory,
        scope
      }
    })
  }

  // Look for file creation patterns
  if (response.toLowerCase().includes('create') && response.toLowerCase().includes('file')) {
    actions.push({
      id: Date.now().toString() + Math.random(),
      type: 'create_file',
      title: 'Create file',
      description: 'Create a new file based on the discussion',
      data: {
        scope,
        suggestedContent: response
      }
    })
  }

  return actions
}

async function callClaudeAPI(messages: any[], userId: string): Promise<string> {
  try {
    console.log('🔑 Getting Claude API key for user:', userId)
    
    // Get user's Claude API key
    const apiKey = await claudeService.getApiKey(userId)
    if (!apiKey) {
      return "I need you to connect your Claude API key first. Please go to Settings → Integrations → Claude to set up your API key."
    }

    console.log('📞 Calling Claude API...')
    
    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: messages.filter(m => m.role !== 'system'),
        system: messages.find(m => m.role === 'system')?.content
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API error:', response.status, errorText)
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ Claude API response received')
    
    // Extract the content from Claude's response
    if (data.content && data.content[0] && data.content[0].text) {
      return data.content[0].text
    } else {
      throw new Error('Unexpected response format from Claude API')
    }
    
  } catch (error) {
    console.error('Claude API call failed:', error)
    
    if (error instanceof Error && error.message.includes('Claude API error')) {
      return "I'm having trouble connecting to Claude right now. Please check your API key and try again."
    }
    
    return "I'm having trouble processing that right now. Could you try rephrasing your question?"
  }
}