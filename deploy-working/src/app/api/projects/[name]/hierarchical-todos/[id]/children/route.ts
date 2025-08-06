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
    const parentId = resolvedParams.id
    
    // Get project context to find the maverick path
    const context = await projectContextService.getProjectContext(projectName)
    
    // Get child todos
    const children = await hierarchicalTodoService.getChildTodos(
      projectName, 
      context.maverickPath, 
      parentId
    )
    
    return NextResponse.json({ children })
    
  } catch (error) {
    console.error('Error loading child todos:', error)
    return NextResponse.json(
      { error: 'Failed to load children' },
      { status: 500 }
    )
  }
}