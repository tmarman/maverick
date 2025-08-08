import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

// In a real implementation, you'd store this in a database
// For now, we'll use a simple in-memory store per session
const userPreferences = new Map<string, any>()

// GET - Get user preferences
export async function GET() {
  try {
    const session = await getServerSession()
    const userId = session?.user?.email || 'anonymous'
    
    const preferences = userPreferences.get(userId) || {
      activeProvider: 'claude-cli-default',
      activeModel: 'claude-3-5-sonnet-20240620',
      chatMode: 'cli', // 'cli' or 'api'
      theme: 'light',
      notifications: true
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Failed to get user preferences:', error)
    return NextResponse.json({ error: 'Failed to load preferences' }, { status: 500 })
  }
}

// PATCH - Update user preferences
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    const userId = session?.user?.email || 'anonymous'
    
    const body = await request.json()
    const currentPreferences = userPreferences.get(userId) || {}
    
    // Merge the updates with existing preferences
    const updatedPreferences = {
      ...currentPreferences,
      ...body,
      updatedAt: new Date().toISOString()
    }
    
    userPreferences.set(userId, updatedPreferences)
    
    console.log(`💾 Updated preferences for ${userId}:`, updatedPreferences)
    
    return NextResponse.json({ 
      success: true,
      preferences: updatedPreferences 
    })
  } catch (error) {
    console.error('Failed to update user preferences:', error)
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
  }
}