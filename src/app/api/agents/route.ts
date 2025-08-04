import { NextRequest, NextResponse } from 'next/server'
import { agentOrchestrator } from '@/lib/agent-orchestrator'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { requirement, options = {} } = body

    if (!requirement) {
      return NextResponse.json({ error: 'Requirement is required' }, { status: 400 })
    }

    console.log(`🚀 Starting agent for user ${session.user.id}: ${requirement}`)

    // Start the autonomous agent
    const agentSessionId = await agentOrchestrator.startAgent(
      requirement,
      options,
      session.user.id
    )

    return NextResponse.json({
      success: true,
      agentSessionId,
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      // Get all active sessions
      const activeSessions = agentOrchestrator.getActiveSessions()
      
      return NextResponse.json({
        success: true,
        sessions: activeSessions
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

export async function DELETE(request: NextRequest) {
  try {
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