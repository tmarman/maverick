import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const documents = await prisma.document.findMany({
      where: {
        projectId: params.projectId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
    
    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const data = await request.json()
    
    // TODO: Get user ID from session
    const createdById = 'temp-user-id' // Replace with actual session management
    
    const document = await prisma.document.create({
      data: {
        title: data.title,
        type: data.type,
        projectId: params.projectId,
        createdById,
        content: JSON.stringify(data.content || {}),
        aiContext: data.aiContext ? JSON.stringify(data.aiContext) : null,
        settings: null,
        status: 'DRAFT',
        collaborationMode: data.collaborationMode || 'HYBRID'
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}