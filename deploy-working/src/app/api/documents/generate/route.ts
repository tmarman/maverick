import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase, withRetry, DatabaseError } from '@/lib/database-health'
import { LegalDocumentGenerator, validateBusinessInfo, BusinessInfo } from '@/lib/legal-documents'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()

    const { businessId, documentTypes } = body

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      )
    }

    // Get business information from database
    const prisma = await getDatabase()
    const business = await withRetry(() => prisma.business.findUnique({
      where: { id: businessId },
      include: {
        owner: true
      }
    }))

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Check authorization (business owner or member)
    if (session?.user?.id !== business.ownerId) {
      // TODO: Check if user is a business member
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Map business data to document generator format
    const businessInfo: BusinessInfo = {
      businessName: business.name,
      businessType: business.legalStructure as 'LLC' | 'C-Corp' | 'S-Corp',
      state: business.state || 'DE',
      founderName: business.owner.name || 'Business Owner',
      founderEmail: business.owner.email,
      industry: business.industry || 'General Business',
      description: business.description || 'Business operations',
      formationDate: business.createdAt
    }

    // Validate business information
    const validationErrors = validateBusinessInfo(businessInfo)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid business information', details: validationErrors },
        { status: 400 }
      )
    }

    // Generate requested documents or all documents if none specified
    let documents
    if (documentTypes && Array.isArray(documentTypes)) {
      documents = []
      for (const docType of documentTypes) {
        try {
          switch (docType) {
            case 'privacy-policy':
              documents.push(LegalDocumentGenerator.generatePrivacyPolicy(businessInfo))
              break
            case 'terms-of-service':
              documents.push(LegalDocumentGenerator.generateTermsOfService(businessInfo))
              break
            case 'operating-agreement':
              if (businessInfo.businessType === 'LLC') {
                documents.push(LegalDocumentGenerator.generateOperatingAgreement(businessInfo))
              }
              break
            case 'articles-of-incorporation':
              if (businessInfo.businessType !== 'LLC') {
                documents.push(LegalDocumentGenerator.generateArticlesOfIncorporation(businessInfo))
              }
              break
            default:
              console.warn(`Unknown document type: ${docType}`)
          }
        } catch (error) {
          console.error(`Error generating ${docType}:`, error)
        }
      }
    } else {
      documents = LegalDocumentGenerator.generateAllDocuments(businessInfo)
    }

    // Store generated documents in database for future reference
    const documentRecords = []
    for (const doc of documents) {
      try {
        // TODO: Implement proper document storage when schema is updated
        console.log(`Generated document: ${doc.title}`)
        // const documentRecord = await withRetry(() => prisma.document.create({ ... }))
        // documentRecords.push(documentRecord)
      } catch (error) {
        console.error('Error storing document:', error)
        // Continue even if storage fails
      }
    }

    return NextResponse.json({
      success: true,
      documents: documents.map(doc => ({
        type: doc.type,
        title: doc.title,
        content: doc.content,
        lastUpdated: doc.lastUpdated,
        markdown: LegalDocumentGenerator.exportToMarkdown(doc)
      })),
      stored: documentRecords.length,
      message: `Generated ${documents.length} legal document(s) for ${businessInfo.businessName}`
    })

  } catch (error) {
    console.error('Document generation error:', error)
    
    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { 
          error: 'Database temporarily unavailable',
          details: error.message
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Document generation failed' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) 
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      )
    }

    const prisma = await getDatabase()
    
    // Get existing documents for the business
    const business = await withRetry(() => prisma.business.findUnique({
      where: { id: businessId },
      include: {
        projects: {
          include: {
            documents: {
              where: {
                type: 'LEGAL'
              },
              orderBy: {
                createdAt: 'desc'
              }
            }
          }
        }
      }
    }))

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Check authorization
    if (session?.user?.id !== business.ownerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Flatten documents from all projects
    const legalDocuments = business.projects.flatMap(project => 
      project.documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        status: doc.status,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        content: doc.content ? JSON.parse(doc.content) : null
      }))
    )

    return NextResponse.json({
      success: true,
      businessName: business.name,
      documents: legalDocuments
    })

  } catch (error) {
    console.error('Error fetching documents:', error)
    
    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { 
          error: 'Database temporarily unavailable',
          details: error.message
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch documents' 
      },
      { status: 500 }
    )
  }
}