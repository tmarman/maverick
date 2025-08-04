import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hierarchicalTodoService } from '@/lib/hierarchical-todos'
import { projectContextService } from '@/lib/project-context-service'

// PUT /api/projects/[name]/work-items/[workItemId]/reorder
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string; workItemId: string }> }
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
    const { name: projectName, workItemId: taskId } = resolvedParams
    
    // Get project context
    const context = await projectContextService.getProjectContext(projectName)
    if (!context) {
      return NextResponse.json(
        { error: 'Project not found or not initialized' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { orderIndex } = body
    
    if (typeof orderIndex !== 'number') {
      return NextResponse.json(
        { error: 'orderIndex must be a number' },
        { status: 400 }
      )
    }

    // Update the task order
    const updatedTask = await hierarchicalTodoService.updateTodo(
      context.maverickPath,
      taskId,
      { orderIndex }
    )
    
    if (!updatedTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      task: updatedTask
    })

  } catch (error) {
    console.error('Error reordering task:', error)
    return NextResponse.json(
      { error: 'Failed to reorder task', details: error.message },
      { status: 500 }
    )
  }
}