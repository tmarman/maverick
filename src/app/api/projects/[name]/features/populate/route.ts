import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { analyzeWorkItemWithAI } from '@/lib/structured-ai-provider'
import { randomUUID } from 'crypto'
import * as fs from 'fs/promises'
import * as path from 'path'

/**
 * Populate existing Maverick features into structured AI format
 * This helps us understand our current feature set and production requirements
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const projectName = resolvedParams.name.toLowerCase()

    // Define our existing Maverick features
    const existingFeatures = await getExistingMaverickFeatures()
    
    const analysisResults = []
    const createdWorkItems = []

    // Process each feature through our AI analysis
    for (const feature of existingFeatures) {
      try {
        console.log(`Processing feature: ${feature.title}`)
        
        // Use our structured AI to analyze the feature
        const aiAnalysis = await analyzeWorkItemWithAI(
          feature.description,
          `Maverick Platform - ${feature.category}`,
          []
        )

        // Create work item with unique ID
        const workItemId = randomUUID()
        const timestamp = new Date().toISOString()
        
        const workItem = {
          id: workItemId,
          title: aiAnalysis.title,
          description: aiAnalysis.description,
          type: feature.type,
          status: feature.status,
          priority: aiAnalysis.priority,
          functionalArea: 'SOFTWARE',
          parentId: null,
          orderIndex: Date.now() + analysisResults.length,
          depth: 0,
          estimatedEffort: aiAnalysis.estimatedEffort,
          projectName,
          assignedToId: null,
          createdAt: timestamp,
          updatedAt: timestamp,
          // Enhanced with AI analysis
          aiTasks: aiAnalysis.tasks,
          aiOpportunities: aiAnalysis.opportunities,
          aiRisks: aiAnalysis.risks,
          acceptanceCriteria: aiAnalysis.acceptance_criteria,
          technicalConsiderations: aiAnalysis.technical_considerations,
          businessImpact: aiAnalysis.business_impact,
          // Original feature metadata
          originalFeature: feature
        }

        // Generate structured markdown
        const markdownContent = await generateFeatureMarkdown(aiAnalysis, workItem, feature)
        
        // Save to project
        await saveWorkItemToMarkdown(projectName, workItemId, markdownContent)
        
        analysisResults.push(aiAnalysis)
        createdWorkItems.push(workItem)
        
        // Add small delay to avoid overwhelming AI providers
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`Error processing feature ${feature.title}:`, error)
      }
    }

    // Create summary insights
    const summaryInsights = await generateSummaryInsights(analysisResults, existingFeatures)

    return NextResponse.json({
      success: true,
      featuresProcessed: existingFeatures.length,
      workItemsCreated: createdWorkItems.length,
      analysisResults,
      summaryInsights,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error populating features:', error)
    return NextResponse.json(
      { error: 'Failed to populate features' },
      { status: 500 }
    )
  }
}

async function getExistingMaverickFeatures() {
  return [
    {
      title: "Project Canvas & Work Item Management",
      description: "Visual project canvas where users can create, organize and manage work items (features, bugs, tasks). Includes AI-powered smart creation, drag-and-drop organization by stages (Plan, Execute, Review, Complete), and detailed work item sidebar with subtasks and planning.",
      category: "Project Management", 
      type: "FEATURE",
      status: "ACTIVE",
      components: ["SimpleWorkItemCanvas", "WorkItemDetailSidebar", "WorkItemManager"],
      files: [
        "src/components/SimpleWorkItemCanvas.tsx",
        "src/components/WorkItemDetailSidebar.tsx", 
        "src/app/api/projects/[name]/work-items/"
      ]
    },
    {
      title: "AI-Powered Work Item Analysis",
      description: "Structured AI integration using Claude/Gemini that analyzes user input and creates comprehensive work items with tasks, opportunities, risks, acceptance criteria, and technical considerations. Returns structured JSON for better integration.",
      category: "AI & Automation",
      type: "FEATURE", 
      status: "ACTIVE",
      components: ["StructuredAIProvider"],
      files: [
        "src/lib/structured-ai-provider.ts",
        "src/lib/ai-provider.ts",
        "src/app/api/projects/[name]/work-items/smart-create/"
      ]
    },
    {
      title: "GitHub Repository Integration",
      description: "Import repositories from GitHub, manage project-repository connections, create worktrees for features, and integrate with git-based project architecture. Includes pagination and repository selection.",
      category: "Version Control",
      type: "FEATURE",
      status: "ACTIVE", 
      components: ["GitHubRepositorySelector", "WorktreeManager"],
      files: [
        "src/components/GitHubRepositorySelector.tsx",
        "src/components/WorktreeManager.tsx",
        "src/app/cockpit/repositories/",
        "src/app/api/github/"
      ]
    },
    {
      title: "Project-Based Navigation & Routing",
      description: "Hierarchical project navigation with proper URL routing, project-specific sidebars, and consistent cockpit shell interface. Supports project overview, tasks, code, deployments, team, and analytics views.",
      category: "UI/UX",
      type: "FEATURE",
      status: "ACTIVE",
      components: ["ProjectSidebar", "CockpitShell"],
      files: [
        "src/components/ProjectSidebar.tsx",
        "src/components/CockpitShell.tsx", 
        "src/app/app/projects/[name]/"
      ]
    },
    {
      title: "Markdown-Based Work Item Storage",
      description: "Git-native project architecture where work items are stored as markdown files in project folders. Includes frontmatter metadata, AI-generated content, and file-based indexing for fast UI loading.",
      category: "Data Architecture",
      type: "FEATURE",
      status: "ACTIVE",
      components: ["WorkItem Storage System"],
      files: [
        "src/app/api/projects/[name]/work-items/route.ts",
        "projects/{projectName}/work-items/{workItemId}.md"
      ]
    },
    {
      title: "Claude Code Terminal Integration", 
      description: "WebSocket-based terminal interface for Claude Code CLI integration, persistent sessions, and real-time AI development assistance within project contexts.",
      category: "AI & Development",
      type: "FEATURE",
      status: "ACTIVE",
      components: ["ClaudeCodeTerminal"],
      files: [
        "src/components/ClaudeCodeTerminal.tsx",
        "src/app/api/claude-code/",
        "server.js"
      ]
    },
    {
      title: "Business Formation Workflow",
      description: "Automated LLC/Corp creation workflow with legal document generation, Square integration for business accounts, and guided business setup process.",
      category: "Business Formation",
      type: "FEATURE", 
      status: "ACTIVE",
      components: ["Formation Wizard"],
      files: [
        "src/app/api/formation/",
        "src/components/SquarePaymentForm.tsx"
      ]
    },
    {
      title: "Document Canvas & Collaboration",
      description: "Visual collaboration interface for requirements gathering, document creation, and project planning with real-time collaboration features.",
      category: "Collaboration",
      type: "FEATURE",
      status: "ACTIVE", 
      components: ["DocumentCanvas"],
      files: [
        "src/components/DocumentCanvas.tsx",
        "src/app/api/documents/"
      ]
    },
    {
      title: "Multi-AI Provider System",
      description: "Flexible AI provider system supporting Claude Code, Gemini, and automatic fallback. Includes conversation history, project context, and provider health monitoring.",
      category: "AI & Automation",
      type: "FEATURE",
      status: "ACTIVE",
      components: ["MultiAIProvider"],
      files: [
        "src/lib/ai-provider.ts"
      ]
    },
    {
      title: "Presentation Generator",
      description: "AI-powered presentation generation for business pitches, project overviews, and stakeholder communications.",
      category: "Content Generation", 
      type: "FEATURE",
      status: "ACTIVE",
      components: ["PresentationGenerator"],
      files: [
        "src/components/PresentationGenerator.tsx",
        "src/app/api/presentations/"
      ]
    },
    {
      title: "Authentication & Session Management",
      description: "NextAuth.js integration with magic link authentication, session persistence, and user profile management.",
      category: "Authentication",
      type: "FEATURE",
      status: "ACTIVE",
      components: ["Auth System"],
      files: [
        "src/lib/auth.ts",
        "src/app/api/auth/"
      ]
    },
    {
      title: "Project Insights & Analytics",
      description: "AI-powered project analysis providing insights, opportunities, risks, and recommendations based on current project state and work items.",
      category: "Analytics & Insights",
      type: "FEATURE",
      status: "ACTIVE",
      components: ["Project Insights API"],
      files: [
        "src/app/api/projects/[name]/insights/route.ts"
      ]
    }
  ]
}

async function generateFeatureMarkdown(aiAnalysis: any, workItem: any, originalFeature: any): Promise<string> {
  const dateFormatted = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return `---
id: ${workItem.id}
title: "${aiAnalysis.title}"
type: ${workItem.type}
status: ${workItem.status}
priority: ${aiAnalysis.priority}
functionalArea: ${workItem.functionalArea}
estimatedEffort: "${aiAnalysis.estimatedEffort}"
category: "${originalFeature.category}"
businessImpact: "${aiAnalysis.business_impact}"
createdAt: ${workItem.createdAt}
updatedAt: ${workItem.updatedAt}
isExistingFeature: true
---

# ${aiAnalysis.title}

## 📋 Description
${aiAnalysis.description}

**Original Feature Category:** ${originalFeature.category}
**Components:** ${originalFeature.components?.join(', ') || 'N/A'}
**Key Files:** ${originalFeature.files?.join(', ') || 'N/A'}

## 🏷️ Classification
- **Type:** ${workItem.type}
- **Priority:** ${aiAnalysis.priority}
- **Functional Area:** ${workItem.functionalArea}
- **Estimated Effort:** ${aiAnalysis.estimatedEffort}
- **Business Impact:** ${aiAnalysis.business_impact}
- **Current Status:** ${workItem.status}

## ✅ AI-Generated Tasks

${aiAnalysis.tasks.map((task: any, index: number) => `### ${index + 1}. ${task.title}
**Priority:** ${task.priority} | **Duration:** ${task.estimatedDuration} | **Category:** ${task.category}

${task.description}

${task.acceptance_criteria && task.acceptance_criteria.length > 0 ? `**Acceptance Criteria:**
${task.acceptance_criteria.map((criteria: string) => `- ${criteria}`).join('\n')}` : ''}
`).join('\n')}

## 🚀 Identified Opportunities

${aiAnalysis.opportunities.length > 0 ? aiAnalysis.opportunities.map((opp: any) => `### ${opp.title}
**Type:** ${opp.type} | **Impact:** ${opp.impact} | **Effort:** ${opp.effort} | **Timeline:** ${opp.timeline}

${opp.description}

**Potential Value:** ${opp.potential_value}
`).join('\n') : '_No specific opportunities identified._'}

## ⚠️ Potential Risks

${aiAnalysis.risks.length > 0 ? aiAnalysis.risks.map((risk: any) => `### ${risk.title}
**Severity:** ${risk.severity} | **Probability:** ${risk.probability}

${risk.description}

**Impact Areas:** ${risk.impact_areas.join(', ')}
**Mitigation Strategy:** ${risk.mitigation_strategy}
`).join('\n') : '_No significant risks identified._'}

## 🎯 Acceptance Criteria

${aiAnalysis.acceptance_criteria.map((criteria: string) => `- [ ] ${criteria}`).join('\n')}

## 🔧 Technical Considerations

${aiAnalysis.technical_considerations.map((consideration: string) => `- ${consideration}`).join('\n')}

## 📁 Implementation Details

### Components
${originalFeature.components?.map((comp: string) => `- **${comp}**: React component implementing ${originalFeature.title} functionality`).join('\n') || '_No specific components listed._'}

### Key Files
${originalFeature.files?.map((file: string) => `- \`${file}\``).join('\n') || '_No specific files listed._'}

## 💬 Feature Analysis Notes

### ${dateFormatted}
- Existing Maverick feature analyzed via AI
- Comprehensive planning and risk assessment completed
- Ready for enhancement or production optimization

---

## Metadata
- **Analyzed:** ${dateFormatted}
- **Project:** ${workItem.projectName}
- **Original Category:** ${originalFeature.category}
- **Generated by:** Maverick AI ✨ (Feature Analysis)

> _This is an existing Maverick platform feature analyzed through our structured AI system. The analysis provides insights for production readiness and future enhancements._
`
}

async function saveWorkItemToMarkdown(projectName: string, workItemId: string, markdownContent: string) {
  const workItemsDir = path.join(process.cwd(), 'projects', projectName, 'work-items')
  const filePath = path.join(workItemsDir, `${workItemId}.md`)
  
  await fs.mkdir(workItemsDir, { recursive: true })
  await fs.writeFile(filePath, markdownContent, 'utf-8')
}

async function generateSummaryInsights(analysisResults: any[], existingFeatures: any[]) {
  const totalTasks = analysisResults.reduce((sum, analysis) => sum + analysis.tasks.length, 0)
  const totalOpportunities = analysisResults.reduce((sum, analysis) => sum + analysis.opportunities.length, 0)
  const totalRisks = analysisResults.reduce((sum, analysis) => sum + analysis.risks.length, 0)
  
  const categoryCounts = existingFeatures.reduce((acc, feature) => {
    acc[feature.category] = (acc[feature.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return {
    totalFeatures: existingFeatures.length,
    totalTasks,
    totalOpportunities, 
    totalRisks,
    categoryBreakdown: categoryCounts,
    productionReadiness: {
      coreFeatures: existingFeatures.filter(f => f.status === 'ACTIVE').length,
      needsWork: analysisResults.filter(a => a.risks.some((r: any) => r.severity === 'HIGH' || r.severity === 'CRITICAL')).length,
      enhancementOpportunities: totalOpportunities,
      technicalDebt: analysisResults.filter(a => a.opportunities.some((o: any) => o.type === 'TECHNICAL_DEBT')).length
    },
    recommendations: [
      'Review high-severity risks identified in feature analysis',
      'Prioritize opportunities with high impact and low effort',
      'Consolidate technical debt items into dedicated sprints',
      'Create comprehensive test coverage for production features'
    ]
  }
}