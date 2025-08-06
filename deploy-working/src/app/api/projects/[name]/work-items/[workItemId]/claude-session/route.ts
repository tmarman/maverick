import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ClaudeSessionManager } from '@/lib/claude-session-manager'
import { generateAIResponse } from '@/lib/ai-provider'
import * as fs from 'fs/promises'
import * as path from 'path'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string; workItemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const projectName = resolvedParams.name.toLowerCase()
    const workItemId = resolvedParams.workItemId
    const body = await request.json()

    if (!body.message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Load work item and project context
    const [workItem, project] = await Promise.all([
      loadWorkItemFromMarkdown(projectName, workItemId),
      loadProjectContext(projectName)
    ])

    if (!workItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
    }

    // Initialize session manager for this project
    const sessionManager = new ClaudeSessionManager(projectName)
    
    // Get or create a session for this worktree/work item
    const claudeSession = await sessionManager.getOrCreateSession(
      workItemId,
      workItem,
      project,
      body.sessionType || 'development'
    )

    // Add user message to session
    await sessionManager.addMessage(claudeSession.id, 'user', body.message)

    // Prepare context for Claude including full session history
    const sessionHistory = await sessionManager.getSessionHistory(claudeSession.id)
    const contextualPrompt = buildContextualPrompt(body.message, claudeSession, workItem, project, sessionHistory)

    // Generate response using Claude with full context
    const response = await generateAIResponse(
      contextualPrompt,
      `Development session for ${workItem.title}`,
      'auto'
    )

    if (!response) {
      throw new Error('Failed to generate Claude response')
    }

    // Add assistant response to session
    await sessionManager.addMessage(claudeSession.id, 'assistant', response, {
      codeGenerated: response.includes('```') || response.includes('file:'),
      filesModified: extractFilesFromResponse(response)
    })

    // If this is a development session and involves code, potentially execute Claude Code
    let codeExecuted = false
    let filesModified: string[] = []
    
    if (body.sessionType === 'development' && shouldExecuteCode(response)) {
      try {
        const codeResult = await executeClaudeCodeSession(workItem, project, response)
        codeExecuted = codeResult.success
        filesModified = codeResult.filesModified || []
      } catch (error) {
        console.error('Claude Code execution failed:', error)
      }
    }

    return NextResponse.json({
      response,
      sessionId: claudeSession.id,
      codeExecuted,
      filesModified,
      sessionType: claudeSession.sessionType,
      worktreeName: workItem.worktreeName,
      conversationLength: sessionHistory.length
    })

  } catch (error) {
    console.error('Error in Claude session:', error)
    return NextResponse.json(
      { error: 'Failed to process Claude session' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string; workItemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const projectName = resolvedParams.name.toLowerCase()
    const workItemId = resolvedParams.workItemId

    const sessionManager = new ClaudeSessionManager(projectName)
    const sessions = await sessionManager.getWorkItemSessions(workItemId)

    return NextResponse.json({ sessions })

  } catch (error) {
    console.error('Error getting Claude sessions:', error)
    return NextResponse.json(
      { error: 'Failed to get sessions' },
      { status: 500 }
    )
  }
}

async function loadWorkItemFromMarkdown(projectName: string, workItemId: string) {
  try {
    const filePath = path.join(process.cwd(), 'projects', projectName, 'work-items', `${workItemId}.md`)
    const content = await fs.readFile(filePath, 'utf-8')
    
    const lines = content.split('\n')
    const workItem: any = { 
      id: workItemId, 
      markdownContent: content,
      projectName 
    }
    
    let inFrontmatter = false
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed === '---') {
        if (!inFrontmatter) {
          inFrontmatter = true
          continue
        } else {
          break
        }
      }
      
      if (inFrontmatter) {
        if (trimmed.startsWith('title:')) {
          workItem.title = trimmed.substring(6).trim().replace(/^"(.*)"$/, '$1')
        } else if (trimmed.startsWith('type:')) {
          workItem.type = trimmed.substring(5).trim()
        } else if (trimmed.startsWith('description:')) {
          workItem.description = trimmed.substring(12).trim()
        } else if (trimmed.startsWith('priority:')) {
          workItem.priority = trimmed.substring(9).trim()
        } else if (trimmed.startsWith('worktreeName:')) {
          const value = trimmed.substring(13).trim()
          workItem.worktreeName = value === 'null' ? null : value
        } else if (trimmed.startsWith('githubBranch:')) {
          const value = trimmed.substring(13).trim()
          workItem.githubBranch = value === 'null' ? null : value
        }
      }
    }
    
    return workItem
  } catch (error) {
    console.error('Error loading work item:', error)
    return null
  }
}

async function loadProjectContext(projectName: string) {
  // Load project information - for now return basic context
  return {
    name: projectName,
    type: 'AI Platform',
    description: 'Maverick AI-native business formation platform',
    repositoryUrl: 'https://github.com/user/maverick',
    defaultBranch: 'main'
  }
}

function buildContextualPrompt(
  userMessage: string,
  claudeSession: any,
  workItem: any,
  project: any,
  sessionHistory: any[]
) {
  // Extract recent conversation (last 10 messages, excluding system)
  const recentMessages = sessionHistory
    .filter(msg => msg.role !== 'system')
    .slice(-10)
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n\n')

  return `You are continuing a development session for a specific work item. Here's the full context:

**WORK ITEM CONTEXT:**
- Title: ${workItem.title}
- Type: ${workItem.type}
- Priority: ${workItem.priority}
- Worktree: ${workItem.worktreeName || 'None'}
- Branch: ${workItem.githubBranch || 'None'}

**PROJECT CONTEXT:**
- Project: ${project.name}
- Repository: ${project.repositoryUrl}

**SESSION CONTEXT:**
- Session Type: ${claudeSession.sessionType}
- Messages in this session: ${sessionHistory.length}
- Working Directory: ${workItem.worktreeName ? `/repos/${project.name}/${workItem.worktreeName}` : `/repos/${project.name}`}

**RECENT CONVERSATION:**
${recentMessages || 'This is the start of the conversation.'}

**CURRENT USER MESSAGE:**
${userMessage}

**INSTRUCTIONS:**
- Maintain continuity with the previous conversation
- Reference earlier decisions and context when relevant
- If discussing code, be specific about file paths and implementation
- If this is a development session, you can suggest specific terminal commands or code changes
- Keep the business context of the work item in mind
- Be practical and actionable in your responses

Respond as Claude, maintaining the context of this ongoing development session.`
}

function shouldExecuteCode(response: string): boolean {
  // Determine if the response suggests code execution
  const codeIndicators = [
    'run the following',
    'execute this command',
    'create this file',
    'modify the file',
    'git commit',
    'npm install',
    'npm run'
  ]
  
  const lowerResponse = response.toLowerCase()
  return codeIndicators.some(indicator => lowerResponse.includes(indicator)) ||
         response.includes('```bash') ||
         response.includes('```sh') ||
         response.includes('```')
}

async function executeClaudeCodeSession(workItem: any, project: any, response: string) {
  // This would integrate with Claude Code CLI for actual code execution
  // For now, return a mock response
  return {
    success: false,
    filesModified: [],
    output: 'Claude Code execution not yet implemented'
  }
}

function extractFilesFromResponse(response: string): string[] {
  // Extract file paths mentioned in the response
  const filePatterns = [
    /(?:file:|path:|create |modify )([\w\/\.-]+\.\w+)/gi,
    /`([^`]+\.\w+)`/gi
  ]
  
  const files: string[] = []
  
  filePatterns.forEach(pattern => {
    const matches = response.match(pattern)
    if (matches) {
      matches.forEach(match => {
        const file = match.replace(/^(file:|path:|create |modify |`)/, '').replace(/`$/, '')
        if (file.includes('.')) {
          files.push(file)
        }
      })
    }
  })
  
  return Array.from(new Set(files)) // Remove duplicates
}