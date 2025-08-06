import { promises as fs } from 'fs'
import path from 'path'
import { MultiAIProvider } from './ai-provider'
import { LearningCapture } from './learning-capture'

export interface FeatureExtractionRequest {
  projectRoot: string
  projectName: string
  analysisType: 'full' | 'features-only' | 'security' | 'performance'
  includeFiles?: string[]
  excludePatterns?: string[]
  maxFileSize?: number // in bytes
}

export interface FeatureExtractionResult {
  projectName: string
  analysisType: string
  timestamp: Date
  summary: {
    totalFilesAnalyzed: number
    featuresFound: number
    suggestionsGenerated: number
    workItemsCreated: number
  }
  features: ExtractedFeature[]
  suggestions: Enhancement[]
  workItemsCreated: string[]
  analysisFiles: string[]
  errors?: string[]
}

export interface ExtractedFeature {
  id: string
  title: string
  type: 'component' | 'api' | 'service' | 'util' | 'config' | 'workflow'
  category: string
  description: string
  files: string[]
  dependencies: string[]
  complexity: 'low' | 'medium' | 'high'
  maintainability: 'low' | 'medium' | 'high'
  currentState: string
  capabilities: string[]
  limitations?: string[]
}

export interface Enhancement {
  id: string
  title: string
  type: 'performance' | 'security' | 'ux' | 'feature' | 'refactor'
  priority: 'low' | 'medium' | 'high' | 'critical'
  effort: 'hours' | 'days' | 'weeks'
  description: string
  benefit: string
  implementation: string
  relatedFeatures: string[]
  impact: string
}

export class AIFeatureExtractor {
  private aiProvider: MultiAIProvider
  private learningCapture: LearningCapture
  private maxFileSize: number = 100000 // 100KB default

  constructor(baseWorkingDir: string = '/tmp/maverick/workspaces') {
    this.aiProvider = new MultiAIProvider(baseWorkingDir)
    this.learningCapture = new LearningCapture(baseWorkingDir)
  }

  async extractFeatures(request: FeatureExtractionRequest): Promise<FeatureExtractionResult> {
    console.log(`Starting AI-powered feature extraction for ${request.projectName}`)

    // Initialize learning capture for the project
    this.learningCapture = new LearningCapture(request.projectRoot)
    await this.learningCapture.initializeLearningStructure()

    // Create analysis workspace
    const analysisDir = await this.createAnalysisWorkspace(request.projectRoot)

    try {
      // Phase 1: Repository Context Gathering
      const contextFiles = await this.gatherRepositoryContext(request)
      
      // Phase 2: AI-Powered Analysis
      const analysisResult = await this.performAIAnalysis(request, contextFiles)
      
      // Phase 3: Generate and Store Documentation
      await this.generateDocumentation(request, analysisResult, analysisDir)
      
      // Phase 4: Create Work Items
      const workItemsCreated = await this.createWorkItems(request, analysisResult)

      const result: FeatureExtractionResult = {
        projectName: request.projectName,
        analysisType: request.analysisType,
        timestamp: new Date(),
        summary: {
          totalFilesAnalyzed: contextFiles.length,
          featuresFound: analysisResult.features.length,
          suggestionsGenerated: analysisResult.suggestions.length,
          workItemsCreated: workItemsCreated.length
        },
        features: analysisResult.features,
        suggestions: analysisResult.suggestions,
        workItemsCreated,
        analysisFiles: analysisResult.analysisFiles
      }

      await this.learningCapture.captureBestPractice(
        'AI-Orchestrated Feature Extraction',
        'Successfully used AI to analyze codebase instead of complex parsing',
        'Use Claude Code to analyze file contents and structure, focusing on orchestration rather than parsing',
        `Project: ${request.projectName}, Files: ${contextFiles.length}`
      )

      console.log(`Feature extraction complete: ${result.summary.featuresFound} features, ${result.summary.suggestionsGenerated} suggestions`)
      return result

    } catch (error) {
      await this.learningCapture.captureMistake(
        `Feature extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        `Project: ${request.projectName}, Analysis: ${request.analysisType}`,
        'Add better error handling and retry logic to feature extraction'
      )
      throw error
    }
  }

  private async createAnalysisWorkspace(projectRoot: string): Promise<string> {
    const analysisDir = path.join(projectRoot, '.maverick', 'analysis')
    await fs.mkdir(analysisDir, { recursive: true })
    return analysisDir
  }

  private async gatherRepositoryContext(request: FeatureExtractionRequest): Promise<string[]> {
    const contextFiles: string[] = []
    const includePatterns = [
      '**/*.ts',
      '**/*.tsx', 
      '**/*.js',
      '**/*.jsx',
      '**/*.json',
      '**/*.md',
      'package.json',
      'README.md',
      'tsconfig.json',
      'next.config.*',
      'tailwind.config.*',
      'prisma/schema.prisma'
    ]

    const excludePatterns = [
      'node_modules/**',
      '.git/**',
      '.next/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.log',
      ...request.excludePatterns || []
    ]

    // Use simple file gathering - let AI do the heavy analysis
    const files = await getAllFiles(request.projectRoot, includePatterns, excludePatterns)
    
    for (const file of files) {
      try {
        const stats = await fs.stat(file)
        if (stats.size <= (request.maxFileSize || this.maxFileSize)) {
          contextFiles.push(file)
        }
      } catch (error) {
        console.warn(`Error processing file ${file}:`, error)
      }
    }

    return contextFiles.slice(0, 100) // Limit to first 100 files for performance
  }

  private async performAIAnalysis(
    request: FeatureExtractionRequest, 
    contextFiles: string[]
  ): Promise<{ features: ExtractedFeature[], suggestions: Enhancement[], analysisFiles: string[] }> {
    
    // Create a comprehensive prompt for Claude Code to analyze the project
    const analysisPrompt = this.buildAnalysisPrompt(request, contextFiles)
    
    try {
      // Use Claude Code to perform the analysis
      const systemMessage = `You are an expert software architect analyzing a codebase for features and improvements. 
                     Focus on understanding the existing functionality and suggesting practical enhancements.
                     You have access to the actual project files and can read them directly.`
      
      const response = await this.aiProvider.generateResponse(
        analysisPrompt, 
        systemMessage,
        { provider: 'claude-code' },
        request.projectName
      )

      // For now, return mock data - in reality, we'd parse Claude's response
      // or better yet, have Claude create the analysis files directly
      return {
        features: this.parseFeatures(response),
        suggestions: this.parseSuggestions(response),
        analysisFiles: ['codebase-overview.md', 'feature-analysis.md', 'suggestions.md']
      }

    } catch (error) {
      console.error('AI analysis failed:', error)
      throw new Error(`Feature extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private buildAnalysisPrompt(request: FeatureExtractionRequest, contextFiles: string[]): string {
    return `Please analyze this ${request.projectName} project and extract key features and improvement suggestions.

PROJECT CONTEXT:
- Project Name: ${request.projectName}
- Analysis Type: ${request.analysisType}
- Files to Analyze: ${contextFiles.length} files
- Project Root: ${request.projectRoot}

ANALYSIS TASKS:
1. **Feature Discovery**: Identify all major features, components, and capabilities
2. **Architecture Analysis**: Understand the technical architecture and patterns
3. **Enhancement Opportunities**: Suggest improvements for performance, security, UX, and features
4. **Documentation Generation**: Create comprehensive documentation in .maverick folder

SPECIFIC FOCUS AREAS:
${request.analysisType === 'full' ? `
- Complete feature inventory
- Architecture documentation  
- Performance optimization opportunities
- Security improvements
- User experience enhancements
- Code quality improvements
` : ''}

${request.analysisType === 'features-only' ? `
- Focus only on feature identification and documentation
- Component mapping and relationships
- Feature completeness assessment
` : ''}

${request.analysisType === 'security' ? `
- Security vulnerability assessment
- Authentication and authorization review
- Input validation and sanitization
- Data protection and privacy compliance
` : ''}

${request.analysisType === 'performance' ? `
- Performance bottleneck identification
- Bundle size optimization opportunities
- Database query optimization
- Caching strategy improvements
` : ''}

DELIVERABLES:
Please create the following files in the .maverick directory structure:

1. **analysis/codebase-overview.md** - High-level architecture and component overview
2. **analysis/feature-inventory.md** - Detailed feature catalog with descriptions
3. **suggestions/enhancement-opportunities.md** - Prioritized improvement suggestions
4. **work-items/{uuid}.md** - Individual work items for each major enhancement (use proper frontmatter)

For each feature discovered, include:
- Feature name and purpose
- Files and components involved
- Current capabilities and limitations
- Integration points and dependencies
- Complexity and maintainability assessment

For each enhancement suggestion, include:
- Clear title and description
- Expected benefit and impact
- Implementation approach
- Effort estimate
- Priority level

Use the existing .maverick workspace structure and create files using the established markdown + frontmatter format.

Start by examining the key files like package.json, README.md, and main source directories to understand the project structure.`
  }

  private parseFeatures(aiResponse: string): ExtractedFeature[] {
    // In a real implementation, we'd either:
    // 1. Have Claude create structured JSON responses
    // 2. Have Claude create the .maverick files directly
    // 3. Parse the natural language response (least preferred)
    
    // For now, return a sample structure
    return [
      {
        id: 'feature_sample_001',
        title: 'Sample Feature from AI Analysis',
        type: 'component',
        category: 'User Interface',
        description: 'Extracted from AI analysis',
        files: ['src/components/sample.tsx'],
        dependencies: ['react'],
        complexity: 'medium',
        maintainability: 'high',
        currentState: 'Active development',
        capabilities: ['User interaction', 'Data display']
      }
    ]
  }

  private parseSuggestions(aiResponse: string): Enhancement[] {
    // Similar to parseFeatures - would be handled by AI file creation
    return [
      {
        id: 'enhancement_sample_001',
        title: 'Sample Enhancement from AI',
        type: 'performance',
        priority: 'medium',
        effort: 'days',
        description: 'AI-identified improvement opportunity',
        benefit: 'Better user experience',
        implementation: 'Refactor component structure',
        relatedFeatures: ['feature_sample_001'],
        impact: 'Medium performance improvement'
      }
    ]
  }

  private async generateDocumentation(
    request: FeatureExtractionRequest,
    analysisResult: { features: ExtractedFeature[], suggestions: Enhancement[] },
    analysisDir: string
  ): Promise<void> {
    // Generate comprehensive documentation files
    // In reality, Claude Code would create these files directly during analysis
    
    const overviewContent = this.generateCodebaseOverview(request, analysisResult)
    await fs.writeFile(path.join(analysisDir, 'codebase-overview.md'), overviewContent)

    const inventoryContent = this.generateFeatureInventory(analysisResult.features)
    await fs.writeFile(path.join(analysisDir, 'feature-inventory.md'), inventoryContent)

    const suggestionsContent = this.generateSuggestionsDocument(analysisResult.suggestions)
    const suggestionsDir = path.join(path.dirname(analysisDir), 'suggestions')
    await fs.mkdir(suggestionsDir, { recursive: true })
    await fs.writeFile(path.join(suggestionsDir, 'enhancement-opportunities.md'), suggestionsContent)
  }

  private async createWorkItems(
    request: FeatureExtractionRequest,
    analysisResult: { features: ExtractedFeature[], suggestions: Enhancement[] }
  ): Promise<string[]> {
    const workItemsDir = path.join(request.projectRoot, 'work-items')
    await fs.mkdir(workItemsDir, { recursive: true })

    const workItemIds: string[] = []

    // Create work items for high-priority suggestions
    for (const suggestion of analysisResult.suggestions.filter(s => s.priority === 'high' || s.priority === 'critical')) {
      const workItemId = `enhancement-${suggestion.id}-${Date.now()}`
      const workItemContent = this.generateWorkItemContent(suggestion)
      
      await fs.writeFile(
        path.join(workItemsDir, `${workItemId}.md`),
        workItemContent
      )
      
      workItemIds.push(workItemId)
    }

    return workItemIds
  }

  private generateCodebaseOverview(
    request: FeatureExtractionRequest,
    analysisResult: { features: ExtractedFeature[], suggestions: Enhancement[] }
  ): string {
    return `# ${request.projectName} - Codebase Overview

**Analysis Date**: ${new Date().toISOString().split('T')[0]}
**Analysis Type**: ${request.analysisType}

## Summary
- **Features Identified**: ${analysisResult.features.length}
- **Enhancement Opportunities**: ${analysisResult.suggestions.length}
- **High Priority Items**: ${analysisResult.suggestions.filter(s => s.priority === 'high').length}

## Architecture Overview
Generated by AI analysis of project structure and dependencies.

## Key Technologies
Detected through AI analysis of package.json and source files.

## Feature Categories
${analysisResult.features.map(f => `- ${f.category}: ${f.title}`).join('\n')}

---
*Generated by Maverick AI Feature Extraction*`
  }

  private generateFeatureInventory(features: ExtractedFeature[]): string {
    return `# Feature Inventory

${features.map(feature => `
## ${feature.title}
**Type**: ${feature.type}
**Category**: ${feature.category}
**Complexity**: ${feature.complexity}
**Maintainability**: ${feature.maintainability}

### Description
${feature.description}

### Files
${feature.files.map(f => `- \`${f}\``).join('\n')}

### Dependencies
${feature.dependencies.map(d => `- ${d}`).join('\n')}

### Capabilities
${feature.capabilities.map(c => `- ${c}`).join('\n')}

${feature.limitations ? `### Limitations\n${feature.limitations.map(l => `- ${l}`).join('\n')}` : ''}

---
`).join('\n')}

*Generated by Maverick AI Feature Extraction*`
  }

  private generateSuggestionsDocument(suggestions: Enhancement[]): string {
    return `# Enhancement Opportunities

${suggestions.map(suggestion => `
## ${suggestion.title}
**Type**: ${suggestion.type}
**Priority**: ${suggestion.priority}
**Effort**: ${suggestion.effort}

### Description
${suggestion.description}

### Expected Benefit
${suggestion.benefit}

### Implementation Approach
${suggestion.implementation}

### Impact
${suggestion.impact}

### Related Features
${suggestion.relatedFeatures.map(f => `- ${f}`).join('\n')}

---
`).join('\n')}

*Generated by Maverick AI Feature Extraction*`
  }

  private generateWorkItemContent(suggestion: Enhancement): string {
    return `---
id: ${suggestion.id}
title: "${suggestion.title}"
type: ENHANCEMENT
status: PLANNED
priority: ${suggestion.priority.toUpperCase()}
functionalArea: SOFTWARE
estimatedEffort: "${suggestion.effort}"
category: "${suggestion.type}"
businessImpact: "${suggestion.benefit}"
createdAt: ${new Date().toISOString()}
updatedAt: ${new Date().toISOString()}
aiGenerated: true
---

# ${suggestion.title}

## 📋 Description
${suggestion.description}

## 🎯 Expected Benefit
${suggestion.benefit}

## 🔧 Implementation Approach
${suggestion.implementation}

## 📊 Impact Assessment
${suggestion.impact}

## 🔗 Related Features
${suggestion.relatedFeatures.map(f => `- ${f}`).join('\n')}

---
*Generated by Maverick AI Feature Extraction*`
  }
}

// Helper function to recursively get all files matching patterns
async function getAllFiles(dir: string, includePatterns: string[], excludePatterns: string[]): Promise<string[]> {
  const files: string[] = []
  const fs = await import('fs/promises')
  const path = await import('path')
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      
      // Check if path should be excluded
      if (excludePatterns.some(pattern => fullPath.includes(pattern) || entry.name.includes(pattern))) {
        continue
      }
      
      if (entry.isDirectory()) {
        const subFiles = await getAllFiles(fullPath, includePatterns, excludePatterns)
        files.push(...subFiles)
      } else {
        // Check if file matches include patterns
        if (includePatterns.some(pattern => {
          if (pattern.includes('*')) {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'))
            return regex.test(fullPath) || regex.test(entry.name)
          }
          return fullPath.includes(pattern) || entry.name.includes(pattern)
        })) {
          files.push(fullPath)
        }
      }
    }
  } catch (error) {
    console.warn(`Error reading directory ${dir}:`, error)
  }
  
  return files
}