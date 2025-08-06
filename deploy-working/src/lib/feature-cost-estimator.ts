/**
 * AI-Powered Feature Cost Estimation System
 * 
 * Estimates development costs based on:
 * - Feature complexity analysis
 * - Expected AI assistance required
 * - Token usage predictions
 * - Historical project data
 */

import { ModelMetadata, getModelMetadata, getBestModelForTask } from './chat-ai-provider'

export interface FeatureComplexity {
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'
  category: 'ui' | 'api' | 'database' | 'integration' | 'algorithm' | 'infrastructure'
  estimatedHours: number
  aiAssistanceLevel: 'minimal' | 'moderate' | 'heavy' | 'intensive'
  riskFactor: number // 1.0 = normal, 1.5 = high risk, 2.0 = very high risk
}

export interface CostEstimate {
  featureSize: string
  developmentHours: number
  aiCosts: {
    planning: number
    coding: number
    review: number
    documentation: number
    total: number
  }
  breakdown: {
    planningTokens: number
    codingTokens: number
    reviewTokens: number
    documentationTokens: number
    totalTokens: number
  }
  recommendedModel: ModelMetadata
  totalEstimate: number
  confidence: number // 0-1 scale
}

export interface FeatureDescription {
  title: string
  description: string
  requirements: string[]
  technicalSpecs?: string[]
  existingCodebase?: string
  dependencies?: string[]
}

// Complexity scoring based on feature characteristics
const COMPLEXITY_INDICATORS = {
  // UI Complexity
  'form': { points: 2, category: 'ui' },
  'dashboard': { points: 5, category: 'ui' },
  'chart': { points: 3, category: 'ui' },
  'table': { points: 2, category: 'ui' },
  'modal': { points: 1, category: 'ui' },
  'responsive': { points: 2, category: 'ui' },
  'animation': { points: 3, category: 'ui' },
  
  // API Complexity
  'rest api': { points: 3, category: 'api' },
  'graphql': { points: 4, category: 'api' },
  'websocket': { points: 4, category: 'api' },
  'authentication': { points: 3, category: 'api' },
  'authorization': { points: 2, category: 'api' },
  'rate limiting': { points: 2, category: 'api' },
  
  // Database Complexity
  'migration': { points: 2, category: 'database' },
  'relationship': { points: 2, category: 'database' },
  'indexing': { points: 1, category: 'database' },
  'aggregation': { points: 3, category: 'database' },
  'transaction': { points: 3, category: 'database' },
  'replication': { points: 5, category: 'database' },
  
  // Integration Complexity
  'third party': { points: 4, category: 'integration' },
  'webhook': { points: 3, category: 'integration' },
  'oauth': { points: 4, category: 'integration' },
  'payment': { points: 5, category: 'integration' },
  'email': { points: 2, category: 'integration' },
  'sms': { points: 2, category: 'integration' },
  
  // Algorithm Complexity
  'search': { points: 3, category: 'algorithm' },
  'sort': { points: 2, category: 'algorithm' },
  'recommendation': { points: 5, category: 'algorithm' },
  'machine learning': { points: 8, category: 'algorithm' },
  'ai': { points: 6, category: 'algorithm' },
  'optimization': { points: 4, category: 'algorithm' },
  
  // Infrastructure Complexity
  'deployment': { points: 3, category: 'infrastructure' },
  'scaling': { points: 4, category: 'infrastructure' },
  'monitoring': { points: 2, category: 'infrastructure' },
  'logging': { points: 1, category: 'infrastructure' },
  'backup': { points: 2, category: 'infrastructure' },
  'security': { points: 4, category: 'infrastructure' }
}

// Token usage patterns for different development phases
const TOKEN_USAGE_PATTERNS = {
  planning: {
    baseTokens: 2000,
    perComplexityPoint: 500,
    rounds: 2 // Planning iterations
  },
  coding: {
    baseTokens: 5000,
    perComplexityPoint: 1500,
    rounds: 3 // Code iterations
  },
  review: {
    baseTokens: 1000,
    perComplexityPoint: 300,
    rounds: 1 // Review phase
  },
  documentation: {
    baseTokens: 1500,
    perComplexityPoint: 200,
    rounds: 1 // Documentation phase
  }
}

export class FeatureCostEstimator {
  
  static analyzeComplexity(feature: FeatureDescription): FeatureComplexity {
    const text = [
      feature.title,
      feature.description,
      ...feature.requirements,
      ...(feature.technicalSpecs || []),
      ...(feature.dependencies || [])
    ].join(' ').toLowerCase()
    
    let totalPoints = 0
    let primaryCategory: FeatureComplexity['category'] = 'ui'
    const categoryCounts: Partial<Record<FeatureComplexity['category'], number>> = {}
    
    // Analyze text for complexity indicators
    Object.entries(COMPLEXITY_INDICATORS).forEach(([keyword, info]) => {
      const occurrences = (text.match(new RegExp(keyword, 'g')) || []).length
      if (occurrences > 0) {
        totalPoints += info.points * occurrences
        const cat = info.category as FeatureComplexity['category']
        categoryCounts[cat] = (categoryCounts[cat] || 0) + info.points * occurrences
      }
    })
    
    // Determine primary category  
    let maxCategoryPoints = 0
    const validCategories: FeatureComplexity['category'][] = ['ui', 'api', 'database', 'integration', 'algorithm', 'infrastructure']
    
    Object.entries(categoryCounts).forEach(([category, points]) => {
      const cat = category as FeatureComplexity['category']
      if (points > maxCategoryPoints && validCategories.includes(cat)) {
        maxCategoryPoints = points
        primaryCategory = cat
      }
    })
    
    // Determine size based on total complexity points
    let size: FeatureComplexity['size']
    let estimatedHours: number
    let aiAssistanceLevel: FeatureComplexity['aiAssistanceLevel']
    let riskFactor: number = 1.0
    
    if (totalPoints <= 3) {
      size = 'XS'
      estimatedHours = 2
      aiAssistanceLevel = 'minimal'
    } else if (totalPoints <= 8) {
      size = 'S'
      estimatedHours = 8
      aiAssistanceLevel = 'minimal'
    } else if (totalPoints <= 15) {
      size = 'M'
      estimatedHours = 20
      aiAssistanceLevel = 'moderate'
    } else if (totalPoints <= 25) {
      size = 'L'
      estimatedHours = 40
      aiAssistanceLevel = 'moderate'
      riskFactor = 1.2
    } else if (totalPoints <= 40) {
      size = 'XL'
      estimatedHours = 80
      aiAssistanceLevel = 'heavy'
      riskFactor = 1.5
    } else {
      size = 'XXL'
      estimatedHours = 160
      aiAssistanceLevel = 'intensive'
      riskFactor = 2.0
    }
    
    // Adjust based on category-specific factors
    const category = primaryCategory as string
    if (['integration', 'algorithm'].includes(category)) {
      riskFactor *= 1.3
    } else if (category === 'infrastructure') {
      riskFactor *= 1.2
    }
    
    return {
      size,
      category: primaryCategory,
      estimatedHours: Math.ceil(estimatedHours * riskFactor),
      aiAssistanceLevel,
      riskFactor
    }
  }
  
  static estimateCost(
    feature: FeatureDescription,
    complexity?: FeatureComplexity,
    maxBudget?: number
  ): CostEstimate {
    if (!complexity) {
      complexity = this.analyzeComplexity(feature)
    }
    
    // Calculate base complexity points for token estimation
    const complexityPoints = this.getComplexityPoints(complexity.size)
    
    // Calculate token usage for each phase
    const planningTokens = TOKEN_USAGE_PATTERNS.planning.baseTokens + 
      (complexityPoints * TOKEN_USAGE_PATTERNS.planning.perComplexityPoint * TOKEN_USAGE_PATTERNS.planning.rounds)
    
    const codingTokens = TOKEN_USAGE_PATTERNS.coding.baseTokens + 
      (complexityPoints * TOKEN_USAGE_PATTERNS.coding.perComplexityPoint * TOKEN_USAGE_PATTERNS.coding.rounds)
    
    const reviewTokens = TOKEN_USAGE_PATTERNS.review.baseTokens + 
      (complexityPoints * TOKEN_USAGE_PATTERNS.review.perComplexityPoint * TOKEN_USAGE_PATTERNS.review.rounds)
    
    const documentationTokens = TOKEN_USAGE_PATTERNS.documentation.baseTokens + 
      (complexityPoints * TOKEN_USAGE_PATTERNS.documentation.perComplexityPoint * TOKEN_USAGE_PATTERNS.documentation.rounds)
    
    const totalTokens = planningTokens + codingTokens + reviewTokens + documentationTokens
    
    // Select best model based on budget constraints
    const taskType = complexity.category === 'algorithm' ? 'analysis' : 'code'
    const recommendedModel = maxBudget 
      ? getBestModelForTask('cost-effective', maxBudget)
      : getBestModelForTask(taskType)
    
    if (!recommendedModel) {
      throw new Error('No suitable model found for the given constraints')
    }
    
    // Calculate costs (assuming average 50/50 input/output split)
    const avgCostPer1M = (recommendedModel.inputCostPer1M + recommendedModel.outputCostPer1M) / 2
    
    const planningCost = (planningTokens / 1_000_000) * avgCostPer1M
    const codingCost = (codingTokens / 1_000_000) * avgCostPer1M
    const reviewCost = (reviewTokens / 1_000_000) * avgCostPer1M
    const documentationCost = (documentationTokens / 1_000_000) * avgCostPer1M
    
    const totalAICost = planningCost + codingCost + reviewCost + documentationCost
    
    // Calculate confidence based on feature clarity and complexity
    const confidence = this.calculateConfidence(feature, complexity)
    
    return {
      featureSize: complexity.size,
      developmentHours: complexity.estimatedHours,
      aiCosts: {
        planning: planningCost,
        coding: codingCost,
        review: reviewCost,
        documentation: documentationCost,
        total: totalAICost
      },
      breakdown: {
        planningTokens,
        codingTokens,
        reviewTokens,
        documentationTokens,
        totalTokens
      },
      recommendedModel,
      totalEstimate: totalAICost,
      confidence
    }
  }
  
  static getMultipleEstimates(
    feature: FeatureDescription,
    modelIds: string[]
  ): Array<CostEstimate & { modelId: string }> {
    const complexity = this.analyzeComplexity(feature)
    
    return modelIds.map(modelId => {
      const model = getModelMetadata(modelId)
      if (!model) {
        throw new Error(`Model ${modelId} not found`)
      }
      
      const complexityPoints = this.getComplexityPoints(complexity.size)
      const totalTokens = this.calculateTotalTokens(complexityPoints)
      
      const avgCostPer1M = (model.inputCostPer1M + model.outputCostPer1M) / 2
      const totalCost = (totalTokens / 1_000_000) * avgCostPer1M
      
      const confidence = this.calculateConfidence(feature, complexity)
      
      return {
        modelId,
        featureSize: complexity.size,
        developmentHours: complexity.estimatedHours,
        aiCosts: {
          planning: totalCost * 0.2,
          coding: totalCost * 0.5,
          review: totalCost * 0.2,
          documentation: totalCost * 0.1,
          total: totalCost
        },
        breakdown: {
          planningTokens: Math.floor(totalTokens * 0.2),
          codingTokens: Math.floor(totalTokens * 0.5),
          reviewTokens: Math.floor(totalTokens * 0.2),
          documentationTokens: Math.floor(totalTokens * 0.1),
          totalTokens
        },
        recommendedModel: model,
        totalEstimate: totalCost,
        confidence
      }
    })
  }
  
  private static getComplexityPoints(size: FeatureComplexity['size']): number {
    const sizePoints = { XS: 2, S: 5, M: 10, L: 20, XL: 35, XXL: 60 }
    return sizePoints[size]
  }
  
  private static calculateTotalTokens(complexityPoints: number): number {
    return Object.values(TOKEN_USAGE_PATTERNS).reduce((total, pattern) => {
      return total + pattern.baseTokens + (complexityPoints * pattern.perComplexityPoint * pattern.rounds)
    }, 0)
  }
  
  private static calculateConfidence(
    feature: FeatureDescription,
    complexity: FeatureComplexity
  ): number {
    let confidence = 0.8 // Base confidence
    
    // Increase confidence for well-defined features
    if (feature.requirements.length >= 3) confidence += 0.1
    if (feature.technicalSpecs && feature.technicalSpecs.length >= 2) confidence += 0.05
    if (feature.description.length > 100) confidence += 0.05
    
    // Decrease confidence for high complexity/risk
    if (complexity.riskFactor > 1.5) confidence -= 0.2
    if (complexity.size === 'XXL') confidence -= 0.15
    if (complexity.aiAssistanceLevel === 'intensive') confidence -= 0.1
    
    return Math.max(0.3, Math.min(0.95, confidence))
  }
}

// Utility functions for UI display
export function formatCost(cost: number): string {
  if (cost < 0.01) return '<$0.01'
  if (cost < 1) return `$${cost.toFixed(2)}`
  if (cost < 100) return `$${cost.toFixed(1)}`
  return `$${Math.round(cost)}`
}

export function formatTokens(tokens: number): string {
  if (tokens < 1000) return `${tokens} tokens`
  if (tokens < 1_000_000) return `${(tokens / 1000).toFixed(1)}K tokens`
  return `${(tokens / 1_000_000).toFixed(1)}M tokens`
}

export function getComplexityColor(size: FeatureComplexity['size']): string {
  const colors = {
    XS: 'green',
    S: 'blue',
    M: 'yellow',
    L: 'orange',
    XL: 'red',
    XXL: 'purple'
  }
  return colors[size]
}

export function getComplexityDescription(size: FeatureComplexity['size']): string {
  const descriptions = {
    XS: 'Very simple change, minimal AI assistance needed',
    S: 'Simple feature, basic AI guidance',
    M: 'Medium complexity, moderate AI assistance',
    L: 'Large feature, significant AI involvement',
    XL: 'Very large feature, heavy AI assistance required',
    XXL: 'Massive undertaking, intensive AI collaboration needed'
  }
  return descriptions[size]
}