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

    const { name, description, type, organizationId } = await request.json()

    if (!name || !type || !organizationId) {
      return NextResponse.json(
        { error: 'Name, type, and organization ID are required' },
        { status: 400 }
      )
    }

    // Validate that user has access to this organization
    const user = await db.getUserCompanies(session.user.email)
    const organization = user.find(b => b.id === organizationId)
    
    if (!organization) {
      return NextResponse.json(
        { error: 'Access denied to this organization' },
        { status: 403 }
      )
    }

    // Create the project
    const projectData = {
      name,
      description: description || undefined,
      type: type as 'SOFTWARE' | 'MARKETING' | 'OPERATIONS' | 'LEGAL',
      organizationId
    }

    const project = await db.createProject(projectData)

    return NextResponse.json({
      id: project.id,
      name: project.name,
      description: project.description,
      type: project.type,
      status: project.status,
      organizationId: project.organizationId,
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