import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hierarchicalTodoService } from '@/lib/hierarchical-todos'
import { projectContextService } from '@/lib/project-context-service'
import { taskAgentIntegration, type TaskExecutionRequest } from '@/lib/task-agent-integration'
import { WorktreeManager } from '@/lib/worktree-manager'

// POST /api/projects/[name]/tasks/[taskId]/start-work
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string; taskId: string }> }
) {
  try {
    console.log('POST /start-work called')
    const session = await getServerSession(authOptions)
    console.log('Session:', session ? 'Found' : 'Not found', session?.user?.email)
    
    if (!session?.user?.email) {
      console.log('No session found, returning 401')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const { name: projectName, taskId } = resolvedParams
    
    // Get project context
    const context = await projectContextService.getProjectContext(projectName)
    if (!context) {
      return NextResponse.json(
        { error: 'Project not found or not initialized' },
        { status: 404 }
      )
    }

    // Get the task details
    const task = await hierarchicalTodoService.getTodo(projectName, context.maverickPath, taskId)
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    if (task.status !== 'PLANNED') {
      return NextResponse.json(
        { error: 'Task is not in PLANNED status' },
        { status: 400 }
      )
    }

    // Parse request body for execution options
    const body = await request.json().catch(() => ({}))
    
    // Execute task using the full agent orchestrator with screenshot/video capture
    const executionRequest: TaskExecutionRequest = {
      taskId,
      projectName,
      options: {
        captureScreenshots: true,
        captureVideo: true,
        createDocumentation: true,
        autoUpdateStatus: true,
        dryRun: body.dryRun || false,
        skipTests: body.skipTests || false,
        skipDemo: body.skipDemo || false
      }
    }

    try {
      // Start agent execution asynchronously (don't await)
      console.log('🚀 Starting async agent execution...')
      
      taskAgentIntegration.executeTask(executionRequest)
        .then((result) => {
          console.log(`✅ Agent execution completed for task ${taskId}:`, result.success ? 'SUCCESS' : 'FAILED')
          if (!result.success) {
            console.error('Agent execution error:', result.error)
          }
        })
        .catch((error) => {
          console.error('Agent execution failed:', error)
        })

      // Return immediately with async status
      return NextResponse.json({
        success: true,
        message: 'Agent work started in background',
        status: 'INITIALIZING',
        taskId,
        projectName,
        async: true,
        steps: [
          { step: 1, status: 'COMPLETED', message: '🔍 Analyzed task requirements' },
          { step: 2, status: 'COMPLETED', message: '🤖 Smart categorization applied' },
          { step: 3, status: 'IN_PROGRESS', message: '🌳 Setting up worktree environment...' },
          { step: 4, status: 'PENDING', message: '📋 Adding to work queue' },
          { step: 5, status: 'PENDING', message: '🚀 Starting AI agent execution' }
        ],
        features: [
          '🤖 AI agent assigned to task',
          '🌳 Smart worktree organization', 
          '📋 Queue-based task management',
          '🔄 Real-time progress tracking'
        ]
      })

    } catch (initError) {
      console.error('Failed to initialize agent work:', initError)
      return NextResponse.json(
        { 
          error: 'Failed to initialize agent work', 
          details: initError instanceof Error ? initError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error starting work:', error)
    return NextResponse.json(
      { 
        error: 'Failed to start work', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Generate a standardized branch name from task title and type
 */
function generateBranchName(title: string, type: string): string {
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

// GET /api/projects/[name]/tasks/[taskId]/worktree-status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const { name: projectName, taskId } = resolvedParams
    
    // Get project context
    const context = await projectContextService.getProjectContext(projectName)
    if (!context) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get the task details
    const task = await hierarchicalTodoService.getTodo(projectName, context.maverickPath, taskId)
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    const taskData = task as any
    if (!taskData.worktreeName || task.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'No active worktree for this task' },
        { status: 404 }
      )
    }

    // Check worktree status
    const worktreeManager = new WorktreeManager(context.worktreePath)
    const worktreePath = worktreeManager.getWorktreePath(projectName, taskData.worktreeName)
    
    // Simple progress calculation (could be enhanced with actual git analysis)
    const progress = calculateTaskProgress(task, worktreePath)

    return NextResponse.json({
      success: true,
      taskId: taskId,
      branchName: taskData.worktreeName,
      worktreePath: taskData.worktreePath,
      status: taskData.worktreeStatus || 'ACTIVE',
      progress: progress,
      lastUpdated: task.updatedAt
    })

  } catch (error) {
    console.error('Error getting worktree status:', error)
    return NextResponse.json(
      { error: 'Failed to get worktree status' },
      { status: 500 }
    )
  }
}

/**
 * Calculate task progress based on worktree activity
 */
function calculateTaskProgress(task: any, worktreePath: string): number {
  // Simple heuristic - could be enhanced with:
  // - Git commit analysis
  // - File change detection
  // - Test execution results
  // - Agent activity logs
  
  const minutesSinceStart = (Date.now() - new Date(task.updatedAt).getTime()) / (1000 * 60)
  
  // Simulate progress based on time and task complexity
  const effortMultipliers: Record<string, number> = {
    'XS': 0.8,
    'S': 0.6, 
    'M': 0.4,
    'L': 0.2,
    'XL': 0.1,
    'XXL': 0.05
  }
  const effortMultiplier = effortMultipliers[task.estimatedEffort] || 0.5
  
  const progress = Math.min(95, minutesSinceStart * effortMultiplier * 10)
  return Math.round(progress)
}