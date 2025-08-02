import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params
  try {
    const projects = await prisma.project.findMany({
      where: {
        businessId: businessId
      },
      include: {
        _count: {
          select: {
            documents: true,
            features: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
    
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params
  try {
    const data = await request.json()
    
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        businessId: businessId,
        githubConfig: data.githubConfig ? JSON.stringify(data.githubConfig) : null,
        aiAgentConfig: data.aiAgentConfig ? JSON.stringify(data.aiAgentConfig) : null,
        metadata: null
      },
      include: {
        _count: {
          select: {
            documents: true,
            features: true
          }
        }
      }
    })
    
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}