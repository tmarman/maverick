import { NextRequest, NextResponse } from 'next/server'
import { claudeTerminalManager } from '@/lib/claude-terminal-manager'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, includeHistory } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }
    
    console.log('🔍 Checking bootstrap session status:', sessionId)
    
    // Check if session exists and is active
    const session = claudeTerminalManager.getSession(sessionId)
    
    const exists = !!session
    const active = session ? session.isActive : false
    
    console.log('📊 Session status:', { sessionId, exists, active })
    
    const response = {
      sessionId,
      exists,
      active,
      workingDirectory: session?.workingDirectory,
      lastActivity: session?.lastActivity
    } as any
    
    // Include history if requested
    if (includeHistory && exists) {
      const history = claudeTerminalManager.getSessionHistory(sessionId)
      response.history = history
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('❌ Error checking session status:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to check session status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}