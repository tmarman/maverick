import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        timezone: true,
        preferences: true,
        onboardingCompleted: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse preferences JSON
    const preferences = user.preferences ? JSON.parse(user.preferences) : {}

    return NextResponse.json({
      ...user,
      preferences
    })

  } catch (error) {
    console.error('GET /api/user/profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, 
      phone, 
      timezone, 
      onboardingCompleted,
      businessGoal,
      experience,
      interests,
      ...otherPreferences 
    } = body

    // Prepare preferences object
    const preferences = {
      businessGoal,
      experience,
      interests,
      ...otherPreferences
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(timezone && { timezone }),
        ...(onboardingCompleted !== undefined && { onboardingCompleted }),
        preferences: JSON.stringify(preferences),
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        timezone: true,
        preferences: true,
        onboardingCompleted: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      ...updatedUser,
      preferences: JSON.parse(updatedUser.preferences || '{}')
    })

  } catch (error) {
    console.error('PUT /api/user/profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
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

    // For safety, we'll mark the user as inactive rather than actually deleting
    // You can implement hard deletion if needed
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        email: `deleted_${Date.now()}_${session.user.email}`,
        name: null,
        phone: null,
        preferences: JSON.stringify({ deleted: true, deletedAt: new Date() }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ message: 'Account deleted successfully' })

  } catch (error) {
    console.error('DELETE /api/user/profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}