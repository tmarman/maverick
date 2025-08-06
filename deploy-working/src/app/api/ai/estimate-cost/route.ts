import { NextRequest, NextResponse } from 'next/server'
import { FeatureCostEstimator, FeatureDescription } from '@/lib/feature-cost-estimator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      feature, 
      models, 
      maxBudget,
      includeComparison = false 
    }: {
      feature: FeatureDescription
      models?: string[]
      maxBudget?: number
      includeComparison?: boolean
    } = body

    // Validate input
    if (!feature || !feature.title || !feature.description) {
      return NextResponse.json({
        success: false,
        error: 'Feature title and description are required'
      }, { status: 400 })
    }

    // Analyze complexity first
    const complexity = FeatureCostEstimator.analyzeComplexity(feature)

    // Get primary estimate
    const primaryEstimate = FeatureCostEstimator.estimateCost(
      feature,
      complexity,
      maxBudget
    )

    // Get comparison estimates if requested
    let comparisons: any[] = []
    if (includeComparison && models && models.length > 0) {
      try {
        comparisons = FeatureCostEstimator.getMultipleEstimates(feature, models)
      } catch (error) {
        console.warn('Failed to get model comparisons:', error)
      }
    }

    // Generate cost breakdown insights
    const insights = generateCostInsights(primaryEstimate, complexity)

    return NextResponse.json({
      success: true,
      complexity,
      estimate: primaryEstimate,
      comparisons: comparisons.length > 0 ? comparisons : undefined,
      insights,
      recommendations: generateRecommendations(complexity, primaryEstimate)
    })

  } catch (error) {
    console.error('Cost estimation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to estimate feature cost'
    }, { status: 500 })
  }
}

function generateCostInsights(estimate: any, complexity: any) {
  const insights = []

  // Size-based insights
  if (complexity.size === 'XL' || complexity.size === 'XXL') {
    insights.push({
      type: 'warning',
      title: 'Large Feature Detected',
      message: `This is a ${complexity.size} feature that may benefit from breaking into smaller tasks.`,
      suggestion: 'Consider splitting this into multiple smaller features for better cost control and faster delivery.'
    })
  }

  // Cost breakdown insights
  const codingPercentage = (estimate.aiCosts.coding / estimate.aiCosts.total) * 100
  if (codingPercentage > 60) {
    insights.push({
      type: 'info',
      title: 'Code-Heavy Feature',
      message: `${Math.round(codingPercentage)}% of AI costs will go toward code generation.`,
      suggestion: 'Consider using a more cost-effective model for coding tasks if quality requirements allow.'
    })
  }

  // Risk factor insights
  if (complexity.riskFactor > 1.5) {
    insights.push({
      type: 'warning',
      title: 'High Risk Feature',
      message: `Risk factor of ${complexity.riskFactor}x may lead to scope creep and cost overruns.`,
      suggestion: 'Plan for additional buffer time and consider proof-of-concept work first.'
    })
  }

  // Budget efficiency insights
  if (estimate.totalEstimate < 5) {
    insights.push({
      type: 'success',
      title: 'Cost-Effective Feature',
      message: 'This feature has low AI assistance costs and good ROI potential.',
      suggestion: 'Great candidate for rapid development and iteration.'
    })
  } else if (estimate.totalEstimate > 100) {
    insights.push({
      type: 'warning',
      title: 'High-Cost Feature',
      message: 'AI assistance costs are significant for this feature.',
      suggestion: 'Consider if this feature justifies the investment or if scope can be reduced.'
    })
  }

  return insights
}

function generateRecommendations(complexity: any, estimate: any) {
  const recommendations = []

  // Model recommendations
  if (estimate.totalEstimate > 50) {
    recommendations.push({
      type: 'cost-optimization',
      title: 'Consider Cost-Effective Models',
      description: 'For large features, using faster/cheaper models for initial development and premium models for final review can reduce costs by 30-50%.',
      action: 'Use GPT-4o Mini or Claude Haiku for coding, then Claude Sonnet for review'
    })
  }

  // Development approach recommendations
  if (complexity.size === 'L' || complexity.size === 'XL' || complexity.size === 'XXL') {
    recommendations.push({
      type: 'development-strategy',
      title: 'Iterative Development Approach',
      description: 'Large features benefit from MVP-first development with gradual feature expansion.',
      action: 'Build core functionality first, then add advanced features in subsequent iterations'
    })
  }

  // Category-specific recommendations
  if (complexity.category === 'integration') {
    recommendations.push({
      type: 'technical',
      title: 'Integration Testing Strategy',
      description: 'Third-party integrations require extensive testing and error handling.',
      action: 'Allocate 30% extra time for integration testing and fallback scenarios'
    })
  }

  if (complexity.category === 'algorithm') {
    recommendations.push({
      type: 'technical',
      title: 'Algorithm Validation',
      description: 'Complex algorithms benefit from mathematical validation before implementation.',
      action: 'Consider prototyping the algorithm separately before full implementation'
    })
  }

  // Confidence-based recommendations
  if (estimate.confidence < 0.6) {
    recommendations.push({
      type: 'planning',
      title: 'Improve Feature Definition',
      description: 'Low confidence indicates the feature needs better specification.',
      action: 'Add more detailed requirements and technical specifications before development'
    })
  }

  return recommendations
}