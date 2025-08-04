import { aiProvider } from '@/lib/ai-provider'

export interface TaskStep {
  id: number
  title: string
  description: string
  deliverable: string
  exitCriteria: string
  estimatedMinutes: number
  dependencies: number[]
  verificationCommand?: string
  files?: string[]
  testCommand?: string
}

export interface TaskPlan {
  taskId: string
  title: string
  description: string
  steps: TaskStep[]
  totalEstimateMinutes: number
  riskFactors: string[]
  agentType: 'feature-builder' | 'bug-hunter' | 'refactor' | 'documentation'
  complexity: 'simple' | 'medium' | 'complex'
  prerequisites: string[]
  successCriteria: string[]
}

export interface CodebaseContext {
  projectStructure: string[]
  keyFiles: string[]
  techStack: string[]
  testingFramework?: string
  buildCommands: string[]
  dependencies: string[]
}

export class TaskPlanner {
  
  /**
   * Analyze a user requirement and create a detailed execution plan
   */
  async planTask(
    requirement: string,
    context: CodebaseContext,
    userId?: string
  ): Promise<TaskPlan> {
    
    const planningPrompt = this.buildPlanningPrompt(requirement, context)
    
    try {
      console.log(`🧠 Planning task: ${requirement}`)
      
      const response = await aiProvider.execute(planningPrompt, 'claude-code', {
        model: 'claude-3-5-sonnet-20241022',
        maxTokens: 4000,
        temperature: 0.1 // Low temperature for consistent planning
      }, userId)

      const plan = this.parsePlanResponse(response, requirement)
      
      console.log(`📋 Generated plan with ${plan.steps.length} steps (${plan.totalEstimateMinutes}min estimated)`)
      
      return plan
      
    } catch (error) {
      console.error('Task planning failed:', error)
      
      // Fallback to simple plan
      return this.createFallbackPlan(requirement)
    }
  }

  /**
   * Analyze the current codebase to understand structure and context
   */
  async analyzeCodebase(projectPath: string): Promise<CodebaseContext> {
    const fs = require('fs/promises')
    const path = require('path')

    try {
      // Read package.json for dependencies and scripts
      const packageJson = JSON.parse(
        await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8')
      )

      // Get project structure (key directories and files)
      const structure = await this.getProjectStructure(projectPath)
      
      // Identify tech stack from dependencies
      const techStack = this.identifyTechStack(packageJson)
      
      // Find testing framework
      const testingFramework = this.identifyTestingFramework(packageJson)
      
      return {
        projectStructure: structure,
        keyFiles: this.identifyKeyFiles(structure),
        techStack,
        testingFramework,
        buildCommands: Object.keys(packageJson.scripts || {}),
        dependencies: [
          ...Object.keys(packageJson.dependencies || {}),
          ...Object.keys(packageJson.devDependencies || {})
        ]
      }
    } catch (error) {
      console.error('Codebase analysis failed:', error)
      
      // Return minimal context
      return {
        projectStructure: ['src/', 'pages/', 'components/'],
        keyFiles: ['package.json', 'README.md'],
        techStack: ['Next.js', 'React', 'TypeScript'],
        buildCommands: ['build', 'dev', 'test'],
        dependencies: []
      }
    }
  }

  /**
   * Break down a complex task into smaller, manageable steps
   */
  async refineTaskPlan(
    originalPlan: TaskPlan,
    feedback: string,
    userId?: string
  ): Promise<TaskPlan> {
    
    const refinementPrompt = `
ORIGINAL PLAN:
${JSON.stringify(originalPlan, null, 2)}

FEEDBACK:
${feedback}

TASK: Refine the above plan based on the feedback. Maintain the same JSON structure but improve:
1. Step clarity and specificity
2. Better exit criteria
3. More accurate time estimates
4. Address any concerns raised in feedback

Respond with the refined plan in the same JSON format.
`

    try {
      const response = await aiProvider.execute(refinementPrompt, 'claude-code', {
        model: 'claude-3-5-sonnet-20241022',
        maxTokens: 4000,
        temperature: 0.1
      }, userId)

      return this.parsePlanResponse(response, originalPlan.description)
      
    } catch (error) {
      console.error('Plan refinement failed:', error)
      return originalPlan // Return original if refinement fails
    }
  }

  // Private helper methods

  private buildPlanningPrompt(requirement: string, context: CodebaseContext): string {
    return `You are an expert software architect planning a development task. Analyze the requirement and create a detailed, step-by-step execution plan.

REQUIREMENT:
${requirement}

CODEBASE CONTEXT:
- Tech Stack: ${context.techStack.join(', ')}
- Testing Framework: ${context.testingFramework || 'Unknown'}
- Key Files: ${context.keyFiles.join(', ')}
- Available Scripts: ${context.buildCommands.join(', ')}
- Project Structure: ${context.projectStructure.slice(0, 10).join(', ')}

INSTRUCTIONS:
1. Break the requirement into 3-8 specific, actionable steps
2. Each step should have a clear deliverable and exit criteria
3. Include verification commands where applicable
4. Estimate time realistically (be conservative)
5. Identify dependencies between steps
6. Assess risks and complexity
7. Determine the most appropriate agent type

RESPOND WITH VALID JSON:
{
  "title": "Brief task title",
  "description": "Detailed description of what we're building",
  "agentType": "feature-builder|bug-hunter|refactor|documentation",
  "complexity": "simple|medium|complex",
  "steps": [
    {
      "id": 1,
      "title": "Step title",
      "description": "What exactly to do in this step",
      "deliverable": "Concrete output expected",
      "exitCriteria": "How to know this step is complete",
      "estimatedMinutes": 30,
      "dependencies": [],
      "verificationCommand": "npm test",
      "files": ["src/components/NewComponent.tsx"],
      "testCommand": "npm run test:component"
    }
  ],
  "totalEstimateMinutes": 180,
  "riskFactors": ["Database schema changes", "API compatibility"],
  "prerequisites": ["Database running", "API keys configured"],
  "successCriteria": ["Feature works end-to-end", "All tests pass", "Demo recorded"]
}

Focus on:
- Specific, measurable deliverables
- Clear verification steps
- Realistic time estimates
- Proper dependency ordering
- Risk identification`
  }

  private parsePlanResponse(response: string, requirement: string): TaskPlan {
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      
      // Validate required fields
      if (!parsed.steps || !Array.isArray(parsed.steps)) {
        throw new Error('Invalid steps format')
      }

      // Generate task ID
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      return {
        taskId,
        title: parsed.title || requirement.substring(0, 50),
        description: parsed.description || requirement,
        steps: parsed.steps.map((step: any, index: number) => ({
          id: step.id || index + 1,
          title: step.title || `Step ${index + 1}`,
          description: step.description || '',
          deliverable: step.deliverable || 'Completion of step',
          exitCriteria: step.exitCriteria || 'Step is done',
          estimatedMinutes: step.estimatedMinutes || 30,
          dependencies: step.dependencies || [],
          verificationCommand: step.verificationCommand,
          files: step.files || [],
          testCommand: step.testCommand
        })),
        totalEstimateMinutes: parsed.totalEstimateMinutes || 
          parsed.steps.reduce((sum: number, step: any) => sum + (step.estimatedMinutes || 30), 0),
        riskFactors: parsed.riskFactors || [],
        agentType: parsed.agentType || 'feature-builder',
        complexity: parsed.complexity || 'medium',
        prerequisites: parsed.prerequisites || [],
        successCriteria: parsed.successCriteria || ['Task completed']
      }
      
    } catch (error) {
      console.error('Failed to parse plan response:', error)
      console.log('Raw response:', response)
      
      // Return fallback plan
      return this.createFallbackPlan(requirement)
    }
  }

  private createFallbackPlan(requirement: string): TaskPlan {
    const taskId = `task-${Date.now()}-fallback`
    
    return {
      taskId,
      title: requirement.substring(0, 50),
      description: requirement,
      steps: [
        {
          id: 1,
          title: 'Analyze requirement',
          description: 'Understand what needs to be built',
          deliverable: 'Clear understanding of requirements',
          exitCriteria: 'Requirements are documented',
          estimatedMinutes: 30,
          dependencies: []
        },
        {
          id: 2,
          title: 'Implement solution',
          description: 'Build the requested feature',
          deliverable: 'Working implementation',
          exitCriteria: 'Code is written and functional',
          estimatedMinutes: 90,
          dependencies: [1]
        },
        {
          id: 3,
          title: 'Test and verify',
          description: 'Ensure everything works correctly',
          deliverable: 'Verified working feature',
          exitCriteria: 'All tests pass',
          estimatedMinutes: 30,
          dependencies: [2],
          verificationCommand: 'npm test'
        }
      ],
      totalEstimateMinutes: 150,
      riskFactors: ['Unknown complexity', 'Limited context'],
      agentType: 'feature-builder',
      complexity: 'medium',
      prerequisites: [],
      successCriteria: ['Feature implemented', 'Tests pass']
    }
  }

  private async getProjectStructure(projectPath: string): Promise<string[]> {
    const fs = require('fs/promises')
    const path = require('path')
    
    try {
      const items = await fs.readdir(projectPath)
      return items.filter((item: string) => 
        !item.startsWith('.') && 
        !['node_modules', 'dist', 'build'].includes(item)
      )
    } catch (error) {
      return ['src', 'pages', 'components', 'lib', 'public']
    }
  }

  private identifyTechStack(packageJson: any): string[] {
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    }
    
    const stack: string[] = []
    
    if (deps['next']) stack.push('Next.js')
    if (deps['react']) stack.push('React')
    if (deps['typescript']) stack.push('TypeScript')
    if (deps['tailwindcss']) stack.push('Tailwind CSS')
    if (deps['prisma']) stack.push('Prisma')
    if (deps['@prisma/client']) stack.push('Prisma')
    
    return stack
  }

  private identifyTestingFramework(packageJson: any): string | undefined {
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    }
    
    if (deps['jest']) return 'Jest'
    if (deps['vitest']) return 'Vitest'
    if (deps['mocha']) return 'Mocha'
    if (deps['cypress']) return 'Cypress'
    if (deps['playwright']) return 'Playwright'
    
    return undefined
  }

  private identifyKeyFiles(structure: string[]): string[] {
    const keyFiles = ['package.json', 'README.md']
    
    if (structure.includes('src')) keyFiles.push('src/')
    if (structure.includes('pages')) keyFiles.push('pages/')
    if (structure.includes('app')) keyFiles.push('app/')
    if (structure.includes('components')) keyFiles.push('components/')
    if (structure.includes('lib')) keyFiles.push('lib/')
    
    return keyFiles
  }
}

// Export singleton instance
export const taskPlanner = new TaskPlanner()