import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { randomUUID } from 'crypto'
import * as fs from 'fs/promises'
import * as path from 'path'
import { generateAIResponse } from '@/lib/ai-provider'

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

    if (!body.description?.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    // Load the parent work item first
    const parentWorkItem = await loadWorkItemFromMarkdown(projectName, workItemId)
    if (!parentWorkItem) {
      return NextResponse.json({ error: 'Parent work item not found' }, { status: 404 })
    }

    // Use AI to analyze and structure the subtask
    const aiAnalysis = await analyzeSubtaskWithAI(body.description, parentWorkItem)
    
    // Generate subtask with AI-enhanced content
    const subtask = {
      id: randomUUID(),
      title: aiAnalysis.title,
      description: aiAnalysis.description,
      category: aiAnalysis.category,
      priority: aiAnalysis.priority,
      duration: aiAnalysis.estimatedDuration,
      acceptanceCriteria: aiAnalysis.acceptanceCriteria,
      implementationNotes: aiAnalysis.implementationNotes,
      dependencies: aiAnalysis.dependencies || [],
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Add subtask to parent work item markdown
    await addSubtaskToWorkItem(projectName, workItemId, subtask)

    return NextResponse.json({
      subtask,
      message: `Created subtask: ${subtask.title}`,
      aiAnalysis
    })

  } catch (error) {
    console.error('Error creating subtask:', error)
    return NextResponse.json(
      { error: 'Failed to create subtask' },
      { status: 500 }
    )
  }
}

async function loadWorkItemFromMarkdown(projectName: string, workItemId: string) {
  try {
    const filePath = path.join(process.cwd(), 'projects', projectName, 'work-items', `${workItemId}.md`)
    const content = await fs.readFile(filePath, 'utf-8')
    
    // Parse basic work item info from frontmatter
    const lines = content.split('\n')
    const workItem: any = { id: workItemId, markdownContent: content }
    
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
          workItem.title = trimmed.substring(6).trim().replace(/^"(.*)"$/, '$1')
        } else if (trimmed.startsWith('type:')) {
          workItem.type = trimmed.substring(5).trim()
        } else if (trimmed.startsWith('functionalArea:')) {
          workItem.functionalArea = trimmed.substring(15).trim()
        }
      }
    }
    
    return workItem
  } catch (error) {
    console.error('Error loading work item:', error)
    return null
  }
}

async function analyzeSubtaskWithAI(description: string, parentWorkItem: any) {
  const prompt = `You are analyzing a subtask for a project management system. 

Parent Work Item:
- Title: ${parentWorkItem.title}
- Type: ${parentWorkItem.type}
- Functional Area: ${parentWorkItem.functionalArea}

User wants to create a subtask: "${description}"

Generate a well-structured subtask with the following JSON format:
{
  "title": "Clear, actionable subtask title (under 50 characters)",
  "description": "Detailed description with specific deliverables and requirements",
  "category": "Planning|Design|Development|Testing|Documentation|Research|Review",
  "priority": "LOW|MEDIUM|HIGH|URGENT",
  "estimatedDuration": "30min|1h|2h|4h|1d|2d",
  "acceptanceCriteria": [
    "Specific, measurable criteria for completion",
    "Another criteria..."
  ],
  "implementationNotes": [
    "Practical guidance for implementation",
    "Technical considerations...",
    "Best practices to follow..."
  ],
  "dependencies": [
    "List any dependencies on other work or resources"
  ]
}

Make the subtask:
1. More specific than the parent work item
2. Achievable in the estimated timeframe
3. Well-defined with clear success criteria
4. Practical and actionable

Return only valid JSON, no markdown or extra text.`

  try {
    const result = await generateAIResponse(prompt, 'Subtask analysis and structuring', 'auto')
    
    if (result) {
      try {
        const cleanContent = result.replace(/```json\n?|\n?```/g, '').trim()
        const parsed = JSON.parse(cleanContent)
        
        // Validate the response structure
        if (isValidSubtaskAnalysis(parsed)) {
          return parsed
        }
      } catch (parseError) {
        console.error('Failed to parse AI subtask response:', parseError)
      }
    }
  } catch (error) {
    console.error('AI subtask analysis error:', error)
  }

  // Fallback to basic analysis
  return fallbackSubtaskAnalysis(description, parentWorkItem)
}

function isValidSubtaskAnalysis(obj: any): boolean {
  const validCategories = ['Planning', 'Design', 'Development', 'Testing', 'Documentation', 'Research', 'Review']
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
  
  return (
    obj &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    validCategories.includes(obj.category) &&
    validPriorities.includes(obj.priority) &&
    typeof obj.estimatedDuration === 'string' &&
    Array.isArray(obj.acceptanceCriteria) &&
    Array.isArray(obj.implementationNotes) &&
    Array.isArray(obj.dependencies)
  )
}

function fallbackSubtaskAnalysis(description: string, parentWorkItem: any) {
  const desc = description.toLowerCase()
  
  // Basic category detection
  let category = 'Development'
  if (desc.includes('test') || desc.includes('verify')) {
    category = 'Testing'
  } else if (desc.includes('design') || desc.includes('mockup') || desc.includes('ui')) {
    category = 'Design'
  } else if (desc.includes('document') || desc.includes('write') || desc.includes('doc')) {
    category = 'Documentation'
  } else if (desc.includes('research') || desc.includes('investigate')) {
    category = 'Research'
  } else if (desc.includes('plan') || desc.includes('analyze')) {
    category = 'Planning'
  }
  
  // Basic priority detection
  let priority = 'MEDIUM'
  if (desc.includes('urgent') || desc.includes('critical')) {
    priority = 'URGENT'
  } else if (desc.includes('important') || desc.includes('high')) {
    priority = 'HIGH'
  } else if (desc.includes('nice to have') || desc.includes('optional')) {
    priority = 'LOW'
  }
  
  // Basic duration estimation
  let estimatedDuration = '2h'
  if (desc.includes('quick') || desc.includes('simple')) {
    estimatedDuration = '1h'
  } else if (desc.includes('complex') || desc.includes('major')) {
    estimatedDuration = '1d'
  }
  
  return {
    title: description.charAt(0).toUpperCase() + description.slice(1),
    description: `${description}\n\n**Note:** This subtask was created with basic analysis. Please review and refine as needed.`,
    category,
    priority,
    estimatedDuration,
    acceptanceCriteria: [
      'Task is completed as described',
      'Work follows project standards',
      'Changes are tested and working'
    ],
    implementationNotes: [
      'Break down complex work into smaller steps',
      'Follow existing project patterns',
      'Document any key decisions made'
    ],
    dependencies: []
  }
}

async function addSubtaskToWorkItem(projectName: string, workItemId: string, subtask: any) {
  try {
    const filePath = path.join(process.cwd(), 'projects', projectName, 'work-items', `${workItemId}.md`)
    const content = await fs.readFile(filePath, 'utf-8')
    
    // Find the subtasks section or create it
    const lines = content.split('\n')
    let subtasksIndex = -1
    
    // Look for existing subtasks section
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '## ✅ Subtasks' || lines[i].trim().includes('Subtasks')) {
        subtasksIndex = i
        break
      }
    }
    
    // Generate subtask markdown
    const subtaskMarkdown = generateSubtaskMarkdown(subtask)
    
    if (subtasksIndex === -1) {
      // Add new subtasks section before acceptance criteria or at the end
      let insertIndex = lines.length
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '## 🎯 Acceptance Criteria' || 
            lines[i].trim() === '## Metadata' ||
            lines[i].trim().startsWith('---') && i > 10) {
          insertIndex = i
          break
        }
      }
      
      lines.splice(insertIndex, 0, '', '## ✅ Subtasks', '', subtaskMarkdown)
    } else {
      // Find the end of the subtasks section
      let endIndex = lines.length
      for (let i = subtasksIndex + 1; i < lines.length; i++) {
        if (lines[i].trim().startsWith('## ')) {
          endIndex = i
          break
        }
      }
      
      // Insert the new subtask before the next section
      lines.splice(endIndex, 0, '', subtaskMarkdown)
    }
    
    // Write the updated content back
    await fs.writeFile(filePath, lines.join('\n'), 'utf-8')
    
  } catch (error) {
    console.error('Error adding subtask to work item:', error)
    throw error
  }
}

function generateSubtaskMarkdown(subtask: any): string {
  return `### ${subtask.title}
**Category:** ${subtask.category} | **Priority:** ${subtask.priority} | **Duration:** ${subtask.duration}

${subtask.description}

**Acceptance Criteria:**
${subtask.acceptanceCriteria.map((criteria: string) => `- [ ] ${criteria}`).join('\n')}

**Implementation Notes:**
${subtask.implementationNotes.map((note: string) => `- ${note}`).join('\n')}

${subtask.dependencies.length > 0 ? `**Dependencies:** ${subtask.dependencies.join(', ')}\n` : ''}_Created: ${new Date().toLocaleDateString()}_`
}