import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateAIResponse } from '@/lib/ai-provider'
import * as fs from 'fs/promises'
import * as path from 'path'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string; workItemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const projectName = resolvedParams.name.toLowerCase()
    const workItemId = resolvedParams.workItemId
    const body = await request.json()

    // Load existing work item
    const workItemPath = path.join(process.cwd(), 'projects', projectName, 'work-items', `${workItemId}.md`)
    
    let existingContent = ''
    try {
      existingContent = await fs.readFile(workItemPath, 'utf-8')
    } catch (error) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
    }

    // Get project repository path for git context
    const projectDir = path.join(process.cwd(), 'projects', projectName)
    
    // Generate AI plan with git repo context
    const prompt = `You are an expert software developer and project manager. You have access to the git repository context for this project.

Work Item Details:
- Title: ${body.title}
- Type: ${body.type}
- Description: ${body.description}

Please analyze the current codebase and generate a comprehensive plan for this work item. Include:

1. **Action Plan**: 4-6 specific, actionable steps with time estimates
2. **Subtasks**: 6-8 concrete deliverables broken down by category
3. **Implementation Notes**: Technical considerations based on the current codebase

Consider the project's:
- Architecture and patterns
- Existing dependencies and frameworks
- Code style and conventions
- Testing approaches
- Deployment processes

Return your response in this JSON format:
{
  "actionPlan": [
    {"title": "Step name", "description": "What to do", "duration": "2h"},
    ...
  ],
  "subtasks": [
    {"title": "Task name", "description": "Deliverable", "category": "Planning|Design|Development|Testing|Documentation"},
    ...
  ],
  "implementationNotes": "Markdown text with technical guidance based on the codebase"
}

Focus on practical, realistic tasks that fit the project's current state and architecture.`

    // Call AI with project context (git repo context)
    const result = await generateAIResponse(
      prompt, 
      `Analyzing project ${projectName} for work item planning with full repository context`,
      'auto',
      projectName // This will set the working directory to the project's git repo
    )

    if (!result) {
      return NextResponse.json({ error: 'Failed to generate AI plan' }, { status: 500 })
    }

    let aiData
    try {
      // Clean up any markdown formatting
      const cleanContent = result.replace(/```json\n?|\n?```/g, '').trim()
      aiData = JSON.parse(cleanContent)
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 500 })
    }

    // Update the markdown content with new AI-generated sections
    const updatedMarkdown = updateMarkdownWithAiPlan(existingContent, aiData)
    
    // Save updated markdown
    await fs.writeFile(workItemPath, updatedMarkdown, 'utf-8')

    return NextResponse.json({
      success: true,
      updatedMarkdown,
      actionPlan: aiData.actionPlan || [],
      subtasks: aiData.subtasks || [],
      implementationNotes: aiData.implementationNotes || '',
      message: 'AI plan generated successfully'
    })

  } catch (error) {
    console.error('Error generating AI plan:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI plan' },
      { status: 500 }
    )
  }
}

function updateMarkdownWithAiPlan(existingMarkdown: string, aiData: any): string {
  const lines = existingMarkdown.split('\n')
  const newLines = []
  
  let inActionPlan = false
  let inSubtasks = false
  let inImplementationNotes = false
  let skipUntilNextSection = false

  for (const line of lines) {
    const trimmed = line.trim()

    // Handle section headers
    if (trimmed === '## 🎯 Action Plan') {
      inActionPlan = true
      inSubtasks = false
      inImplementationNotes = false
      skipUntilNextSection = true
      newLines.push(line)
      
      // Add AI-generated action plan
      newLines.push('')
      if (aiData.actionPlan) {
        aiData.actionPlan.forEach((step: any, index: number) => {
          newLines.push(`${index + 1}. **${step.title}**`)
          newLines.push(`   - ${step.description}`)
          newLines.push(`   - _Estimated: ${step.duration}_`)
          newLines.push('')
        })
      }
      continue
    }

    if (trimmed === '## ✅ Subtasks') {
      inActionPlan = false
      inSubtasks = true
      inImplementationNotes = false
      skipUntilNextSection = true
      newLines.push(line)
      
      // Add AI-generated subtasks
      newLines.push('')
      if (aiData.subtasks) {
        aiData.subtasks.forEach((task: any) => {
          newLines.push(`- [ ] ${task.title}`)
          newLines.push(`  - ${task.description}`)
          newLines.push(`  - _${task.category}_`)
          newLines.push('')
        })
      }
      continue
    }

    if (trimmed === '## 🔧 Implementation Notes') {
      inActionPlan = false
      inSubtasks = false
      inImplementationNotes = true
      skipUntilNextSection = true
      newLines.push(line)
      
      // Add AI-generated implementation notes
      newLines.push('')
      if (aiData.implementationNotes) {
        newLines.push(aiData.implementationNotes)
        newLines.push('')
      }
      continue
    }

    // Start of new section - stop skipping
    if (trimmed.startsWith('## ') && 
        trimmed !== '## 🎯 Action Plan' && 
        trimmed !== '## ✅ Subtasks' && 
        trimmed !== '## 🔧 Implementation Notes') {
      skipUntilNextSection = false
      inActionPlan = false
      inSubtasks = false
      inImplementationNotes = false
    }

    // Skip content in sections we're replacing
    if (!skipUntilNextSection) {
      newLines.push(line)
    }
  }

  // Add AI generation marker
  const result = newLines.join('\n')
  if (!result.includes('Maverick AI ✨')) {
    return result.replace(
      '> _This work item is part of the .maverick project management system. Edit this file to update the work item details._',
      `> _This work item is part of the .maverick project management system. Edit this file to update the work item details._
> 
> ✨ **Enhanced with AI:** Action plan and subtasks generated using repository context analysis.`
    )
  }

  return result
}