import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'

interface ChatScope {
  type: 'project' | 'task' | 'feature' | 'epic'
  id?: string
  projectName: string
}

// POST /api/chat/history
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { scope } = await request.json()

    // Generate chat history file path based on scope
    const chatHistoryPath = getChatHistoryPath(scope)
    
    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(chatHistoryPath), { recursive: true })
      
      // Read existing chat history
      const historyData = await fs.readFile(chatHistoryPath, 'utf-8')
      const messages = JSON.parse(historyData)
      
      return NextResponse.json({ messages })
    } catch (error) {
      // If file doesn't exist, return empty history
      if ((error as any).code === 'ENOENT') {
        return NextResponse.json({ messages: [] })
      }
      throw error
    }

  } catch (error) {
    console.error('Error loading chat history:', error)
    return NextResponse.json(
      { error: 'Failed to load chat history' },
      { status: 500 }
    )
  }
}

// PUT /api/chat/history - Save chat history
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { scope, messages } = await request.json()

    // Generate chat history file path based on scope
    const chatHistoryPath = getChatHistoryPath(scope)
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(chatHistoryPath), { recursive: true })
    
    // Save chat history (keep only last 100 messages for performance)
    const limitedMessages = messages.slice(-100)
    await fs.writeFile(chatHistoryPath, JSON.stringify(limitedMessages, null, 2))
    
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error saving chat history:', error)
    return NextResponse.json(
      { error: 'Failed to save chat history' },
      { status: 500 }
    )
  }
}

function getChatHistoryPath(scope: ChatScope): string {
  const baseDir = '/tmp/repos/maverick/main/.maverick/chat-history'
  
  switch (scope.type) {
    case 'project':
      return path.join(baseDir, `project-${scope.projectName}.json`)
    case 'task':
      return path.join(baseDir, `task-${scope.id}.json`)
    case 'feature':
      return path.join(baseDir, `feature-${scope.id}.json`)
    case 'epic':
      return path.join(baseDir, `epic-${scope.id}.json`)
    default:
      return path.join(baseDir, `general-${scope.projectName}.json`)
  }
}