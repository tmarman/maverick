import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hierarchicalTodoService } from '@/lib/hierarchical-todos'
import { projectContextService } from '@/lib/project-context-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
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
    
    // Get project context to find the maverick path
    const context = await projectContextService.getProjectContext(projectName)
    
    // Load all hierarchical todos
    const todos = await hierarchicalTodoService.getAllTodosWithHierarchy(
      projectName, 
      context.maverickPath
    )
    
    return NextResponse.json({ todos })
    
  } catch (error) {
    console.error('Error loading hierarchical todos:', error)
    return NextResponse.json(
      { error: 'Failed to load todos' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
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
    const body = await request.json()
    
    // Get project context to find the maverick path
    const context = await projectContextService.getProjectContext(projectName)
    
    // Create new todo
    const todo = await hierarchicalTodoService.createTodo(
      projectName,
      context.maverickPath,
      body.todo,
      body.parentId
    )
    
    return NextResponse.json({ todo })
    
  } catch (error) {
    console.error('Error creating hierarchical todo:', error)
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    )
  }
}