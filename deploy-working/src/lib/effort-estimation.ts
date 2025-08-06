/**
 * AI-Native Effort Estimation System
 * 
 * Philosophy: "Time is a circle with AI generation"
 * Focus on Priority, Effort Level, and Scope rather than time-based estimates
 */

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type EffortLevel = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'
export type ScopeSize = 'FOCUSED' | 'STANDARD' | 'BROAD' | 'EPIC' | 'PLATFORM'

export interface EffortEstimate {
  priority: PriorityLevel
  effort: EffortLevel
  scope: ScopeSize
  complexity: ComplexityFactors
  aiCredits?: number // AI-based estimation in credits
  confidence: number // 0-100% confidence in estimate
  reasoning: string
}

export interface ComplexityFactors {
  technical: 'LOW' | 'MEDIUM' | 'HIGH'
  integration: 'ISOLATED' | 'CONNECTED' | 'ECOSYSTEM'
  uncertainty: 'KNOWN' | 'RESEARCH' | 'EXPERIMENTAL'
  dependencies: 'NONE' | 'INTERNAL' | 'EXTERNAL' | 'CROSS_PLATFORM'
}

export interface AIEstimationContext {
  projectType: string
  technicalStack: string[]
  teamExperience: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT'
  existingInfrastructure: boolean
  hasAIAssistance: boolean
}

export class EffortEstimationService {
  private static readonly EFFORT_MULTIPLIERS = {
    XS: 1,      // Quick fix, small component
    S: 2,       // Single feature, clear scope  
    M: 5,       // Standard feature with complexity
    L: 13,      // Major feature or integration
    XL: 21,     // Epic or platform change
    XXL: 34     // Massive architectural change
  }

  private static readonly PRIORITY_WEIGHTS = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1
  }

  private static readonly SCOPE_MULTIPLIERS = {
    FOCUSED: 1.0,    // Single component/feature
    STANDARD: 1.5,   // Multiple related components  
    BROAD: 2.5,      // Cross-cutting changes
    EPIC: 4.0,       // Major initiative
    PLATFORM: 6.5    // Platform-wide changes
  }

  static estimateEffort(
    description: string,
    context: AIEstimationContext,
    existingItems?: any[]
  ): EffortEstimate {
    const analysis = this.analyzeWorkItem(description)
    const complexity = this.assessComplexity(description, context)
    const scope = this.determinateScope(description, complexity)
    const effort = this.calculateEffortLevel(analysis, complexity, scope)
    const priority = this.suggestPriority(description, analysis, existingItems)
    
    return {
      priority,
      effort,
      scope,
      complexity,
      aiCredits: this.estimateAICredits(effort, complexity, context),
      confidence: this.calculateConfidence(analysis, complexity),
      reasoning: this.generateReasoning(analysis, complexity, effort, scope)
    }
  }

  static prioritizeWorkItems(items: any[]): any[] {
    return items.sort((a, b) => {
      // Calculate priority score considering effort and impact
      const scoreA = this.calculatePriorityScore(a)
      const scoreB = this.calculatePriorityScore(b)
      
      return scoreB - scoreA
    })
  }

  static calculateResourceRequirements(
    estimates: EffortEstimate[],
    sprintCapacity: number = 20 // Base capacity points per sprint
  ): {
    totalEffort: number
    estimatedSprints: number
    criticalPath: EffortEstimate[]
    resourceAllocation: Record<PriorityLevel, number>
  } {
    const totalEffort = estimates.reduce((sum, est) => 
      sum + this.EFFORT_MULTIPLIERS[est.effort] * this.SCOPE_MULTIPLIERS[est.scope], 0
    )

    const criticalItems = estimates.filter(est => 
      est.priority === 'CRITICAL' || est.priority === 'HIGH'
    )

    const resourceAllocation = estimates.reduce((acc, est) => {
      const effort = this.EFFORT_MULTIPLIERS[est.effort] * this.SCOPE_MULTIPLIERS[est.scope]
      acc[est.priority] = (acc[est.priority] || 0) + effort
      return acc
    }, {} as Record<PriorityLevel, number>)

    return {
      totalEffort,
      estimatedSprints: Math.ceil(totalEffort / sprintCapacity),
      criticalPath: criticalItems,
      resourceAllocation
    }
  }

  static generateEstimationSummary(estimates: EffortEstimate[]): string {
    const { totalEffort, estimatedSprints, resourceAllocation } = 
      this.calculateResourceRequirements(estimates)

    const priorityBreakdown = Object.entries(resourceAllocation)
      .map(([priority, effort]) => `${priority}: ${effort} points`)
      .join(', ')

    return `
## Effort Estimation Summary

**Total Effort**: ${totalEffort} effort points
**Estimated Delivery**: ${estimatedSprints} sprints
**Priority Breakdown**: ${priorityBreakdown}

### Key Insights
- ${estimates.filter(e => e.priority === 'CRITICAL').length} critical items requiring immediate attention
- ${estimates.filter(e => e.effort === 'XL' || e.effort === 'XXL').length} large-scale initiatives
- ${Math.round(estimates.reduce((sum, e) => sum + e.confidence, 0) / estimates.length)}% average confidence

### AI Credit Estimation
- Total AI Credits: ${estimates.reduce((sum, e) => sum + (e.aiCredits || 0), 0)}
- High-AI items: ${estimates.filter(e => (e.aiCredits || 0) > 100).length}

*Estimates generated using AI-native effort assessment focusing on priority, scope, and complexity rather than time-based predictions.*
    `.trim()
  }

  private static analyzeWorkItem(description: string): {
    keywords: string[]
    type: 'feature' | 'bug' | 'enhancement' | 'infrastructure'
    indicators: string[]
  } {
    const featureKeywords = ['create', 'build', 'add', 'implement', 'develop', 'design']
    const infrastructureKeywords = ['deploy', 'setup', 'configure', 'infrastructure', 'platform']
    const enhancementKeywords = ['improve', 'optimize', 'refactor', 'enhance', 'upgrade']
    const bugKeywords = ['fix', 'resolve', 'debug', 'issue', 'bug', 'error']

    const lowerDesc = description.toLowerCase()
    const keywords = [...featureKeywords, ...infrastructureKeywords, ...enhancementKeywords, ...bugKeywords]
      .filter(keyword => lowerDesc.includes(keyword))

    let type: 'feature' | 'bug' | 'enhancement' | 'infrastructure' = 'feature'
    if (bugKeywords.some(kw => lowerDesc.includes(kw))) type = 'bug'
    else if (enhancementKeywords.some(kw => lowerDesc.includes(kw))) type = 'enhancement'
    else if (infrastructureKeywords.some(kw => lowerDesc.includes(kw))) type = 'infrastructure'

    const indicators = []
    if (lowerDesc.includes('integration')) indicators.push('integration-required')
    if (lowerDesc.includes('api')) indicators.push('api-work')
    if (lowerDesc.includes('ui') || lowerDesc.includes('interface')) indicators.push('ui-work')
    if (lowerDesc.includes('database') || lowerDesc.includes('db')) indicators.push('database-work')
    if (lowerDesc.includes('test')) indicators.push('testing-required')
    if (lowerDesc.includes('security')) indicators.push('security-critical')

    return { keywords, type, indicators }
  }

  private static assessComplexity(
    description: string, 
    context: AIEstimationContext
  ): ComplexityFactors {
    const lowerDesc = description.toLowerCase()

    // Technical complexity
    let technical: ComplexityFactors['technical'] = 'MEDIUM'
    if (lowerDesc.includes('simple') || lowerDesc.includes('basic')) technical = 'LOW'
    if (lowerDesc.includes('complex') || lowerDesc.includes('advanced') || lowerDesc.includes('algorithm')) technical = 'HIGH'

    // Integration complexity
    let integration: ComplexityFactors['integration'] = 'ISOLATED'
    if (lowerDesc.includes('integrate') || lowerDesc.includes('connect')) integration = 'CONNECTED'
    if (lowerDesc.includes('platform') || lowerDesc.includes('ecosystem')) integration = 'ECOSYSTEM'

    // Uncertainty level
    let uncertainty: ComplexityFactors['uncertainty'] = 'KNOWN'
    if (lowerDesc.includes('research') || lowerDesc.includes('investigate')) uncertainty = 'RESEARCH'
    if (lowerDesc.includes('experiment') || lowerDesc.includes('prototype')) uncertainty = 'EXPERIMENTAL'

    // Dependencies
    let dependencies: ComplexityFactors['dependencies'] = 'NONE'
    if (lowerDesc.includes('depend') || lowerDesc.includes('require')) dependencies = 'INTERNAL'
    if (lowerDesc.includes('external') || lowerDesc.includes('third-party')) dependencies = 'EXTERNAL'
    if (lowerDesc.includes('cross-platform') || lowerDesc.includes('multi')) dependencies = 'CROSS_PLATFORM'

    return { technical, integration, uncertainty, dependencies }
  }

  private static determinateScope(
    description: string, 
    complexity: ComplexityFactors
  ): ScopeSize {
    const lowerDesc = description.toLowerCase()

    if (lowerDesc.includes('platform') || lowerDesc.includes('system-wide')) return 'PLATFORM'
    if (lowerDesc.includes('epic') || complexity.integration === 'ECOSYSTEM') return 'EPIC'
    if (lowerDesc.includes('multiple') || lowerDesc.includes('across')) return 'BROAD'
    if (lowerDesc.includes('component') || lowerDesc.includes('single')) return 'FOCUSED'
    
    return 'STANDARD'
  }

  private static calculateEffortLevel(
    analysis: any,
    complexity: ComplexityFactors,
    scope: ScopeSize
  ): EffortLevel {
    let baseEffort = 2 // Start with 'S'

    // Adjust based on complexity
    if (complexity.technical === 'HIGH') baseEffort += 2
    if (complexity.integration === 'ECOSYSTEM') baseEffort += 2
    if (complexity.uncertainty === 'EXPERIMENTAL') baseEffort += 1
    if (complexity.dependencies === 'CROSS_PLATFORM') baseEffort += 1

    // Adjust based on scope
    const scopeAdjustment = {
      FOCUSED: 0,
      STANDARD: 1,
      BROAD: 2,
      EPIC: 3,
      PLATFORM: 4
    }
    baseEffort += scopeAdjustment[scope]

    // Adjust based on type
    if (analysis.type === 'infrastructure') baseEffort += 1
    if (analysis.indicators.includes('security-critical')) baseEffort += 1

    // Map to effort levels
    const effortLevels: EffortLevel[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    const index = Math.min(Math.max(baseEffort - 1, 0), effortLevels.length - 1)
    
    return effortLevels[index]
  }

  private static suggestPriority(
    description: string,
    analysis: any,
    existingItems?: any[]
  ): PriorityLevel {
    const lowerDesc = description.toLowerCase()

    if (lowerDesc.includes('critical') || lowerDesc.includes('urgent')) return 'CRITICAL'
    if (lowerDesc.includes('security') && lowerDesc.includes('fix')) return 'CRITICAL'
    if (analysis.type === 'bug' && lowerDesc.includes('production')) return 'HIGH'
    if (lowerDesc.includes('user-facing') || lowerDesc.includes('customer')) return 'HIGH'
    if (lowerDesc.includes('nice to have') || lowerDesc.includes('future')) return 'LOW'

    return 'MEDIUM'
  }

  private static estimateAICredits(
    effort: EffortLevel,
    complexity: ComplexityFactors,
    context: AIEstimationContext
  ): number {
    const baseCredits = {
      XS: 10,
      S: 25,
      M: 50,
      L: 100,
      XL: 200,
      XXL: 400
    }

    let credits = baseCredits[effort]

    // Adjust for AI assistance level
    if (context.hasAIAssistance) {
      if (complexity.technical === 'HIGH') credits += 50
      if (complexity.uncertainty === 'EXPERIMENTAL') credits += 100
    }

    return credits
  }

  private static calculateConfidence(
    analysis: any,
    complexity: ComplexityFactors
  ): number {
    let confidence = 80 // Base confidence

    if (complexity.uncertainty === 'EXPERIMENTAL') confidence -= 30
    else if (complexity.uncertainty === 'RESEARCH') confidence -= 15

    if (complexity.technical === 'HIGH') confidence -= 10
    if (complexity.dependencies === 'CROSS_PLATFORM') confidence -= 10

    if (analysis.indicators.includes('integration-required')) confidence -= 5

    return Math.max(confidence, 20)
  }

  private static generateReasoning(
    analysis: any,
    complexity: ComplexityFactors,
    effort: EffortLevel,
    scope: ScopeSize
  ): string {
    const reasons = []

    reasons.push(`Classified as ${effort} effort (${scope} scope)`)
    
    if (complexity.technical === 'HIGH') {
      reasons.push('High technical complexity identified')
    }
    
    if (complexity.integration === 'ECOSYSTEM') {
      reasons.push('Requires ecosystem-level integration')
    }
    
    if (complexity.uncertainty === 'EXPERIMENTAL') {
      reasons.push('Experimental nature increases uncertainty')
    }
    
    if (analysis.indicators.includes('security-critical')) {
      reasons.push('Security-critical work requires additional rigor')
    }

    return reasons.join('. ') + '.'
  }

  private static calculatePriorityScore(item: any): number {
    const priorityWeight = this.PRIORITY_WEIGHTS[item.priority as PriorityLevel] || 2
    const effortWeight = this.EFFORT_MULTIPLIERS[item.effort as EffortLevel] || 5
    const scopeWeight = this.SCOPE_MULTIPLIERS[item.scope as ScopeSize] || 1.5
    
    // Higher priority and lower effort = higher score (quick wins)
    // But also consider scope for impact
    return (priorityWeight * 10) + (scopeWeight * 5) - (effortWeight * 0.5)
  }
}