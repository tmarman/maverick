import { NextRequest, NextResponse } from 'next/server'
import { hierarchicalTodoService } from '@/lib/hierarchical-todos'
import { projectContextService } from '@/lib/project-context-service'

// GET /api/projects/[name]/tasks/[taskId]/status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string; taskId: string }> }
) {
  try {
    const { name: projectName, taskId } = await params

    // Get project context
    const context = await projectContextService.getProjectContext(projectName)
    if (!context) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get task details
    const task = await hierarchicalTodoService.getTodo(projectName, context.maverickPath, taskId)
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check worktree status if task has one
    let worktreeInfo = null
    if (task.worktreeName && task.worktreePath) {
      try {
        const { WorktreeQueueService } = await import('@/lib/worktree-queue-service')
        const queueService = WorktreeQueueService.getInstance()
        
        const queue = await queueService.loadQueue(projectName, task.worktreeName)
        const queueStats = await queueService.getQueueStats(projectName, task.worktreeName)
        
        const taskInQueue = queue.tasks.find(t => t.taskId === taskId)
        
        worktreeInfo = {
          name: task.worktreeName,
          path: task.worktreePath,
          status: task.worktreeStatus,
          queueStats,
          taskStatus: taskInQueue?.status || 'NOT_IN_QUEUE',
          queuePosition: queue.tasks.findIndex(t => t.taskId === taskId) + 1
        }
      } catch (error) {
        console.warn('Failed to get worktree info:', error)
      }
    }

    // Determine overall progress status
    let progressStatus = 'PENDING'
    let progressMessage = 'Task is pending'
    
    if (task.status === 'IN_PROGRESS') {
      if (task.worktreeStatus === 'ACTIVE') {
        progressStatus = 'WORKING'
        progressMessage = `Working in ${task.worktreeName} worktree`
      } else {
        progressStatus = 'STARTING'
        progressMessage = 'Setting up work environment...'
      }
    } else if (task.status === 'DONE') {
      progressStatus = 'COMPLETED'
      progressMessage = 'Task completed successfully'
    } else if (task.status === 'PLANNED') {
      progressStatus = 'PLANNED'
      progressMessage = 'Task is planned and ready to start'
    }

    return NextResponse.json({
      taskId,
      projectName,
      task: {
        title: task.title,
        status: task.status,
        priority: task.priority,
        type: task.type,
        updatedAt: task.updatedAt
      },
      progress: {
        status: progressStatus,
        message: progressMessage
      },
      worktree: worktreeInfo,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error getting task status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get task status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}