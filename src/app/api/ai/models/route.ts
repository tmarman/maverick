import { NextRequest, NextResponse } from 'next/server'
import { getAllModels, getEnabledModels, getBestModelForTask, getModelMetadata } from '@/lib/chat-ai-provider'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const task = searchParams.get('task') as 'code' | 'analysis' | 'creative' | 'fast' | 'cost-effective'
    const maxCost = searchParams.get('maxCost')

    switch (action) {
      case 'enabled':
        return NextResponse.json({
          success: true,
          models: getEnabledModels()
        })
      
      case 'best':
        if (!task) {
          return NextResponse.json({
            success: false,
            error: 'Task parameter required for best model selection'
          }, { status: 400 })
        }
        
        const bestModel = getBestModelForTask(
          task,
          maxCost ? parseFloat(maxCost) : undefined
        )
        
        return NextResponse.json({
          success: true,
          model: bestModel
        })
      
      case 'metadata':
        const modelId = searchParams.get('modelId')
        if (!modelId) {
          return NextResponse.json({
            success: false,
            error: 'Model ID required for metadata lookup'
          }, { status: 400 })
        }
        
        const metadata = getModelMetadata(modelId)
        return NextResponse.json({
          success: true,
          metadata
        })
      
      default:
        return NextResponse.json({
          success: true,
          models: getAllModels()
        })
    }
  } catch (error) {
    console.error('Models API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch model information'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, modelId, enabled } = body

    if (action === 'toggle') {
      // In a real implementation, you'd update user/project settings in the database
      // For now, this would be a placeholder for toggling model availability
      
      return NextResponse.json({
        success: true,
        message: `Model ${modelId} ${enabled ? 'enabled' : 'disabled'}`
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })
  } catch (error) {
    console.error('Models API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update model settings'
    }, { status: 500 })
  }
}