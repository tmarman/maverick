import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/database-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, type, businessId } = await request.json()

    if (!name || !type || !businessId) {
      return NextResponse.json(
        { error: 'Name, type, and business ID are required' },
        { status: 400 }
      )
    }

    // Validate that user has access to this business
    const user = await db.getUserCompanies(session.user.email)
    const business = user.find(b => b.id === businessId)
    
    if (!business) {
      return NextResponse.json(
        { error: 'Access denied to this business' },
        { status: 403 }
      )
    }

    // Create the project
    const projectData = {
      name,
      description: description || undefined,
      type: type as 'SOFTWARE' | 'MARKETING' | 'OPERATIONS' | 'LEGAL',
      businessId
    }

    const project = await db.createProject(projectData)

    return NextResponse.json({
      id: project.id,
      name: project.name,
      description: project.description,
      type: project.type,
      status: project.status,
      businessId: project.businessId,
      createdAt: project.createdAt,
      message: 'Project created successfully'
    })

  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}