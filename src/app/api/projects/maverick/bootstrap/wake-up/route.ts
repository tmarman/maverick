import { NextRequest, NextResponse } from 'next/server'
import { claudeTerminalManager } from '@/lib/claude-terminal-manager'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, message } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }
    
    console.log('⏰ Waking up Claude session:', sessionId)
    
    // Send wake-up message to Claude
    const wakeUpMessage = message || "Hello! Bootstrap interface connecting. Ready to help build Maverick!"
    const sent = await claudeTerminalManager.sendInput(sessionId, wakeUpMessage)
    
    if (sent) {
      console.log('✅ Wake-up message sent to Claude session')
      
      // Wait a moment for Claude to process
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return NextResponse.json({
        success: true,
        message: 'Wake-up message sent successfully',
        sessionId
      })
    } else {
      throw new Error('Failed to send wake-up message')
    }
    
  } catch (error) {
    console.error('❌ Error waking up session:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to wake up session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}