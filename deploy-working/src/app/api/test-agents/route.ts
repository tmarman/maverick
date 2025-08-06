import { NextRequest, NextResponse } from 'next/server'
import { agentOrchestrator } from '@/lib/agent-orchestrator'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing agent system...')
    
    const body = await request.json()
    const { requirement, options = {} } = body

    if (!requirement) {
      return NextResponse.json({ error: 'Requirement is required' }, { status: 400 })
    }

    console.log(`🚀 Starting test agent for: ${requirement}`)

    // Start the autonomous agent with test user
    const agentSessionId = await agentOrchestrator.startAgent(
      `[test] ${requirement}`,
      {
        ...options,
        projectName: 'test',
        projectPath: process.cwd()
      },
      'test-user'
    )

    return NextResponse.json({
      success: true,
      agentSessionId,
      message: 'Test agent started successfully'
    })

  } catch (error: any) {
    console.error('Test agent start error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to start test agent' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
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
      const allSessions = agentOrchestrator.getActiveSessions()
      
      return NextResponse.json({
        success: true,
        sessions: allSessions
      })
    }

  } catch (error: any) {
    console.error('Test agent status error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get agent status' },
      { status: 500 }
    )
  }
}