import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/database-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const db = getDatabase()
    const businesses = await db.getUserBusinesses(session.user.id)
    
    return NextResponse.json(businesses)
  } catch (error) {
    console.error('Error fetching businesses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const db = getDatabase()
    const data = await request.json()
    
    const business = await db.createBusiness(session.user.id, {
      name: data.name,
      description: data.description,
      industry: data.industry,
      organizationType: data.organizationType,
      location: data.location,
      legalStructure: data.legalStructure,
      state: data.state,
      squareServices: data.squareServices || [],
      appType: data.appType,
      appFeatures: data.appFeatures || []
    })
    
    return NextResponse.json(business, { status: 201 })
  } catch (error) {
    console.error('Error creating business:', error)
    return NextResponse.json(
      { error: 'Failed to create business' },
      { status: 500 }
    )
  }
}