import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hierarchicalTodoService } from '@/lib/hierarchical-todos'
import { projectContextService } from '@/lib/project-context-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string; id: string }> }
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
    const projectName = resolvedParams.name.toLowerCase()
    const todoId = resolvedParams.id
    
    // Get project context to find the maverick path
    const context = await projectContextService.getProjectContext(projectName)
    
    // Get single todo
    const todo = await hierarchicalTodoService.getTodo(
      projectName, 
      context.maverickPath, 
      todoId
    )
    
    if (!todo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ todo })
    
  } catch (error) {
    console.error('Error loading hierarchical todo:', error)
    return NextResponse.json(
      { error: 'Failed to load todo' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string; id: string }> }
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
    const projectName = resolvedParams.name.toLowerCase()
    const todoId = resolvedParams.id
    const body = await request.json()
    
    // Get project context to find the maverick path
    const context = await projectContextService.getProjectContext(projectName)
    
    // Update todo
    const updatedTodo = await hierarchicalTodoService.updateTodo(
      context.maverickPath,
      todoId,
      body.updates
    )
    
    if (!updatedTodo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ todo: updatedTodo })
    
  } catch (error) {
    console.error('Error updating hierarchical todo:', error)
    return NextResponse.json(
      { error: 'Failed to update todo' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string; id: string }> }
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
    const projectName = resolvedParams.name.toLowerCase()
    const todoId = resolvedParams.id
    
    // Get project context to find the maverick path
    const context = await projectContextService.getProjectContext(projectName)
    
    // Delete todo
    const success = await hierarchicalTodoService.deleteTodo(
      projectName,
      context.maverickPath,
      todoId,
      true // deleteChildren
    )
    
    if (!success) {
      return NextResponse.json(
        { error: 'Todo not found or failed to delete' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error deleting hierarchical todo:', error)
    return NextResponse.json(
      { error: 'Failed to delete todo' },
      { status: 500 }
    )
  }
}