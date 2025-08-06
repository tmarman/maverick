import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    // TODO: Replace with actual database/file system query
    // Load agents from .maverick/agents/ directory or database
    console.log('Loading agents for project:', projectName)

    // For now, return empty array since we're starting fresh
    // In a real implementation, this would:
    // 1. Check .maverick/agents/ directory in the project
    // 2. Or query database for configured agents
    // 3. Return agent configurations with their status
    
    return NextResponse.json({
      success: true,
      agents: [] // Start with no agents - they'll be added via POST
    })

  } catch (error) {
    console.error('Error loading agents:', error)
    return NextResponse.json(
      { error: 'Failed to load agents' },
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
    const { agentType, name, specialization } = await request.json()

    if (!agentType || !name || !specialization) {
      return NextResponse.json(
        { error: 'Agent type, name, and specialization are required' },
        { status: 400 }
      )
    }

    // TODO: Replace with actual database operations
    // 1. Check if user is admin of this project
    // 2. Create agent record in database
    // 3. Initialize agent with project context
    
    console.log('Add agent request:', {
      project: projectName,
      addedBy: session.user.email,
      agentType,
      name,
      specialization
    })

    // Mock successful response
    return NextResponse.json({
      success: true,
      message: 'Agent added successfully',
      agent: {
        id: `agent-${Date.now()}`,
        name,
        type: 'agent',
        agentType,
        specialization,
        status: 'idle',
        addedBy: session.user.email,
        addedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error adding agent:', error)
    return NextResponse.json(
      { error: 'Failed to add agent' },
      { status: 500 }
    )
  }
}