import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase, withRetry, DatabaseError } from '@/lib/database-health'
import { v4 as uuidv4 } from 'uuid'

interface PaymentRequest {
  token: string
  amount: number
  description: string
  businessData: {
    businessName: string
    businessType: string
    state: string
    industry: string
    description: string
    founderName: string
    founderEmail: string
    subscriptionPlan: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body: PaymentRequest = await request.json()

    const { token, amount, description, businessData } = body

    // Validate required fields
    if (!token || !amount || !businessData) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment information' },
        { status: 400 }
      )
    }

    // Initialize Square client
    // Note: You'll need to configure these environment variables
    const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN // Sandbox or Production token
    const squareApplicationId = process.env.SQUARE_APPLICATION_ID
    const squareEnvironment = process.env.SQUARE_ENVIRONMENT || 'sandbox' // 'sandbox' or 'production'

    if (!squareAccessToken) {
      console.error('Square access token not configured')
      return NextResponse.json(
        { success: false, error: 'Payment processing not configured' },
        { status: 500 }
      )
    }

    // For now, we'll simulate the Square payment API call
    // In production, you would use the Square Node.js SDK like this:
    
    /*
    const { Client, Environment } = require('square')
    
    const client = new Client({
      accessToken: squareAccessToken,
      environment: squareEnvironment === 'production' ? Environment.Production : Environment.Sandbox
    })

    const paymentsApi = client.paymentsApi

    const request = {
      sourceId: token,
      amountMoney: {
        amount: amount,
        currency: 'USD'
      },
      idempotencyKey: uuidv4(),
      note: description,
      buyerEmailAddress: businessData.founderEmail
    }

    const response = await paymentsApi.createPayment(request)
    */

    // Simulated payment processing for development
    console.log('Processing payment:', {
      amount: amount / 100, // Convert cents to dollars
      description,
      businessData,
      tokenPrefix: token.substring(0, 10) + '...'
    })

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // In development, simulate successful payment
    const paymentResult = {
      id: `payment_${uuidv4()}`,
      status: 'COMPLETED',
      amount: amount,
      currency: 'USD',
      createdAt: new Date().toISOString()
    }

    // 1. Create business formation order in database
    console.log('Creating business formation records...')
    const prisma = await getDatabase()
    
    // Create or get user account
    let userId = session?.user?.id
    if (!userId) {
      // Create guest user for this formation
      const user = await withRetry(() => prisma.user.create({
        data: {
          email: businessData.founderEmail,
          name: businessData.founderName,
          emailVerified: new Date(),
        }
      }))
      userId = user.id
    }

    // Create organization record
    const organization = await withRetry(() => prisma.organization.create({
      data: {
        ownerId: userId,
        name: businessData.businessName,
        description: businessData.description,
        industry: businessData.industry,
        organizationType: businessData.businessType,
        legalStructure: businessData.businessType,
        state: businessData.state,
        status: 'IN_FORMATION',
        squareServices: JSON.stringify(['payments', 'banking']),
        appType: 'website',
        appFeatures: JSON.stringify(['ecommerce', 'cms']),
        subscriptionPlan: businessData.subscriptionPlan,
        subscriptionStatus: 'ACTIVE',
        billingEmail: businessData.founderEmail,
      }
    }))

    // Create business formation record
    const formation = await withRetry(() => prisma.businessFormation.create({
      data: {
        organizationId: organization.id,
        status: 'INITIATED',
        currentStep: 'PAYMENT_RECEIVED',
        completedSteps: JSON.stringify(['PAYMENT_RECEIVED']),
        documentsGenerated: JSON.stringify([]),
        cost: amount / 100, // Convert cents to dollars
      }
    }))

    // 2. Send confirmation email
    console.log('Sending confirmation email...')
    try {
      const { azureEmailService } = await import('@/lib/azure-email')
      await azureEmailService.sendWelcomeEmail(
        businessData.founderEmail,
        businessData.founderName
      )
    } catch (error) {
      console.error('Failed to send welcome email:', error)
      // Don't fail the payment for email issues
    }

    // 3. Create default project structure in cockpit
    const defaultProject = await withRetry(() => prisma.project.create({
      data: {
        name: 'App',
        description: `Main ${businessData.businessName} application`,
        type: 'SOFTWARE',
        status: 'PLANNING',
        organizationId: organization.id,
        githubConfig: JSON.stringify({
          repositoryUrl: `https://github.com/user/${businessData.businessName.toLowerCase().replace(/\s+/g, '-')}`,
          autoDeployment: true
        }),
        aiAgentConfig: JSON.stringify({
          primaryAgent: 'product_expert',
          specializations: ['web_development', 'ecommerce']
        }),
      }
    }))

    // Create initial features for the business formation
    const initialFeatures = [
      {
        title: 'Business Website Development',
        description: 'Create a professional website with integrated Square payments',
        status: 'PLANNED',
        priority: 'HIGH',
        functionalArea: 'SOFTWARE',
        projectId: defaultProject.id,
        estimatedEffort: '2w'
      },
      {
        title: 'Square Payment Integration',
        description: 'Set up Square payments for online sales and in-person transactions',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        functionalArea: 'SOFTWARE',
        projectId: defaultProject.id,
        estimatedEffort: '1w'
      },
      {
        title: 'Legal Documents & Compliance',
        description: 'Generate required legal documents and ensure regulatory compliance',
        status: 'PLANNED',
        priority: 'HIGH',
        functionalArea: 'LEGAL',
        projectId: defaultProject.id,
        estimatedEffort: '1w'
      }
    ]

    for (const feature of initialFeatures) {
      await withRetry(() => prisma.feature.create({
        data: {
          ...feature,
          acceptanceCriteria: JSON.stringify([]),
          aiGeneratedData: JSON.stringify({}),
          chatHistory: JSON.stringify([])
        }
      }))
    }

    const formationOrder = {
      id: formation.id,
      businessId: organization.id,
      userId: userId,
      businessName: businessData.businessName,
      businessType: businessData.businessType,
      state: businessData.state,
      industry: businessData.industry,
      founderName: businessData.founderName,
      founderEmail: businessData.founderEmail,
      subscriptionPlan: businessData.subscriptionPlan,
      paymentId: paymentResult.id,
      amount: amount,
      status: 'PAID',
      formationStatus: 'PROCESSING',
      createdAt: new Date().toISOString()
    }

    console.log('Business formation order created:', formationOrder)

    return NextResponse.json({
      success: true,
      payment: paymentResult,
      formation: formationOrder,
      message: 'Payment successful! Your business formation is now processing.',
      cockpitUrl: '/cockpit'
    })

  } catch (error) {
    console.error('Payment processing error:', error)
    
    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database temporarily unavailable. Payment may have succeeded but formation setup is pending.',
          details: error.message
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment processing failed' 
      },
      { status: 500 }
    )
  }
}

// Helper function to validate payment amount
function validatePaymentAmount(amount: number, subscriptionPlan: string): boolean {
  const expectedAmounts = {
    founder: 69800, // $599 + $99 = $698
    growth: 79800   // $599 + $199 = $798
  }
  
  return expectedAmounts[subscriptionPlan as keyof typeof expectedAmounts] === amount
}