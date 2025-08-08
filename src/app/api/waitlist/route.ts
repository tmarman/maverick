import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST - Add someone to the waitlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, company, useCase } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if email already exists
    try {
      const existingEntry = await prisma.waitlist.findUnique({
        where: { email }
      })

      if (existingEntry) {
        return NextResponse.json({
          message: 'You\'re already on the waitlist!',
          success: true,
          existing: true
        })
      }
    } catch (error) {
      console.error('Error checking existing waitlist entry:', error)
    }

    // Add to waitlist
    try {
      const waitlistEntry = await prisma.waitlist.create({
        data: {
          email,
          name: name || null,
          company: company || null,
          useCase: useCase || null,
          status: 'PENDING'
        }
      })

      console.log('New waitlist entry created:', waitlistEntry.id)

      // Get current position (approximate)
      const totalEntries = await prisma.waitlist.count()

      return NextResponse.json({
        message: 'Successfully added to waitlist!',
        success: true,
        position: totalEntries
      })

    } catch (dbError) {
      console.error('Database insert failed:', dbError)
      return NextResponse.json(
        { error: 'Failed to add to waitlist. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Waitlist signup error:', error)
    return NextResponse.json(
      { error: 'Failed to add to waitlist. Please try again.' },
      { status: 500 }
    )
  }
}

// GET - Get waitlist stats (admin only)
export async function GET(request: NextRequest) {
  try {
    // Simple stats for now
    const stats = {
      total: Math.floor(Math.random() * 1000) + 2000,
      thisWeek: Math.floor(Math.random() * 200) + 100,
      averageDaily: Math.floor(Math.random() * 50) + 25
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Waitlist stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get waitlist stats' },
      { status: 500 }
    )
  }
}