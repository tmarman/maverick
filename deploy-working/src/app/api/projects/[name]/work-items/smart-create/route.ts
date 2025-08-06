import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { randomUUID } from 'crypto'
import * as fs from 'fs/promises'
import * as path from 'path'
import { analyzeWorkItemWithAI } from '@/lib/structured-ai-provider'
import { generateAIResponse } from '@/lib/ai-provider'
import { 
  withErrorHandling, 
  extractErrorContext, 
  logInfo, 
  logError,
  Validators,
  ErrorCodes,
  MaverickError,
  withRetry
} from '@/lib/error-handling'

async function smartCreateHandler(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
): Promise<NextResponse> {
  const context = extractErrorContext(request, { endpoint: '/api/projects/[name]/work-items/smart-create' })
  const startTime = Date.now()
  
  logInfo('Smart Create API Request started', context, {
    url: request.url,
    method: request.method
  })
  
  // Authentication check
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    throw new MaverickError({
      message: 'Authentication required',
      code: ErrorCodes.UNAUTHORIZED,
      statusCode: 401,
      context
    })
  }
  
  // Update context with user info
  const userContext = { ...context, userId: session.user.id }
  logInfo('Authentication successful', userContext, { 
    userEmail: session.user.email,
    userId: session.user.id 
  })

  // Parse and validate parameters
  const resolvedParams = await params
  Validators.required(resolvedParams.name, 'project name')
  Validators.string(resolvedParams.name, 'project name')
  Validators.projectName(resolvedParams.name.toLowerCase())
  
  const projectName = resolvedParams.name.toLowerCase()
  const projectContext = { ...userContext, projectId: projectName }
  
  logInfo('Project name resolved', projectContext)
  
  // Parse and validate request body
  const body = await request.json()
  Validators.required(body.description, 'description')
  Validators.string(body.description, 'description')
  
  if (body.description.trim().length < 3) {
    throw new MaverickError({
      message: 'Description must be at least 3 characters long',
      code: ErrorCodes.VALIDATION_ERROR,
      statusCode: 400,
      context: projectContext
    })
  }
  
  logInfo('Request body parsed and validated', projectContext, {
    hasDescription: !!body.description,
    descriptionLength: body.description?.length || 0,
    chatMode: body.chatMode,
    mentionedUsers: body.mentionedUsers?.length || 0,
    bodyKeys: Object.keys(body)
  })

  // Handle chat mode differently
  if (body.chatMode) {
    logInfo('Processing in chat mode', projectContext)
    return await handleChatMode(projectName, body, session, resolvedParams, projectContext.requestId || 'default')
  }

  logInfo('Loading existing work items for context', projectContext)
  // Load existing work items for context with retry
  const existingWorkItems = await withRetry(
    () => loadExistingWorkItems(projectName),
    3,
    1000,
    projectContext
  )
  logInfo(`Loaded ${existingWorkItems.length} existing work items`, projectContext)
  
  logInfo('Creating immediate work item with PENDING status', projectContext)
  
  // IMMEDIATE CREATION STRATEGY: Create work item first, enhance later
  const workItemId = randomUUID()
  const timestamp = new Date().toISOString()
  logInfo('Work item ID generated', projectContext, { workItemId })
  
  // Basic analysis for immediate creation
  const basicAnalysis = basicWorkItemAnalysis(body.description)
  
  // Create the work item object with basic data + PENDING status
  const workItem = {
    id: workItemId,
    title: basicAnalysis.title,
    description: body.description,
    type: basicAnalysis.type,
    status: 'PENDING', // Special status for AI enhancement
    priority: basicAnalysis.priority,
    functionalArea: basicAnalysis.functionalArea,
    parentId: null,
    orderIndex: Date.now(),
    depth: 0,
    worktreeName: null, // Will be set during enhancement
    githubBranch: null,
    worktreeStatus: null,
    estimatedEffort: basicAnalysis.estimatedEffort,
    projectName,
    assignedToId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    aiEnhanced: false, // Flag to track enhancement status
    originalRequest: body.description
  }

  logInfo('Generating basic markdown content', projectContext)
  // Generate basic markdown content for immediate save
  const markdownContent = generatePendingWorkItemMarkdown(workItem, body.description)
  logInfo('Basic markdown content generated', projectContext, {
    length: markdownContent.length,
    preview: markdownContent.slice(0, 200) + '...'
  })
  
  logInfo('Saving work item to file system immediately', projectContext)
  // Save work item as markdown file with retry
  await withRetry(
    () => saveWorkItemToMarkdown(projectName, workItemId, markdownContent),
    3,
    1000,
    projectContext
  )
  logInfo('Work item saved successfully', projectContext)

  // ASYNC ENHANCEMENT: Start AI enhancement in background (non-blocking)
  logInfo('Starting async AI enhancement', projectContext)
  enhanceWorkItemAsynchronously(projectName, workItemId, body.description, existingWorkItems, projectContext)
    .catch(error => {
      logError(new Error(`Async AI enhancement failed: ${error.message}`), projectContext)
    })

  const duration = Date.now() - startTime
  logInfo('Smart Create completed successfully (immediate)', projectContext, {
    duration: `${duration}ms`,
    workItemId,
    projectName,
    type: basicAnalysis.type,
    priority: basicAnalysis.priority,
    enhanced: false
  })
  
  return NextResponse.json({ 
    workItem: { ...workItem, markdownContent },
    message: `Created work item: ${basicAnalysis.title} (enhancing with AI...)`,
    immediate: true,
    enhancing: true
  })
}

// Basic analysis function for immediate work item creation
function basicWorkItemAnalysis(description: string) {
  const desc = description.toLowerCase().trim()
  
  // Basic type detection
  let type: 'FEATURE' | 'BUG' | 'EPIC' | 'STORY' | 'TASK' | 'SUBTASK' = 'TASK'
  if (desc.includes('bug') || desc.includes('fix') || desc.includes('error') || desc.includes('broken')) {
    type = 'BUG'
  } else if (desc.includes('add') || desc.includes('new') || desc.includes('create') || desc.includes('implement') || desc.includes('build')) {
    type = 'FEATURE'
  } else if (desc.includes('epic') || desc.includes('large') || desc.includes('major initiative')) {
    type = 'EPIC'
  }
  
  // Basic priority detection
  let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL' = 'MEDIUM'
  if (desc.includes('urgent') || desc.includes('critical') || desc.includes('asap')) {
    priority = 'URGENT'
  } else if (desc.includes('important') || desc.includes('high priority') || desc.includes('soon')) {
    priority = 'HIGH'
  } else if (desc.includes('low priority') || desc.includes('when possible') || desc.includes('nice to have')) {
    priority = 'LOW'
  }
  
  // Basic functional area detection
  let functionalArea: 'SOFTWARE' | 'LEGAL' | 'OPERATIONS' | 'MARKETING' = 'SOFTWARE'
  if (desc.includes('legal') || desc.includes('compliance') || desc.includes('terms')) {
    functionalArea = 'LEGAL'
  } else if (desc.includes('marketing') || desc.includes('content') || desc.includes('campaign')) {
    functionalArea = 'MARKETING'
  } else if (desc.includes('operations') || desc.includes('process') || desc.includes('workflow')) {
    functionalArea = 'OPERATIONS'
  }
  
  // Basic effort estimation
  let estimatedEffort = '1d'
  if (desc.includes('quick') || desc.includes('simple') || desc.includes('small')) {
    estimatedEffort = '4h'
  } else if (desc.includes('complex') || desc.includes('major') || desc.includes('large')) {
    estimatedEffort = '1w'
  }
  
  // Generate basic title
  let title = description.split('.')[0].trim()
  if (title.length > 60) {
    title = title.substring(0, 57) + '...'
  }
  title = title.charAt(0).toUpperCase() + title.slice(1)
  
  return { title, type, priority, functionalArea, estimatedEffort }
}

// Generate pending work item markdown (before AI enhancement)
function generatePendingWorkItemMarkdown(workItem: any, originalDescription: string): string {
  const timestamp = new Date().toISOString()
  const dateFormatted = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return `---
id: ${workItem.id}
title: "${workItem.title}"
type: ${workItem.type}
status: PENDING
priority: ${workItem.priority}
functionalArea: ${workItem.functionalArea}
estimatedEffort: "${workItem.estimatedEffort}"
worktreeName: null
githubBranch: null
assignedTo: null
createdAt: ${workItem.createdAt}
updatedAt: ${workItem.updatedAt}
aiEnhanced: false
originalRequest: "${originalDescription}"
---

# ${workItem.title}

## 📋 Description
${workItem.description}

> **Status: AI Enhancement in Progress** 🤖
> 
> This work item was created immediately and is being enhanced with AI analysis. 
> The content above will be expanded with detailed tasks, acceptance criteria, 
> and implementation guidance shortly.

## 🏷️ Basic Classification
- **Type:** ${workItem.type}
- **Priority:** ${workItem.priority}
- **Functional Area:** ${workItem.functionalArea}
- **Estimated Effort:** ${workItem.estimatedEffort}

## 🔄 Enhancement Progress
- [x] Work item created
- [ ] AI analysis complete
- [ ] Tasks generated
- [ ] Acceptance criteria defined
- [ ] Implementation notes added

---

## Metadata
- **Created:** ${dateFormatted}
- **Last Updated:** ${dateFormatted}
- **Project:** ${workItem.projectName}
- **Generated by:** Maverick AI ✨ (Immediate Creation)

> _This work item will be automatically enhanced with detailed planning and structured guidance._
`
}

// Async enhancement function (runs in background)
async function enhanceWorkItemAsynchronously(
  projectName: string, 
  workItemId: string, 
  description: string, 
  existingWorkItems: any[], 
  context: any
) {
  try {
    logInfo('Starting async AI enhancement', context, { workItemId })
    
    // Perform AI analysis (this can take time)
    const aiAnalysis = await withRetry(
      () => analyzeWorkItemWithAI(
        description,
        `Project: ${projectName}`,
        existingWorkItems.slice(0, 5)
      ),
      2,
      2000,
      context
    )
    
    logInfo('AI analysis completed for async enhancement', context, {
      workItemId,
      title: aiAnalysis.title,
      tasksCount: aiAnalysis.tasks?.length || 0
    })
    
    // Generate enhanced markdown content
    const enhancedMarkdown = await generateEnhancedWorkItemMarkdown(aiAnalysis, workItemId, description, projectName)
    
logInfo('Enhanced markdown generated', context, { 
      workItemId, 
      length: enhancedMarkdown.length 
    })
    
    // Update the work item file with enhanced content
    await saveWorkItemToMarkdown(projectName, workItemId, enhancedMarkdown)
    
    logInfo('Work item enhanced successfully', context, { 
      workItemId,
      aiTitle: aiAnalysis.title,
      tasksGenerated: aiAnalysis.tasks?.length || 0
    })
    
  } catch (error) {
    logError(new Error(`Failed to enhance work item asynchronously: ${error instanceof Error ? error.message : String(error)}`), context)
    
    // Create a fallback enhanced version if AI fails
    await createFallbackEnhancement(projectName, workItemId, description, context)
  }
}

// Fallback enhancement if AI fails
async function createFallbackEnhancement(projectName: string, workItemId: string, description: string, context: any) {
  try {
    const basicAnalysis = basicWorkItemAnalysis(description)
    const fallbackMarkdown = generateFallbackEnhancedMarkdown(workItemId, basicAnalysis, description, projectName)
    
    await saveWorkItemToMarkdown(projectName, workItemId, fallbackMarkdown)
    
    logInfo('Fallback enhancement completed', context, { workItemId })
  } catch (error) {
    logError(new Error(`Fallback enhancement failed for ${workItemId}: ${error}`), context)
  }
}

// Generate enhanced markdown from AI analysis
async function generateEnhancedWorkItemMarkdown(aiAnalysis: any, workItemId: string, originalDescription: string, projectName: string): Promise<string> {
  const timestamp = new Date().toISOString()
  const dateFormatted = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  // Generate worktree name if it's a feature or bug
  let worktreeName = null
  let githubBranch = null
  if (aiAnalysis.type === 'FEATURE' || aiAnalysis.type === 'BUG') {
    const sanitizedTitle = aiAnalysis.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .substring(0, 50)
    
    const prefix = aiAnalysis.type.toLowerCase()
    worktreeName = `${prefix}/${sanitizedTitle}`
    githubBranch = worktreeName
  }

  return `---
id: ${workItemId}
title: "${aiAnalysis.title}"
type: ${aiAnalysis.type}
status: PLANNED
priority: ${aiAnalysis.priority}
functionalArea: ${aiAnalysis.functionalArea}
estimatedEffort: "${aiAnalysis.estimatedEffort}"
worktreeName: ${worktreeName || 'null'}
githubBranch: ${githubBranch || 'null'}
assignedTo: null
createdAt: ${timestamp}
updatedAt: ${timestamp}
aiEnhanced: true
originalRequest: "${originalDescription}"
businessImpact: "${aiAnalysis.business_impact}"
---

# ${aiAnalysis.title}

## 📋 Description
${aiAnalysis.description}

**Original Request:** "${originalDescription}"

## 🏷️ Classification
- **Type:** ${aiAnalysis.type}
- **Priority:** ${aiAnalysis.priority}
- **Functional Area:** ${aiAnalysis.functionalArea}
- **Estimated Effort:** ${aiAnalysis.estimatedEffort}
- **Business Impact:** ${aiAnalysis.business_impact}

${worktreeName ? `## 🌿 Development Branch
- **Branch:** \`${worktreeName}\`
- **Status:** Ready for creation` : ''}

## ✅ AI-Generated Tasks

${aiAnalysis.tasks.map((task: any, index: number) => `### ${index + 1}. ${task.title}
**Priority:** ${task.priority} | **Duration:** ${task.estimatedDuration} | **Category:** ${task.category}

${task.description}

${task.acceptance_criteria && task.acceptance_criteria.length > 0 ? `**Acceptance Criteria:**
${task.acceptance_criteria.map((criteria: string) => `- ${criteria}`).join('\n')}` : ''}

${task.dependencies && task.dependencies.length > 0 ? `**Dependencies:** ${task.dependencies.join(', ')}` : ''}
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

## 📚 Resources & References
- [ ] Add relevant documentation links
- [ ] Include design mockups or wireframes  
- [ ] List external dependencies
- [ ] Note any architectural decisions

## 💬 Discussion & Updates

### ${dateFormatted}
- ✅ Work item created immediately
- ✅ AI analysis completed
- ✅ Comprehensive planning added
- Ready for development assignment

---

## Metadata
- **Created:** ${dateFormatted}
- **Last Updated:** ${dateFormatted}
- **Project:** ${projectName}
- **Generated by:** Maverick AI ✨ (Enhanced Analysis)

> _This work item was created immediately for fast feedback, then enhanced with AI analysis for comprehensive planning._
`
}

// Generate fallback enhanced markdown if AI fails
function generateFallbackEnhancedMarkdown(workItemId: string, basicAnalysis: any, originalDescription: string, projectName: string): string {
  const dateFormatted = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return `---
id: ${workItemId}
title: "${basicAnalysis.title}"
type: ${basicAnalysis.type}
status: PLANNED
priority: ${basicAnalysis.priority}
functionalArea: ${basicAnalysis.functionalArea}
estimatedEffort: "${basicAnalysis.estimatedEffort}"
worktreeName: null
githubBranch: null
assignedTo: null
createdAt: ${new Date().toISOString()}
updatedAt: ${new Date().toISOString()}
aiEnhanced: false
originalRequest: "${originalDescription}"
---

# ${basicAnalysis.title}

## 📋 Description
${originalDescription}

> **Note:** AI enhancement was not available, so this work item uses basic analysis. 
> Please review and add detailed requirements as needed.

## 🏷️ Classification
- **Type:** ${basicAnalysis.type}
- **Priority:** ${basicAnalysis.priority}
- **Functional Area:** ${basicAnalysis.functionalArea}
- **Estimated Effort:** ${basicAnalysis.estimatedEffort}

## 🎯 Next Steps
- [ ] Review and refine requirements
- [ ] Break down into specific tasks
- [ ] Define acceptance criteria
- [ ] Assign to team member
- [ ] Begin implementation

## 💬 Discussion & Updates

### ${dateFormatted}
- Work item created with basic analysis
- Ready for manual refinement and planning

---

## Metadata
- **Created:** ${dateFormatted}
- **Last Updated:** ${dateFormatted}
- **Project:** ${projectName}
- **Generated by:** Maverick AI ✨ (Basic Analysis)

> _This work item was created immediately but AI enhancement failed. Please add detailed planning manually._
`
}

async function saveWorkItemToMarkdown(projectName: string, workItemId: string, markdownContent: string) {
  try {
    // Use project context service to get the correct path
    const { projectContextService } = require('@/lib/project-context-service')
    const context = await projectContextService.loadWorkItems(projectName) // This ensures directory exists
    const projectCtx = await projectContextService.getProjectContext(projectName)
    
    const filePath = path.join(projectCtx.workItemsPath, `${workItemId}.md`)
    
    // Write markdown file
    await fs.writeFile(filePath, markdownContent, 'utf-8')
    
    // Update index file for fast UI loading
    await updateWorkItemsIndex(projectName, projectCtx.workItemsPath)
  } catch (error) {
    // Fallback to old path structure for compatibility
    const workItemsDir = path.join(process.cwd(), '.maverick', 'work-items')
    const filePath = path.join(workItemsDir, `${workItemId}.md`)
    
    await fs.mkdir(workItemsDir, { recursive: true })
    await fs.writeFile(filePath, markdownContent, 'utf-8')
    await updateWorkItemsIndex(projectName, workItemsDir)
  }
}

async function updateWorkItemsIndex(projectName: string, workItemsDir: string) {
  const indexPath = path.join(path.dirname(workItemsDir), '.maverick.work-items.json')
  
  try {
    const files = await fs.readdir(workItemsDir)
    const markdownFiles = files.filter(file => file.endsWith('.md'))
    
    const index = {
      count: markdownFiles.length,
      lastUpdated: new Date().toISOString(),
      items: markdownFiles.map(file => ({
        id: file.replace('.md', ''),
        filename: file,
        path: `work-items/${file}`
      }))
    }
    
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error updating work items index:', error)
  }
}

async function loadExistingWorkItems(projectName: string) {
  try {
    // Use project context service to load work items from correct location
    const { projectContextService } = require('@/lib/project-context-service')
    const workItems = await projectContextService.loadWorkItems(projectName)
    return workItems.slice(0, 10) // Limit for performance
  } catch (error) {
    console.error('Error loading existing work items:', error)
    return []
  }
}

function parseBasicWorkItemFromMarkdown(content: string, filename: string) {
  const lines = content.split('\n')
  const item: any = { id: filename.replace('.md', '') }
  
  // Extract frontmatter
  let inFrontmatter = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true
        continue
      } else {
        break
      }
    }
    
    if (inFrontmatter) {
      if (trimmed.startsWith('title:')) {
        item.title = trimmed.substring(6).trim().replace(/^"(.*)"$/, '$1')
      } else if (trimmed.startsWith('type:')) {
        item.type = trimmed.substring(5).trim()
      } else if (trimmed.startsWith('status:')) {
        item.status = trimmed.substring(7).trim()
      } else if (trimmed.startsWith('priority:')) {
        item.priority = trimmed.substring(9).trim()
      }
    }
  }
  
  return item
}

async function generateStructuredWorkItemMarkdown(aiAnalysis: any, workItem: any, originalDescription: string): Promise<string> {
  const timestamp = new Date().toISOString()
  const dateFormatted = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return `---
id: ${workItem.id}
title: "${aiAnalysis.title}"
type: ${aiAnalysis.type}
status: ${workItem.status}
priority: ${aiAnalysis.priority}
functionalArea: ${aiAnalysis.functionalArea}
estimatedEffort: "${aiAnalysis.estimatedEffort}"
worktreeName: ${workItem.worktreeName || 'null'}
githubBranch: ${workItem.githubBranch || 'null'}
assignedTo: null
createdAt: ${workItem.createdAt}
updatedAt: ${workItem.updatedAt}
businessImpact: "${aiAnalysis.business_impact}"
---

# ${aiAnalysis.title}

## 📋 Description
${aiAnalysis.description}

**Original Request:** "${originalDescription}"

## 🏷️ Classification
- **Type:** ${aiAnalysis.type}
- **Priority:** ${aiAnalysis.priority}
- **Functional Area:** ${aiAnalysis.functionalArea}
- **Estimated Effort:** ${aiAnalysis.estimatedEffort}
- **Business Impact:** ${aiAnalysis.business_impact}

${workItem.worktreeName ? `## 🌿 Development Branch
- **Branch:** \`${workItem.worktreeName}\`
- **Status:** ${workItem.worktreeStatus}` : ''}

## ✅ AI-Generated Tasks

${aiAnalysis.tasks.map((task: any, index: number) => `### ${index + 1}. ${task.title}
**Priority:** ${task.priority} | **Duration:** ${task.estimatedDuration} | **Category:** ${task.category}

${task.description}

${task.acceptance_criteria && task.acceptance_criteria.length > 0 ? `**Acceptance Criteria:**
${task.acceptance_criteria.map((criteria: string) => `- ${criteria}`).join('\n')}` : ''}

${task.dependencies && task.dependencies.length > 0 ? `**Dependencies:** ${task.dependencies.join(', ')}` : ''}
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

## 📚 Resources & References
- [ ] Add relevant documentation links
- [ ] Include design mockups or wireframes  
- [ ] List external dependencies
- [ ] Note any architectural decisions

## 💬 Discussion & Updates

### ${dateFormatted}
- Work item created via AI analysis
- Comprehensive planning completed
- Ready for development assignment

---

## Metadata
- **Created:** ${dateFormatted}
- **Last Updated:** ${dateFormatted}
- **Project:** ${workItem.projectName}
- **Generated by:** Maverick AI ✨ (Structured Analysis)

> _This work item is part of the .maverick project management system. The structured data above is also available via API for programmatic access._
`
}

function generateActionPlan(type: string, functionalArea: string, description: string) {
  const basePlans = {
    FEATURE: [
      { title: "Requirements Analysis", description: "Define user stories and acceptance criteria", duration: "1-2 hours" },
      { title: "Technical Design", description: "Design system architecture and data models", duration: "2-4 hours" },
      { title: "Implementation", description: "Write code and implement core functionality", duration: "1-3 days" },
      { title: "Testing", description: "Write unit tests and integration tests", duration: "4-8 hours" },
      { title: "Documentation", description: "Update docs and create user guides", duration: "2-4 hours" },
      { title: "Review & Deploy", description: "Code review, QA testing, and deployment", duration: "1-2 days" }
    ],
    BUG: [
      { title: "Reproduce Issue", description: "Create minimal reproduction case", duration: "30-60 min" },
      { title: "Root Cause Analysis", description: "Investigate and identify the underlying problem", duration: "1-3 hours" },
      { title: "Fix Implementation", description: "Implement the solution", duration: "1-4 hours" },
      { title: "Regression Testing", description: "Test fix and ensure no new issues", duration: "1-2 hours" },
      { title: "Verification", description: "Verify fix in staging and production", duration: "30 min" }
    ],
    TASK: [
      { title: "Task Breakdown", description: "Break down into smaller actionable steps", duration: "30 min" },
      { title: "Research", description: "Gather requirements and investigate options", duration: "1-2 hours" },
      { title: "Implementation", description: "Execute the planned work", duration: "2-6 hours" },
      { title: "Validation", description: "Review and test the completed work", duration: "1 hour" }
    ]
  }

  return basePlans[type as keyof typeof basePlans] || basePlans.TASK
}

function generateSubtasks(type: string, functionalArea: string, description: string) {
  const lowerDesc = description.toLowerCase()
  
  let tasks = [
    { title: "Create feature branch", description: "Branch from main for isolated development", category: "Setup" },
    { title: "Update project documentation", description: "Ensure docs reflect the changes", category: "Documentation" },
    { title: "Create pull request", description: "Submit work for review", category: "Process" }
  ]

  // Add type-specific tasks
  if (type === 'FEATURE') {
    tasks.unshift(
      { title: "Write user stories", description: "Define clear user acceptance criteria", category: "Planning" },
      { title: "Design user interface", description: "Create mockups or wireframes if needed", category: "Design" },
      { title: "Implement backend logic", description: "Build server-side functionality", category: "Backend" },
      { title: "Build frontend components", description: "Create user-facing interface", category: "Frontend" },
      { title: "Add comprehensive tests", description: "Unit and integration test coverage", category: "Testing" }
    )
  } else if (type === 'BUG') {
    tasks.unshift(
      { title: "Create bug reproduction steps", description: "Document how to reproduce the issue", category: "Investigation" },
      { title: "Add regression test", description: "Prevent this bug from happening again", category: "Testing" },
      { title: "Verify fix in multiple environments", description: "Test across development, staging, production", category: "Validation" }
    )
  }

  // Add functional area specific tasks
  if (functionalArea === 'LEGAL') {
    tasks.push({ title: "Legal review", description: "Ensure compliance with regulations", category: "Compliance" })
  } else if (functionalArea === 'MARKETING') {
    tasks.push({ title: "Content review", description: "Ensure messaging aligns with brand", category: "Content" })
  }

  return tasks.slice(0, 8) // Limit to 8 tasks for readability
}

function generateImplementationNotes(type: string, description: string): string {
  const lowerDesc = description.toLowerCase()
  
  let notes = `### Development Approach\n`
  
  if (type === 'FEATURE') {
    notes += `- Start with a simple MVP implementation
- Consider scalability and future extensibility
- Follow existing code patterns and conventions
- Ensure proper error handling and edge cases`
  } else if (type === 'BUG') {
    notes += `- Focus on minimal changes to reduce risk
- Add logging to help diagnose similar issues in the future
- Consider if this indicates a larger systemic problem
- Test thoroughly in all affected environments`
  } else {
    notes += `- Break down complex work into smaller commits
- Document any decisions or trade-offs made
- Consider impact on other parts of the system
- Plan for rollback if needed`
  }

  notes += `\n\n### Technical Considerations\n`
  
  if (lowerDesc.includes('auth') || lowerDesc.includes('login') || lowerDesc.includes('user')) {
    notes += `- Security implications: validate all inputs, secure session management
- Consider GDPR and data privacy requirements
- Plan for account recovery and edge cases`
  } else if (lowerDesc.includes('database') || lowerDesc.includes('data')) {
    notes += `- Database migrations: plan for zero-downtime deployment
- Consider data validation and cleanup
- Plan for backup and recovery procedures`
  } else if (lowerDesc.includes('api') || lowerDesc.includes('integration')) {
    notes += `- API versioning and backward compatibility
- Rate limiting and error handling
- Documentation and client SDK updates`
  } else {
    notes += `- Follow project coding standards and conventions
- Consider performance implications
- Plan for monitoring and observability`
  }

  return notes
}

// AI analysis function using Claude/Gemini to properly structure work items
async function analyzeWorkItemDescription(description: string): Promise<{
  title: string
  description: string
  type: 'FEATURE' | 'BUG' | 'EPIC' | 'STORY' | 'TASK' | 'SUBTASK'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
  functionalArea: 'SOFTWARE' | 'LEGAL' | 'OPERATIONS' | 'MARKETING'
  estimatedEffort?: string
}> {
  try {
    // Try Claude API first, fall back to Gemini if needed
    const analysisResult = await callAIForWorkItemAnalysis(description)
    
    if (analysisResult) {
      return analysisResult
    }
    
    // Fallback to basic analysis if AI calls fail
    return fallbackAnalysis(description)
  } catch (error) {
    console.error('AI analysis failed, using fallback:', error)
    return fallbackAnalysis(description)
  }
}

async function callAIForWorkItemAnalysis(userInput: string) {
  const prompt = `You are a professional project manager AI. The user has described a work item in natural language. Your job is to restructure this into a well-organized, professional work item.

User Input: "${userInput}"

Please analyze this and return a JSON object with the following structure:
{
  "title": "A clear, actionable title (under 60 characters)",
  "description": "A well-structured description that clarifies requirements, context, and goals",
  "type": "FEATURE|BUG|EPIC|STORY|TASK|SUBTASK",
  "priority": "LOW|MEDIUM|HIGH|URGENT|CRITICAL", 
  "functionalArea": "SOFTWARE|LEGAL|OPERATIONS|MARKETING",
  "estimatedEffort": "1h|4h|1d|3d|1w|2w"
}

Guidelines:
1. REWRITE the title to be clear and actionable (not just the user's words)
2. EXPAND the description with proper context, requirements, and acceptance criteria
3. Choose appropriate type based on what the user is asking for
4. Set realistic priority and effort estimates
5. Be professional but concise

Return only valid JSON, no markdown or extra text.`

  try {
    // Use the existing AI provider system
    const result = await generateAIResponse(prompt, 'Work item analysis and restructuring', 'auto')
    
    if (result) {
      try {
        // Clean up any markdown formatting that might be present
        const cleanContent = result.replace(/```json\n?|\n?```/g, '').trim()
        const parsed = JSON.parse(cleanContent)
        if (isValidWorkItemAnalysis(parsed)) {
          return parsed
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError)
      }
    }
  } catch (error) {
    console.error('AI analysis error:', error)
  }

  return null
}

function isValidWorkItemAnalysis(obj: any): boolean {
  const validTypes = ['FEATURE', 'BUG', 'EPIC', 'STORY', 'TASK', 'SUBTASK']
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']
  const validFunctionalAreas = ['SOFTWARE', 'LEGAL', 'OPERATIONS', 'MARKETING']
  
  return (
    obj &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    validTypes.includes(obj.type) &&
    validPriorities.includes(obj.priority) &&
    validFunctionalAreas.includes(obj.functionalArea) &&
    (obj.estimatedEffort === undefined || typeof obj.estimatedEffort === 'string')
  )
}

function fallbackAnalysis(description: string) {
  const desc = description.toLowerCase()
  
  // Basic type detection
  let type: 'FEATURE' | 'BUG' | 'EPIC' | 'STORY' | 'TASK' | 'SUBTASK' = 'TASK'
  if (desc.includes('bug') || desc.includes('fix') || desc.includes('error')) {
    type = 'BUG'
  } else if (desc.includes('add') || desc.includes('new') || desc.includes('create') || desc.includes('implement')) {
    type = 'FEATURE'
  }
  
  // Basic priority detection
  let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL' = 'MEDIUM'
  if (desc.includes('urgent') || desc.includes('critical')) {
    priority = 'URGENT'
  } else if (desc.includes('important') || desc.includes('high priority')) {
    priority = 'HIGH'
  }
  
  // Basic functional area
  let functionalArea: 'SOFTWARE' | 'LEGAL' | 'OPERATIONS' | 'MARKETING' = 'SOFTWARE'
  
  // Basic effort estimation
  let estimatedEffort: string | undefined = '1d'
  if (desc.includes('quick') || desc.includes('simple')) {
    estimatedEffort = '4h'
  } else if (desc.includes('complex') || desc.includes('major')) {
    estimatedEffort = '1w'
  }
  
  // Basic title cleanup
  let title = description.split('.')[0].trim()
  if (title.length > 60) {
    title = title.substring(0, 57) + '...'
  }
  title = title.charAt(0).toUpperCase() + title.slice(1)
  
  return {
    title,
    description: `${description.trim()}\n\n**Note:** This work item was created with basic analysis. Please review and update as needed.`,
    type,
    priority,
    functionalArea,
    estimatedEffort
  }
}

async function generateEnhancedActionPlan(analysis: any, originalDescription: string) {
  const prompt = `Create a detailed action plan for this work item:

Title: ${analysis.title}
Type: ${analysis.type}
Description: ${analysis.description}
Original User Input: ${originalDescription}

Generate 4-6 actionable steps with realistic time estimates. Each step should be specific and measurable. Return as a JSON array:
[
  {"title": "Step name", "description": "What to do", "duration": "2h"},
  ...
]

Focus on practical, actionable steps that lead to completion.`

  try {
    const result = await generateAIResponse(prompt, 'Action plan generation for project management', 'auto')
    if (result) {
      try {
        const cleanContent = result.replace(/```json\n?|\n?```/g, '').trim()
        const parsed = JSON.parse(cleanContent)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      } catch (e) {
        console.error('Failed to parse action plan:', e)
      }
    }
  } catch (error) {
    console.error('AI action plan generation failed:', error)
  }

  // Fallback to template-based generation
  return generateActionPlan(analysis.type, analysis.functionalArea, originalDescription)
}

async function generateEnhancedSubtasks(analysis: any, originalDescription: string) {
  const prompt = `Create specific subtasks for this work item:

Title: ${analysis.title}
Type: ${analysis.type}
Description: ${analysis.description}
Original User Input: ${originalDescription}

Generate 5-8 concrete subtasks that break down the work. Return as a JSON array:
[
  {"title": "Subtask name", "description": "Specific deliverable", "category": "Planning|Design|Development|Testing|Documentation"},
  ...
]

Make each subtask specific and actionable.`

  try {
    const result = await generateAIResponse(prompt, 'Subtask generation for project breakdown', 'auto')
    if (result) {
      try {
        const cleanContent = result.replace(/```json\n?|\n?```/g, '').trim()
        const parsed = JSON.parse(cleanContent)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      } catch (e) {
        console.error('Failed to parse subtasks:', e)
      }
    }
  } catch (error) {
    console.error('AI subtask generation failed:', error)
  }

  // Fallback to template-based generation
  return generateSubtasks(analysis.type, analysis.functionalArea, originalDescription)
}

async function generateEnhancedImplementationNotes(analysis: any, originalDescription: string) {
  const prompt = `Create implementation notes for this work item:

Title: ${analysis.title}
Type: ${analysis.type}
Description: ${analysis.description}
Original User Input: ${originalDescription}

Provide practical guidance on:
1. Development approach
2. Technical considerations
3. Potential challenges
4. Best practices

Return as markdown text, be concise but helpful.`

  try {
    const result = await generateAIResponse(prompt, 'Implementation guidance for development work', 'auto')
    if (result && result.length > 50) {
      return result
    }
  } catch (error) {
    console.error('AI implementation notes generation failed:', error)
  }

  // Fallback to template-based generation
  return generateImplementationNotes(analysis.type, originalDescription)
}

// Chat mode handler for conversational task creation
async function handleChatMode(projectName: string, body: any, session: any, params: any, requestId: string) {
  try {
    console.log(`🗣️ [${requestId}] Starting chat mode processing...`)
    
    // Build context string for selected task if available
    const selectedTaskContext = body.selectedTaskContext 
      ? `\n\nCURRENT TASK CONTEXT:
The user has selected task "${body.selectedTaskContext.title}" (${body.selectedTaskContext.type}, ${body.selectedTaskContext.status}, ${body.selectedTaskContext.priority} priority).
Description: ${body.selectedTaskContext.description || 'No description'}
Category: ${body.selectedTaskContext.category}

Use this context to provide more relevant responses about this specific task.`
      : ''

    // Generate conversational AI response using Claude Code's natural abilities
    const chatPrompt = `You are a helpful project assistant for the "${projectName}" project. The user said: "${body.description}"${selectedTaskContext}

You are running in the actual project directory and have access to create/read/modify files. 

If the user is requesting work items or tasks to be created:
1. Create markdown files in the projects/${projectName}/work-items/ directory
2. Use this filename format: {uuid}.md with proper frontmatter
3. Include comprehensive work item details

For each work item you create, use this markdown template:
---
id: [generated-uuid]
title: "[Clear task title]"
type: FEATURE|BUG|TASK|EPIC|STORY|SUBTASK
status: PLANNED
priority: LOW|MEDIUM|HIGH|URGENT|CRITICAL
functionalArea: SOFTWARE|LEGAL|OPERATIONS|MARKETING
estimatedEffort: "1h|4h|1d|3d|1w"
category: "[Development|Design|Testing|Documentation]"
createdAt: [current-timestamp]
updatedAt: [current-timestamp]
chatGenerated: true
---

# [Task Title]

## Description
[Detailed description of what needs to be done]

## Acceptance Criteria
- [ ] [Specific criterion 1]
- [ ] [Specific criterion 2]

## Implementation Notes
[Any technical considerations or approaches]

---

Respond conversationally to the user about what you're creating, and actually create the work item files. Be helpful and engaging, explaining what you've organized for them.`

    console.log(`🤖 [${requestId}] Generating AI response for chat mode...`)
    // Force Claude Code only for chat mode - it handles JSON better than Gemini
    const result = await generateAIResponse(chatPrompt, 'Chat-based project assistance', 'claude-code', projectName)
    console.log(`📨 [${requestId}] AI response received:`, {
      hasResult: !!result,
      resultLength: result?.length || 0,
      preview: result ? result.slice(0, 200) + '...' : 'No result'
    })
    
    if (result) {
      console.log(`✅ [${requestId}] Claude Code response received:`, {
        length: result.length,
        preview: result.slice(0, 200) + '...'
      })
      
      // Claude Code has already created the files, now we need to:
      // 1. Scan the work-items directory for new files
      // 2. Return the conversational response
      // 3. Let the UI refresh to show new work items
      
      console.log(`📂 [${requestId}] Scanning for newly created work items...`)
      const workItemsPath = path.join(process.cwd(), 'projects', projectName, 'work-items')
      
      try {
        // Ensure directory exists
        await fs.mkdir(workItemsPath, { recursive: true })
        
        // Scan for recent files (created in last 30 seconds)
        const files = await fs.readdir(workItemsPath)
        const recentFiles = []
        const cutoffTime = Date.now() - 30000 // 30 seconds ago
        
        for (const file of files) {
          if (file.endsWith('.md')) {
            const filePath = path.join(workItemsPath, file)
            const stats = await fs.stat(filePath)
            if (stats.mtime.getTime() > cutoffTime) {
              recentFiles.push(file)
            }
          }
        }
        
        console.log(`📋 [${requestId}] Found ${recentFiles.length} recently created work items:`, recentFiles)
        
        return NextResponse.json({
          assistantResponse: result,
          workItemsCreated: recentFiles.map(file => ({ id: file.replace('.md', ''), filename: file })),
          message: recentFiles.length > 0 
            ? `Claude Code created ${recentFiles.length} work item${recentFiles.length === 1 ? '' : 's'} for you!`
            : "Claude Code processed your request!"
        })
        
      } catch (scanError) {
        console.error(`❌ [${requestId}] Error scanning work items:`, scanError)
        
        // Fallback: just return the conversational response
        return NextResponse.json({
          assistantResponse: result,
          workItemsCreated: [],
          message: "Claude Code processed your request!"
        })
      }
    } else {
      console.log(`⚠️ [${requestId}] No AI response received`)
    }
    
    console.log(`🔄 [${requestId}] Using fallback response - no work items created`)
    // Fallback response
    return NextResponse.json({
      assistantResponse: "I understand what you're looking for. Could you be more specific about what exactly needs to be done? That way I can break it down into actionable tasks.",
      workItemsCreated: [],
      message: "Ready for more details"
    })
    
  } catch (error) {
    console.error(`💥 [${requestId}] Chat mode error:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({
      assistantResponse: "I'm having trouble processing that right now. Could you try breaking it down into smaller pieces?",
      workItemsCreated: [],
      message: "Processing error"
    })
  }
}

// Simplified markdown generation for chat-created items
async function generateChatWorkItemMarkdown(workItem: any, originalInput: string, mentionedUsers?: string[]): Promise<string> {
  const timestamp = new Date().toISOString()
  const dateFormatted = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  const mentionsSection = mentionedUsers && mentionedUsers.length > 0 
    ? `\n## 👥 Mentioned Users\n${mentionedUsers.map(user => `- @${user}`).join('\n')}\n`
    : ''

  return `---
id: ${workItem.id}
title: "${workItem.title}"
type: ${workItem.type}
status: ${workItem.status}
priority: ${workItem.priority}
functionalArea: ${workItem.functionalArea}
estimatedEffort: "${workItem.estimatedEffort}"
category: "${workItem.category}"
createdAt: ${workItem.createdAt}
updatedAt: ${workItem.updatedAt}
chatGenerated: true
mentionedUsers: ${mentionedUsers ? JSON.stringify(mentionedUsers) : '[]'}
---

# ${workItem.title}

## 📋 Description
${workItem.description}

**Original Request:** "${originalInput}"
${mentionsSection}
## 🏷️ Classification
- **Type:** ${workItem.type}
- **Priority:** ${workItem.priority}
- **Category:** ${workItem.category}
- **Estimated Effort:** ${workItem.estimatedEffort}

## 🎯 Next Steps
- [ ] Review and refine requirements
- [ ] Assign to team member
- [ ] Break down into subtasks if needed
- [ ] Begin implementation

## 💬 Discussion

### ${dateFormatted}
- Created via chat interface
- Ready for development assignment
${mentionedUsers && mentionedUsers.length > 0 ? `- Mentioned users: ${mentionedUsers.map(u => `@${u}`).join(', ')}` : ''}

---

**Generated by:** Maverick Vibe Chat ✨
`
}

export const POST = withErrorHandling(smartCreateHandler, (request, { params }) => ({
  endpoint: '/api/projects/[name]/work-items/smart-create',
  method: 'POST',
  projectId: 'dynamic' // Will be resolved in handler
}))

