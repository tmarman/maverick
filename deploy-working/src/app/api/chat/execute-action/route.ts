import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hierarchicalTodoService } from '@/lib/hierarchical-todos'
import { projectContextService } from '@/lib/project-context-service'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

interface ChatAction {
  id: string
  type: 'create_task' | 'update_task' | 'run_command' | 'create_file' | 'commit_changes'
  title: string
  description?: string
  status: 'pending' | 'completed' | 'failed'
  data?: Record<string, any>
}

interface ChatScope {
  type: 'project' | 'task' | 'feature' | 'epic'
  id?: string
  projectName: string
  workingDirectory?: string
  branchName?: string
  worktreePath?: string
}

// POST /api/chat/execute-action
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { action, scope } = await request.json()

    let result: any = {}

    switch (action.type) {
      case 'create_task':
        result = await executeCreateTask(action, scope)
        break
      
      case 'run_command':
        result = await executeRunCommand(action, scope)
        break
      
      case 'create_file':
        result = await executeCreateFile(action, scope)
        break
      
      case 'update_task':
        result = await executeUpdateTask(action, scope)
        break
      
      case 'commit_changes':
        result = await executeCommitChanges(action, scope)
        break
      
      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }

    return NextResponse.json({
      success: true,
      result
    })

  } catch (error) {
    console.error('Error executing action:', error)
    return NextResponse.json(
      { error: 'Failed to execute action', details: (error as Error).message },
      { status: 500 }
    )
  }
}

async function executeCreateTask(action: ChatAction, scope: ChatScope): Promise<any> {
  const context = await projectContextService.getProjectContext(scope.projectName)
  if (!context) {
    throw new Error('Project context not found')
  }

  // Extract task details from action data
  const taskData = action.data?.suggestedContent || action.title
  
  // Create a new hierarchical todo
  const newTask = await hierarchicalTodoService.createTodo(
    scope.projectName,
    context.maverickPath,
    {
      title: action.title,
      description: `Created from chat conversation.\n\n${taskData}`,
      type: 'TASK',
      status: 'PLANNED',
      priority: 'MEDIUM',
      functionalArea: 'SOFTWARE'
    },
    scope.type === 'task' ? scope.id : undefined // Parent ID if creating subtask
  )

  return { taskId: newTask.id, title: newTask.title }
}

async function executeRunCommand(action: ChatAction, scope: ChatScope): Promise<any> {
  const workingDirectory = scope.workingDirectory || '/tmp/repos/maverick/main'
  const command = action.data?.command

  if (!command) {
    throw new Error('No command specified')
  }

  // Security check - only allow safe commands
  const allowedCommands = [
    'ls', 'pwd', 'cat', 'head', 'tail', 'grep', 'find', 'tree',
    'git status', 'git log', 'git diff', 'git add', 'git commit',
    'npm', 'yarn', 'node', 'python', 'python3',
    'mkdir', 'touch', 'cp', 'mv', 'echo'
  ]

  const commandStart = command.split(' ')[0]
  const isAllowed = allowedCommands.some(allowed => 
    command.startsWith(allowed) || commandStart === allowed
  )

  if (!isAllowed) {
    throw new Error(`Command not allowed: ${commandStart}`)
  }

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: workingDirectory,
      timeout: 30000 // 30 second timeout
    })

    return {
      command,
      stdout,
      stderr,
      workingDirectory
    }
  } catch (error: any) {
    throw new Error(`Command failed: ${error.message}`)
  }
}

async function executeCreateFile(action: ChatAction, scope: ChatScope): Promise<any> {
  const workingDirectory = scope.workingDirectory || '/tmp/repos/maverick/main'
  const fileName = action.data?.fileName || 'new-file.txt'
  const content = action.data?.content || '// Created by Claude\\n\\n'

  const filePath = path.join(workingDirectory, fileName)
  
  // Security check - ensure file is within working directory
  const resolvedPath = path.resolve(filePath)
  const resolvedWorkingDir = path.resolve(workingDirectory)
  
  if (!resolvedPath.startsWith(resolvedWorkingDir)) {
    throw new Error('File path not allowed - must be within working directory')
  }

  // Ensure directory exists
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  
  // Create the file
  await fs.writeFile(filePath, content, 'utf-8')

  return {
    fileName,
    filePath,
    size: content.length
  }
}

async function executeUpdateTask(action: ChatAction, scope: ChatScope): Promise<any> {
  if (!scope.id) {
    throw new Error('No task ID provided')
  }

  const context = await projectContextService.getProjectContext(scope.projectName)
  if (!context) {
    throw new Error('Project context not found')
  }

  const updates = action.data?.updates || {}
  
  const updatedTask = await hierarchicalTodoService.updateTodo(
    context.maverickPath,
    scope.id,
    updates
  )

  return { taskId: updatedTask?.id, updates }
}

async function executeCommitChanges(action: ChatAction, scope: ChatScope): Promise<any> {
  const workingDirectory = scope.workingDirectory || '/tmp/repos/maverick/main'
  const message = action.data?.message || 'Changes made via Claude chat'

  try {
    // Add all changes
    await execAsync('git add .', { cwd: workingDirectory })
    
    // Commit changes
    const { stdout, stderr } = await execAsync(`git commit -m "${message}"`, {
      cwd: workingDirectory
    })

    return {
      message,
      stdout,
      stderr,
      workingDirectory
    }
  } catch (error: any) {
    // If no changes to commit, that's okay
    if (error.message.includes('nothing to commit')) {
      return {
        message: 'No changes to commit',
        workingDirectory
      }
    }
    throw error
  }
}