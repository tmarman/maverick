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
    return await handleChatMode(projectName, body, session, resolvedParams, projectContext)
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
  
  logInfo('Starting AI analysis', projectContext)
  // Use enhanced AI to analyze the description and create comprehensive plan
  const aiAnalysis = await withRetry(
    () => analyzeWorkItemWithAI(
      body.description,
      `Project: ${projectName}`,
      existingWorkItems.slice(0, 5) // Provide context of recent work items
    ),
    2,
    2000,
    projectContext
  )
  
  logInfo('AI analysis completed', projectContext, {
    title: aiAnalysis.title,
    type: aiAnalysis.type,
    priority: aiAnalysis.priority,
    tasksCount: aiAnalysis.tasks?.length || 0,
    opportunitiesCount: aiAnalysis.opportunities?.length || 0,
    risksCount: aiAnalysis.risks?.length || 0
  })

  logInfo('Generating work item ID and metadata', projectContext)
  // Generate work item with unique ID
  const workItemId = randomUUID()
  const timestamp = new Date().toISOString()
  logInfo('Work item ID generated', projectContext, { workItemId })
    
    // Generate worktree name for features and bugs
    let worktreeName = undefined
    let githubBranch = undefined
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
      logInfo('Generated worktree name', projectContext, { worktreeName })
    }

    // Create the work item object with AI analysis data
    const workItem = {
      id: workItemId,
      title: aiAnalysis.title,
      description: aiAnalysis.description,
      type: aiAnalysis.type,
      status: 'PLANNED',
      priority: aiAnalysis.priority,
      functionalArea: aiAnalysis.functionalArea,
      parentId: null,
      orderIndex: Date.now(),
      depth: 0,
      worktreeName,
      githubBranch,
      worktreeStatus: worktreeName ? 'PENDING' : null,
      estimatedEffort: aiAnalysis.estimatedEffort,
      projectName,
      assignedToId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      // Store AI analysis data
      aiTasks: aiAnalysis.tasks,
      aiOpportunities: aiAnalysis.opportunities,
      aiRisks: aiAnalysis.risks,
      acceptanceCriteria: aiAnalysis.acceptance_criteria,
      technicalConsiderations: aiAnalysis.technical_considerations,
      businessImpact: aiAnalysis.business_impact
    }

  logInfo('Generating markdown content', projectContext)
  // Generate enhanced markdown content with structured AI data
  const markdownContent = await generateStructuredWorkItemMarkdown(aiAnalysis, workItem, body.description)
  logInfo('Markdown content generated', projectContext, {
    length: markdownContent.length,
    preview: markdownContent.slice(0, 200) + '...'
  })
  
  logInfo('Saving work item to file system', projectContext)
  // Save work item as markdown file with retry
  await withRetry(
    () => saveWorkItemToMarkdown(projectName, workItemId, markdownContent),
    3,
    1000,
    projectContext
  )
  logInfo('Work item saved successfully', projectContext)

    // TODO: Create worktree if needed (when we have repository integration)
    let worktreeCreated = false

    let message = `Created ${aiAnalysis.type.toLowerCase()}: ${aiAnalysis.title}`
    if (worktreeCreated) {
      message += ` (with worktree: ${worktreeName})`
    }

  const duration = Date.now() - startTime
  logInfo('Smart Create completed successfully', projectContext, {
    duration: `${duration}ms`,
    workItemId,
    projectName,
    type: aiAnalysis.type,
    priority: aiAnalysis.priority
  })
  
  return NextResponse.json({ 
    workItem: { ...workItem, markdownContent },
    aiAnalysis, // Return the full structured AI analysis
    structuredData: {
      tasks: aiAnalysis.tasks,
      opportunities: aiAnalysis.opportunities,
      risks: aiAnalysis.risks,
      acceptanceCriteria: aiAnalysis.acceptance_criteria,
      technicalConsiderations: aiAnalysis.technical_considerations,
      businessImpact: aiAnalysis.business_impact
    },
    worktreeCreated,
    message
  })
}

async function saveWorkItemToMarkdown(projectName: string, workItemId: string, markdownContent: string) {
  const workItemsDir = path.join(process.cwd(), 'projects', projectName, 'work-items')
  const filePath = path.join(workItemsDir, `${workItemId}.md`)
  
  // Ensure directory exists
  await fs.mkdir(workItemsDir, { recursive: true })
  
  // Write markdown file
  await fs.writeFile(filePath, markdownContent, 'utf-8')
  
  // Update index file for fast UI loading
  await updateWorkItemsIndex(projectName)
}

async function updateWorkItemsIndex(projectName: string) {
  const workItemsDir = path.join(process.cwd(), 'projects', projectName, 'work-items')
  const indexPath = path.join(process.cwd(), 'projects', projectName, '.maverick.work-items.json')
  
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
  const workItemsDir = path.join(process.cwd(), 'projects', projectName, 'work-items')
  
  try {
    await fs.mkdir(workItemsDir, { recursive: true })
    const files = await fs.readdir(workItemsDir)
    const markdownFiles = files.filter(file => file.endsWith('.md'))
    
    const workItems = []
    for (const file of markdownFiles.slice(0, 10)) { // Limit for performance
      try {
        const content = await fs.readFile(path.join(workItemsDir, file), 'utf-8')
        const parsed = parseBasicWorkItemFromMarkdown(content, file)
        if (parsed) workItems.push(parsed)
      } catch (error) {
        console.error(`Error reading work item ${file}:`, error)
      }
    }
    
    return workItems
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
  projectId: params?.name
}))

