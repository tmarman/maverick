import { NextRequest, NextResponse } from 'next/server'
import { agentOrchestrator } from '@/lib/agent-orchestrator'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectName = resolvedParams.name
    const body = await request.json()
    const { requirement, options = {} } = body

    if (!requirement) {
      return NextResponse.json({ error: 'Requirement is required' }, { status: 400 })
    }

    console.log(`🚀 Starting agent for project ${projectName}: ${requirement}`)

    // Start the autonomous agent with project context
    const agentSessionId = await agentOrchestrator.startAgent(
      `[${projectName}] ${requirement}`, // Add project context to requirement
      {
        ...options,
        projectName, // Pass project context
        projectPath: process.cwd() // For now, use current directory
      },
      session.user.id
    )

    return NextResponse.json({
      success: true,
      agentSessionId,
      projectName,
      message: 'Agent started successfully'
    })

  } catch (error: any) {
    console.error('Agent start error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to start agent' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const resolvedParams = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectName = resolvedParams.name
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (sessionId) {
      // Get specific agent session
      const agentSession = agentOrchestrator.getAgentStatus(sessionId)
      
      if (!agentSession) {
        return NextResponse.json({ error: 'Agent session not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        session: agentSession
      })
    } else {
      // Get all active sessions for this project
      const allSessions = agentOrchestrator.getActiveSessions()
      
      // Filter sessions by project name (based on task title containing project name)
      const projectSessions = allSessions.filter(session => 
        session.taskPlan.title.includes(`[${projectName}]`) ||
        session.taskPlan.description.includes(projectName)
      )
      
      return NextResponse.json({
        success: true,
        sessions: projectSessions,
        projectName
      })
    }

  } catch (error: any) {
    console.error('Agent status error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get agent status' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    await agentOrchestrator.stopAgent(sessionId)

    return NextResponse.json({
      success: true,
      message: 'Agent stopped successfully'
    })

  } catch (error: any) {
    console.error('Agent stop error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to stop agent' },
      { status: 500 }
    )
  }
}