import { generateAIResponse } from './ai-provider'
import { githubWorktreeService, WorktreeInfo } from './github-worktree-service'
import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'

export interface FeatureRequest {
  featureName: string
  description: string
  repositoryPath: string
  requirements?: string[]
  acceptanceCriteria?: string[]
}

export interface FeatureDevelopmentResult {
  success: boolean
  worktree: WorktreeInfo
  filesModified: string[]
  commitMessage: string
  branchName: string
  summary: string
  error?: string
}

export class FeatureDevelopmentService {
  
  /**
   * Develop a complete feature using AI in an isolated worktree
   */
  async developFeature(
    request: FeatureRequest,
    userId: string
  ): Promise<FeatureDevelopmentResult> {
    try {
      console.log(`🚀 Starting feature development: ${request.featureName}`)

      // Create feature worktree
      const worktree = await githubWorktreeService.createFeatureWorktree(
        request.repositoryPath,
        request.featureName,
        {
          branch: `feature/${this.sanitizeName(request.featureName)}`,
          baseBranch: 'main',
          purpose: 'feature',
          createBranch: true
        }
      )

      console.log(`📁 Created worktree at: ${worktree.path}`)

      // Analyze existing codebase
      const codebaseAnalysis = await this.analyzeCodebase(worktree.path)

      // Generate implementation plan
      const implementationPlan = await this.generateImplementationPlan(
        request,
        codebaseAnalysis
      )

      // Implement the feature using AI
      const implementationResult = await this.implementFeature(
        worktree.path,
        request,
        implementationPlan
      )

      // Commit changes
      const commitResult = await this.commitChanges(
        worktree.path,
        request.featureName,
        implementationResult.summary
      )

      return {
        success: true,
        worktree,
        filesModified: implementationResult.filesModified,
        commitMessage: commitResult.commitMessage,
        branchName: worktree.branch,
        summary: implementationResult.summary
      }

    } catch (error) {
      console.error('Feature development failed:', error)
      return {
        success: false,
        worktree: {} as WorktreeInfo,
        filesModified: [],
        commitMessage: '',
        branchName: '',
        summary: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Analyze the existing codebase to understand structure and patterns
   */
  private async analyzeCodebase(worktreePath: string): Promise<{
    structure: string[]
    technologies: string[]
    patterns: string[]
    suggestions: string[]
  }> {
    try {
      // Get file structure
      const structure = await this.getDirectoryStructure(worktreePath)
      
      // Analyze package.json for technologies
      const technologies = await this.analyzeTechnologies(worktreePath)
      
      // Use AI to analyze patterns and suggest best practices
      const analysisPrompt = `Analyze this codebase structure and provide insights:

Directory Structure:
${structure.join('\n')}

Technologies Detected:
${technologies.join(', ')}

Please provide:
1. Key architectural patterns you observe
2. Coding conventions and style preferences
3. Suggestions for implementing new features consistently
4. Best practices to follow for this codebase

Keep your response concise and actionable.`

      const aiAnalysis = await generateAIResponse(
        analysisPrompt,
        'You are a senior software architect analyzing a codebase for feature development. Provide technical insights and recommendations.',
        'auto'
      )

      return {
        structure,
        technologies,
        patterns: this.extractPatterns(aiAnalysis),
        suggestions: this.extractSuggestions(aiAnalysis)
      }

    } catch (error) {
      console.error('Codebase analysis failed:', error)
      return {
        structure: [],
        technologies: [],
        patterns: [],
        suggestions: []
      }
    }
  }

  /**
   * Generate a detailed implementation plan using AI
   */
  private async generateImplementationPlan(
    request: FeatureRequest,
    analysis: any
  ): Promise<string> {
    const planPrompt = `Create a detailed implementation plan for this feature:

Feature Name: ${request.featureName}
Description: ${request.description}

Requirements:
${request.requirements?.map(r => `- ${r}`).join('\n') || 'No specific requirements provided'}

Acceptance Criteria:
${request.acceptanceCriteria?.map(c => `- ${c}`).join('\n') || 'No specific criteria provided'}

Codebase Context:
- Structure: ${analysis.structure.slice(0, 10).join(', ')}...
- Technologies: ${analysis.technologies.join(', ')}
- Patterns: ${analysis.patterns.join(', ')}

Create a step-by-step implementation plan that:
1. Lists all files that need to be created or modified
2. Describes the changes needed for each file
3. Ensures consistency with existing patterns
4. Follows best practices for this technology stack
5. Includes proper error handling and testing considerations

Be specific and actionable.`

    return await generateAIResponse(
      planPrompt,
      'You are a senior software engineer creating implementation plans. Be detailed, technical, and practical.',
      'auto'
    )
  }

  /**
   * Implement the feature using AI assistance
   */
  private async implementFeature(
    worktreePath: string,
    request: FeatureRequest,
    plan: string
  ): Promise<{
    filesModified: string[]
    summary: string
  }> {
    const filesModified: string[] = []

    // Implementation prompt for AI
    const implementationPrompt = `Implement this feature according to the plan:

Feature: ${request.featureName}
Description: ${request.description}
Working Directory: ${worktreePath}

Implementation Plan:
${plan}

Please provide:
1. Complete code for each file that needs to be created/modified
2. Clear file paths relative to the working directory
3. Brief explanation of each change
4. Any additional setup or configuration needed

Format your response with clear file sections like:
## File: src/components/NewComponent.tsx
[code content]

## File: src/lib/newService.ts
[code content]

Focus on clean, maintainable code that follows the existing patterns.`

    const implementationResponse = await generateAIResponse(
      implementationPrompt,
      'You are a senior software engineer implementing features. Write clean, production-ready code with proper error handling.',
      'auto'
    )

    // Parse the AI response and extract file contents
    const fileBlocks = this.parseFileBlocks(implementationResponse)
    
    // Write files to the worktree
    for (const block of fileBlocks) {
      const filePath = path.join(worktreePath, block.filePath)
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true })
      
      // Write file content
      await fs.writeFile(filePath, block.content)
      filesModified.push(block.filePath)
      
      console.log(`📝 Created/modified: ${block.filePath}`)
    }

    return {
      filesModified,
      summary: `Implemented ${request.featureName}: ${request.description}. Modified ${filesModified.length} files.`
    }
  }

  /**
   * Commit changes to the feature branch
   */
  private async commitChanges(
    worktreePath: string,
    featureName: string,
    summary: string
  ): Promise<{ commitMessage: string }> {
    const commitMessage = `feat: ${featureName.toLowerCase()}

${summary}

🚀 Created with Maverick`

    // Stage all changes
    await this.executeGitCommand(['add', '.'], worktreePath)
    
    // Commit changes
    await this.executeGitCommand([
      'commit',
      '-m',
      commitMessage
    ], worktreePath)

    console.log('✅ Changes committed to feature branch')

    return { commitMessage }
  }

  /**
   * Utility functions
   */
  private async getDirectoryStructure(dirPath: string): Promise<string[]> {
    const structure: string[] = []
    
    async function walk(currentPath: string, prefix = '') {
      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true })
        
        for (const entry of entries) {
          if (entry.name.startsWith('.')) continue // Skip hidden files
          
          const fullPath = path.join(currentPath, entry.name)
          const relativePath = path.relative(dirPath, fullPath)
          
          if (entry.isDirectory()) {
            structure.push(`${prefix}📁 ${relativePath}/`)
            if (structure.length < 50) { // Limit depth
              await walk(fullPath, prefix + '  ')
            }
          } else {
            structure.push(`${prefix}📄 ${relativePath}`)
          }
        }
      } catch (error) {
        // Ignore access errors
      }
    }
    
    await walk(dirPath)
    return structure
  }

  private async analyzeTechnologies(worktreePath: string): Promise<string[]> {
    const technologies: string[] = []
    
    try {
      // Check package.json
      const packageJsonPath = path.join(worktreePath, 'package.json')
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
      
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      }
      
      // Identify key technologies
      if (allDeps.react) technologies.push('React')
      if (allDeps.next) technologies.push('Next.js')
      if (allDeps.typescript) technologies.push('TypeScript')
      if (allDeps.tailwindcss) technologies.push('Tailwind CSS')
      if (allDeps.prisma) technologies.push('Prisma')
      if (allDeps['next-auth']) technologies.push('NextAuth.js')
      
    } catch (error) {
      // Package.json not found or invalid
    }
    
    return technologies
  }

  private extractPatterns(aiResponse: string): string[] {
    // Extract architectural patterns from AI response
    const lines = aiResponse.split('\n')
    const patterns: string[] = []
    
    for (const line of lines) {
      if (line.toLowerCase().includes('pattern') || 
          line.toLowerCase().includes('architecture') ||
          line.toLowerCase().includes('convention')) {
        patterns.push(line.trim())
      }
    }
    
    return patterns.slice(0, 5) // Limit to top 5
  }

  private extractSuggestions(aiResponse: string): string[] {
    // Extract suggestions from AI response
    const lines = aiResponse.split('\n')
    const suggestions: string[] = []
    
    for (const line of lines) {
      if (line.toLowerCase().includes('suggest') || 
          line.toLowerCase().includes('recommend') ||
          line.toLowerCase().includes('should')) {
        suggestions.push(line.trim())
      }
    }
    
    return suggestions.slice(0, 5) // Limit to top 5
  }

  private parseFileBlocks(response: string): { filePath: string; content: string }[] {
    const blocks: { filePath: string; content: string }[] = []
    const lines = response.split('\n')
    
    let currentFile: string | null = null
    let currentContent: string[] = []
    
    for (const line of lines) {
      // Look for file headers like "## File: src/components/Component.tsx"
      const fileMatch = line.match(/##\s*File:\s*(.+)/)
      if (fileMatch) {
        // Save previous file if exists
        if (currentFile && currentContent.length > 0) {
          blocks.push({
            filePath: currentFile,
            content: currentContent.join('\n').trim()
          })
        }
        
        // Start new file
        currentFile = fileMatch[1].trim()
        currentContent = []
      } else if (currentFile) {
        // Add line to current file content
        currentContent.push(line)
      }
    }
    
    // Save last file
    if (currentFile && currentContent.length > 0) {
      blocks.push({
        filePath: currentFile,
        content: currentContent.join('\n').trim()
      })
    }
    
    return blocks
  }

  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  private async executeGitCommand(args: string[], cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const childProcess = spawn('git', args, { 
        cwd,
        stdio: ['pipe', 'pipe', 'pipe']
      })

      let output = ''
      let error = ''

      childProcess.stdout.on('data', (data) => {
        output += data.toString()
      })

      childProcess.stderr.on('data', (data) => {
        error += data.toString()
      })

      childProcess.on('close', (code) => {
        if (code === 0) {
          resolve(output)
        } else {
          reject(new Error(`Git command failed (${code}): ${error}`))
        }
      })
    })
  }
}

// Singleton instance
export const featureDevelopmentService = new FeatureDevelopmentService()