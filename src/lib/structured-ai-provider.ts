import { generateAIResponse } from './ai-provider'

// Structured AI response types
export interface AITask {
  id: string
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
  estimatedDuration: string
  category: 'PLANNING' | 'DESIGN' | 'DEVELOPMENT' | 'TESTING' | 'DOCUMENTATION' | 'RESEARCH'
  dependencies?: string[]
  acceptance_criteria?: string[]
}

export interface AIOpportunity {
  id: string
  title: string
  description: string
  type: 'OPTIMIZATION' | 'FEATURE_ENHANCEMENT' | 'TECHNICAL_DEBT' | 'PROCESS_IMPROVEMENT' | 'MARKET_OPPORTUNITY'
  impact: 'LOW' | 'MEDIUM' | 'HIGH'
  effort: 'LOW' | 'MEDIUM' | 'HIGH'
  timeline: string
  potential_value: string
}

export interface AIRisk {
  id: string
  title: string
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  probability: 'LOW' | 'MEDIUM' | 'HIGH'
  mitigation_strategy: string
  impact_areas: string[]
}

export interface AIWorkItemAnalysis {
  title: string
  description: string
  type: 'FEATURE' | 'BUG' | 'EPIC' | 'STORY' | 'TASK' | 'SUBTASK'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
  functionalArea: 'SOFTWARE' | 'LEGAL' | 'OPERATIONS' | 'MARKETING'
  estimatedEffort: string
  tasks: AITask[]
  opportunities: AIOpportunity[]
  risks: AIRisk[]
  acceptance_criteria: string[]
  technical_considerations: string[]
  business_impact: string
}

export interface ProjectInsights {
  summary: string
  key_metrics: {
    total_tasks: number
    completed_tasks: number
    high_priority_tasks: number
    estimated_completion: string
  }
  opportunities: AIOpportunity[]
  risks: AIRisk[]
  recommendations: string[]
  next_actions: AITask[]
}

/**
 * Enhanced AI provider that returns structured JSON responses
 * for better integration with the project management system
 */
export class StructuredAIProvider {
  
  /**
   * Analyze a work item description and return comprehensive structured data
   */
  async analyzeWorkItem(
    description: string, 
    projectContext?: string,
    existingWorkItems?: any[]
  ): Promise<AIWorkItemAnalysis> {
    const prompt = this.buildWorkItemAnalysisPrompt(description, projectContext, existingWorkItems)
    
    try {
      const response = await generateAIResponse(
        prompt,
        'Work item analysis and planning for project management',
        'auto'
      )
      
      const analysis = this.parseJSONResponse<AIWorkItemAnalysis>(response)
      if (this.isValidWorkItemAnalysis(analysis)) {
        return analysis
      }
    } catch (error) {
      console.error('Structured AI analysis failed:', error)
    }
    
    // Fallback to basic analysis if AI fails
    return this.createFallbackAnalysis(description)
  }

  /**
   * Generate project insights based on current work items and project state
   */
  async generateProjectInsights(
    projectName: string,
    workItems: any[],
    projectDescription?: string
  ): Promise<ProjectInsights> {
    const prompt = this.buildProjectInsightsPrompt(projectName, workItems, projectDescription)
    
    try {
      const response = await generateAIResponse(
        prompt,
        'Project analysis and strategic insights generation',
        'auto'
      )
      
      const insights = this.parseJSONResponse<ProjectInsights>(response)
      if (this.isValidProjectInsights(insights)) {
        return insights
      }
    } catch (error) {
      console.error('Project insights generation failed:', error)
    }
    
    return this.createFallbackInsights(workItems)
  }

  /**
   * Analyze a feature request and suggest implementation approach
   */
  async analyzeFeatureRequest(
    featureDescription: string,
    projectContext: string,
    technicalStack?: string[]
  ): Promise<{
    analysis: AIWorkItemAnalysis
    implementation_strategy: {
      approach: string
      phases: Array<{
        name: string
        description: string
        duration: string
        deliverables: string[]
      }>
      technical_requirements: string[]
      dependencies: string[]
    }
  }> {
    const prompt = this.buildFeatureAnalysisPrompt(featureDescription, projectContext, technicalStack)
    
    try {
      const response = await generateAIResponse(
        prompt,
        'Feature analysis and implementation planning',
        'auto'
      )
      
      return this.parseJSONResponse(response)
    } catch (error) {
      console.error('Feature analysis failed:', error)
      throw new Error('Failed to analyze feature request')
    }
  }

  /**
   * Generate opportunities based on current project state
   */
  async identifyOpportunities(
    projectName: string,
    currentWorkItems: any[],
    businessGoals?: string[]
  ): Promise<AIOpportunity[]> {
    const prompt = this.buildOpportunitiesPrompt(projectName, currentWorkItems, businessGoals)
    
    try {
      const response = await generateAIResponse(
        prompt,
        'Opportunity identification and business analysis',
        'auto'
      )
      
      const result = this.parseJSONResponse<{ opportunities: AIOpportunity[] }>(response)
      return result.opportunities || []
    } catch (error) {
      console.error('Opportunity identification failed:', error)
      return []
    }
  }

  /**
   * Risk assessment for project or work item
   */
  async assessRisks(
    context: string,
    scope: 'PROJECT' | 'WORK_ITEM',
    workItems?: any[]
  ): Promise<AIRisk[]> {
    const prompt = this.buildRiskAssessmentPrompt(context, scope, workItems)
    
    try {
      const response = await generateAIResponse(
        prompt,
        'Risk assessment and mitigation planning',
        'auto'
      )
      
      const result = this.parseJSONResponse<{ risks: AIRisk[] }>(response)
      return result.risks || []
    } catch (error) {
      console.error('Risk assessment failed:', error)
      return []
    }
  }

  // Private helper methods

  private buildWorkItemAnalysisPrompt(
    description: string, 
    projectContext?: string,
    existingWorkItems?: any[]
  ): string {
    return `You are a senior project manager and technical lead. Analyze this work item request and provide comprehensive planning data.

User Request: "${description}"

${projectContext ? `Project Context: ${projectContext}` : ''}

${existingWorkItems?.length ? `Existing Work Items: ${JSON.stringify(existingWorkItems.slice(0, 5), null, 2)}` : ''}

Return a JSON object with this exact structure:
{
  "title": "Clear, actionable title (under 60 chars)",
  "description": "Enhanced description with context and requirements",
  "type": "FEATURE|BUG|EPIC|STORY|TASK|SUBTASK",
  "priority": "LOW|MEDIUM|HIGH|URGENT|CRITICAL",
  "functionalArea": "SOFTWARE|LEGAL|OPERATIONS|MARKETING",
  "estimatedEffort": "1h|4h|1d|3d|1w|2w",
  "tasks": [
    {
      "id": "task-1",
      "title": "Specific task name",
      "description": "What needs to be done",
      "priority": "MEDIUM",
      "estimatedDuration": "2h",
      "category": "DEVELOPMENT",
      "dependencies": [],
      "acceptance_criteria": ["Criterion 1", "Criterion 2"]
    }
  ],
  "opportunities": [
    {
      "id": "opp-1", 
      "title": "Related opportunity",
      "description": "How this could be enhanced",
      "type": "FEATURE_ENHANCEMENT",
      "impact": "MEDIUM",
      "effort": "LOW",
      "timeline": "Next sprint",
      "potential_value": "Improved user experience"
    }
  ],
  "risks": [
    {
      "id": "risk-1",
      "title": "Potential risk",
      "description": "What could go wrong",
      "severity": "MEDIUM", 
      "probability": "LOW",
      "mitigation_strategy": "How to prevent/handle",
      "impact_areas": ["Development", "Timeline"]
    }
  ],
  "acceptance_criteria": ["Clear success criteria"],
  "technical_considerations": ["Technical requirements and constraints"],
  "business_impact": "Expected business value and impact"
}

Generate 3-6 tasks, 1-3 opportunities, and 1-2 risks. Be specific and actionable. Return only valid JSON.`
  }

  private buildProjectInsightsPrompt(
    projectName: string,
    workItems: any[],
    projectDescription?: string
  ): string {
    return `Analyze this project and provide strategic insights.

Project: ${projectName}
${projectDescription ? `Description: ${projectDescription}` : ''}

Current Work Items:
${JSON.stringify(workItems.slice(0, 10), null, 2)}

Return a JSON object with this structure:
{
  "summary": "Project status summary",
  "key_metrics": {
    "total_tasks": ${workItems.length},
    "completed_tasks": 0,
    "high_priority_tasks": 0,
    "estimated_completion": "2 weeks"
  },
  "opportunities": [
    {
      "id": "opp-1",
      "title": "Optimization opportunity", 
      "description": "How to improve",
      "type": "OPTIMIZATION",
      "impact": "HIGH",
      "effort": "MEDIUM",
      "timeline": "Next month",
      "potential_value": "Expected benefit"
    }
  ],
  "risks": [
    {
      "id": "risk-1",
      "title": "Project risk",
      "description": "Potential issue",
      "severity": "MEDIUM",
      "probability": "MEDIUM", 
      "mitigation_strategy": "How to address",
      "impact_areas": ["Timeline", "Quality"]
    }
  ],
  "recommendations": ["Actionable recommendation 1", "Recommendation 2"],
  "next_actions": [
    {
      "id": "action-1",
      "title": "Immediate action needed",
      "description": "What to do next",
      "priority": "HIGH",
      "estimatedDuration": "1d",
      "category": "PLANNING"
    }
  ]
}

Provide 2-4 opportunities, 1-3 risks, 2-5 recommendations, and 1-3 next actions. Return only valid JSON.`
  }

  private buildFeatureAnalysisPrompt(
    featureDescription: string,
    projectContext: string,
    technicalStack?: string[]
  ): string {
    return `Analyze this feature request and create an implementation strategy.

Feature: "${featureDescription}"
Project Context: ${projectContext}
${technicalStack ? `Tech Stack: ${technicalStack.join(', ')}` : ''}

Return JSON with work item analysis and implementation strategy:
{
  "analysis": {
    // Same structure as work item analysis
  },
  "implementation_strategy": {
    "approach": "Overall implementation approach",
    "phases": [
      {
        "name": "Phase 1",
        "description": "Phase description", 
        "duration": "1w",
        "deliverables": ["Deliverable 1", "Deliverable 2"]
      }
    ],
    "technical_requirements": ["Requirement 1", "Requirement 2"],
    "dependencies": ["Dependency 1", "Dependency 2"]
  }
}

Be comprehensive but practical. Return only valid JSON.`
  }

  private buildOpportunitiesPrompt(
    projectName: string,
    currentWorkItems: any[],
    businessGoals?: string[]
  ): string {
    return `Identify opportunities for this project.

Project: ${projectName}
Current Work Items: ${JSON.stringify(currentWorkItems.slice(0, 8), null, 2)}
${businessGoals ? `Business Goals: ${businessGoals.join(', ')}` : ''}

Return JSON:
{
  "opportunities": [
    {
      "id": "opp-1",
      "title": "Opportunity title",
      "description": "Detailed description",
      "type": "OPTIMIZATION|FEATURE_ENHANCEMENT|TECHNICAL_DEBT|PROCESS_IMPROVEMENT|MARKET_OPPORTUNITY",
      "impact": "LOW|MEDIUM|HIGH",
      "effort": "LOW|MEDIUM|HIGH", 
      "timeline": "Time estimate",
      "potential_value": "Expected value"
    }
  ]
}

Identify 3-6 opportunities. Focus on realistic, actionable opportunities. Return only valid JSON.`
  }

  private buildRiskAssessmentPrompt(
    context: string,
    scope: 'PROJECT' | 'WORK_ITEM',
    workItems?: any[]
  ): string {
    return `Assess risks for this ${scope.toLowerCase()}.

Context: ${context}
${workItems ? `Work Items: ${JSON.stringify(workItems.slice(0, 5), null, 2)}` : ''}

Return JSON:
{
  "risks": [
    {
      "id": "risk-1",
      "title": "Risk title",
      "description": "Risk description",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "probability": "LOW|MEDIUM|HIGH",
      "mitigation_strategy": "How to mitigate",
      "impact_areas": ["Area 1", "Area 2"]
    }
  ]
}

Identify 2-5 key risks. Be specific about mitigation strategies. Return only valid JSON.`
  }

  private parseJSONResponse<T>(response: string): T {
    try {
      // Clean up common AI response formatting
      const cleaned = response
        .replace(/```json\n?|\n?```/g, '')
        .replace(/^[\s\S]*?(\{[\s\S]*\})[\s\S]*?$/g, '$1')
        .trim()
      
      return JSON.parse(cleaned)
    } catch (error) {
      console.error('Failed to parse AI JSON response:', error)
      console.error('Raw response:', response)
      throw new Error('Invalid JSON response from AI')
    }
  }

  private isValidWorkItemAnalysis(obj: any): obj is AIWorkItemAnalysis {
    return (
      obj &&
      typeof obj.title === 'string' &&
      typeof obj.description === 'string' &&
      ['FEATURE', 'BUG', 'EPIC', 'STORY', 'TASK', 'SUBTASK'].includes(obj.type) &&
      ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'].includes(obj.priority) &&
      ['SOFTWARE', 'LEGAL', 'OPERATIONS', 'MARKETING'].includes(obj.functionalArea) &&
      Array.isArray(obj.tasks) &&
      Array.isArray(obj.opportunities) &&
      Array.isArray(obj.risks)
    )
  }

  private isValidProjectInsights(obj: any): obj is ProjectInsights {
    return (
      obj &&
      typeof obj.summary === 'string' &&
      obj.key_metrics &&
      Array.isArray(obj.opportunities) &&
      Array.isArray(obj.risks) &&
      Array.isArray(obj.recommendations) &&
      Array.isArray(obj.next_actions)
    )
  }

  private createFallbackAnalysis(description: string): AIWorkItemAnalysis {
    return {
      title: description.split('.')[0].substring(0, 60),
      description: `${description}\n\n**Note:** Generated with fallback analysis.`,
      type: 'TASK',
      priority: 'MEDIUM',
      functionalArea: 'SOFTWARE',
      estimatedEffort: '1d',
      tasks: [
        {
          id: 'task-1',
          title: 'Analyze requirements',
          description: 'Break down and understand the requirements',
          priority: 'HIGH',
          estimatedDuration: '2h',
          category: 'PLANNING',
          acceptance_criteria: ['Requirements are clearly defined']
        },
        {
          id: 'task-2', 
          title: 'Implement solution',
          description: 'Build the requested functionality',
          priority: 'HIGH',
          estimatedDuration: '6h',
          category: 'DEVELOPMENT',
          acceptance_criteria: ['Solution works as expected']
        }
      ],
      opportunities: [],
      risks: [{
        id: 'risk-1',
        title: 'Unclear requirements',
        description: 'Requirements may need clarification',
        severity: 'MEDIUM',
        probability: 'MEDIUM',
        mitigation_strategy: 'Schedule requirements review session',
        impact_areas: ['Timeline', 'Quality']
      }],
      acceptance_criteria: ['Work is completed successfully'],
      technical_considerations: ['Follow existing code patterns'],
      business_impact: 'To be determined'
    }
  }

  private createFallbackInsights(workItems: any[]): ProjectInsights {
    const completed = workItems.filter(item => item.status === 'COMPLETED').length
    const highPriority = workItems.filter(item => ['HIGH', 'URGENT', 'CRITICAL'].includes(item.priority)).length
    
    return {
      summary: 'Project analysis completed with basic metrics',
      key_metrics: {
        total_tasks: workItems.length,
        completed_tasks: completed,
        high_priority_tasks: highPriority,
        estimated_completion: '2-3 weeks'
      },
      opportunities: [],
      risks: [],
      recommendations: ['Review and prioritize work items', 'Define clear success criteria'],
      next_actions: []
    }
  }
}

// Singleton instance
export const structuredAI = new StructuredAIProvider()

// Convenience functions
export async function analyzeWorkItemWithAI(
  description: string,
  projectContext?: string,
  existingWorkItems?: any[]
): Promise<AIWorkItemAnalysis> {
  return structuredAI.analyzeWorkItem(description, projectContext, existingWorkItems)
}

export async function generateProjectInsights(
  projectName: string,
  workItems: any[],
  projectDescription?: string
): Promise<ProjectInsights> {
  return structuredAI.generateProjectInsights(projectName, workItems, projectDescription)
}