import { NextRequest, NextResponse } from 'next/server'
import { claudeTerminalManager } from '@/lib/claude-terminal-manager'

export async function POST(request: NextRequest) {
  try {
    const { user, project } = await request.json()
    
    console.log('🚀 Creating dedicated bootstrap session for user:', user)
    
    // Create a dedicated bootstrap session
    const sessionId = await claudeTerminalManager.createSession(user, project)
    
    console.log('✅ Bootstrap session created:', sessionId)
    
    // Verify session was created and exists
    const session = claudeTerminalManager.getSession(sessionId)
    console.log('🔍 Session verification:', {
      sessionId,
      exists: !!session,
      isActive: session?.isActive,
      hasProcess: !!session?.process,
      workingDirectory: session?.workingDirectory
    })
    
    return NextResponse.json({
      sessionId,
      message: 'Bootstrap session created successfully'
    })
    
  } catch (error) {
    console.error('❌ Error creating bootstrap session:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create bootstrap session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}