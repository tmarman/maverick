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

    // TODO: Replace with actual database query
    // Load team members and invitations from database
    console.log('Loading team members for project:', projectName)

    // For now, return empty array since we're starting fresh
    // In a real implementation, this would:
    // 1. Query database for project team members
    // 2. Include invited users with status
    // 3. Return member details and permissions
    
    return NextResponse.json({
      success: true,
      members: [] // Start with no members - they'll be added via invites
    })

  } catch (error) {
    console.error('Error loading team members:', error)
    return NextResponse.json(
      { error: 'Failed to load team members' },
      { status: 500 }
    )
  }
}