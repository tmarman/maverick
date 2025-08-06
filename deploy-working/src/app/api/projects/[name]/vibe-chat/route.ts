import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { randomUUID } from 'crypto'
import * as fs from 'fs/promises'
import * as path from 'path'
import { generateAIResponse } from '@/lib/ai-provider'

async function getUserIdFromSession(): Promise<string | undefined> {
  try {
    const session = await getServerSession(authOptions)
    return session?.user?.id
  } catch (error) {
    console.error('Failed to get user ID from session:', error)
    return undefined
  }
}

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
    const body = await request.json()

    if (!body.message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Enhanced AI prompt for better task generation
    const aiResponse = await generateTasksFromConversation(
      body.message,
      body.projectContext,
      body.existingTasks || [],
      body.conversationHistory || []
    )

    if (aiResponse.tasks && aiResponse.tasks.length > 0) {
      // Create tasks in background but return immediately for better UX
      const createdTasks = []
      
      for (const taskData of aiResponse.tasks) {
        const task = await createTaskFromAI(projectName, taskData, body.message)
        createdTasks.push(task)
      }

      return NextResponse.json({
        response: aiResponse.response,
        tasksCreated: createdTasks,
        insights: aiResponse.insights,
        suggestedActions: aiResponse.suggestedActions
      })
    } else {
      return NextResponse.json({
        response: aiResponse.response || "I understand. What specific tasks would you like me to help you organize?",
        tasksCreated: [],
        insights: aiResponse.insights || [],
        suggestedActions: aiResponse.suggestedActions || []
      })
    }

  } catch (error) {
    console.error('Error in vibe chat:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

async function generateTasksFromConversation(
  message: string,
  projectContext: any,
  existingTasks: any[],
  conversationHistory: any[]
) {
  const prompt = `You are a senior product manager helping organize work for the "${projectContext.name}" project. 

Current conversation:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Latest message: "${message}"

Context about existing recent tasks:
${existingTasks.slice(0, 5).map(task => `- ${task.title} (${task.status}, ${task.priority})`).join('\n')}

Your job:
1. Understand what the user wants to accomplish
2. Generate 1-3 specific, actionable tasks that can be executed
3. Make each task clear enough that someone could start working on it immediately
4. Respond conversationally while being helpful

Return JSON in this exact format:
{
  "response": "Your conversational response to the user (like a helpful project manager)",
  "tasks": [
    {
      "title": "Clear, actionable task title (under 60 chars)",
      "description": "Detailed description with specific deliverables and acceptance criteria",
      "type": "FEATURE|BUG|TASK|ENHANCEMENT",
      "priority": "LOW|MEDIUM|HIGH|URGENT",
      "category": "Development|Design|Research|Testing|Documentation|Planning",
      "estimatedEffort": "30min|1h|2h|4h|1d|2d|1w",
      "acceptanceCriteria": [
        "Specific, measurable success criteria",
        "Another clear criteria..."
      ]
    }
  ],
  "insights": [
    "Helpful insights about the work or project direction"
  ],
  "suggestedActions": [
    "Next steps or follow-up actions to consider"
  ]
}

Guidelines:
- Only create tasks if the user is asking for something specific to be done
- If they're just discussing or asking questions, respond conversationally without creating tasks
- Make tasks actionable and specific (not vague like "improve performance")
- Consider the existing tasks to avoid duplicates
- Focus on business value and user impact
- Keep technical details appropriate for a non-technical audience

Return only valid JSON, no markdown.`

  try {
    // Get user ID from session for Claude API integration
    const userId = await getUserIdFromSession()
    const result = await generateAIResponse(
      prompt, 
      'Project management and task generation', 
      'auto', 
      undefined, // projectId
      undefined, // model
      userId
    )
    
    if (result) {
      try {
        const cleanContent = result.replace(/```json\n?|\n?```/g, '').trim()
        const parsed = JSON.parse(cleanContent)
        
        if (isValidVibeResponse(parsed)) {
          return parsed
        }
      } catch (parseError) {
        console.error('Failed to parse AI vibe response:', parseError)
      }
    }
  } catch (error) {
    console.error('AI vibe chat error:', error)
  }

  // Fallback response
  return {
    response: "I understand what you're thinking about. Could you be more specific about what you'd like to work on? I'm here to help break it down into actionable tasks.",
    tasks: [],
    insights: ["Consider breaking down large ideas into smaller, manageable pieces"],
    suggestedActions: ["Share more details about your specific goals or challenges"]
  }
}

function isValidVibeResponse(obj: any): boolean {
  return (
    obj &&
    typeof obj.response === 'string' &&
    Array.isArray(obj.tasks) &&
    Array.isArray(obj.insights) &&
    Array.isArray(obj.suggestedActions) &&
    obj.tasks.every((task: any) => 
      typeof task.title === 'string' &&
      typeof task.description === 'string' &&
      ['FEATURE', 'BUG', 'TASK', 'ENHANCEMENT'].includes(task.type) &&
      ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(task.priority) &&
      Array.isArray(task.acceptanceCriteria)
    )
  )
}

async function createTaskFromAI(projectName: string, taskData: any, originalMessage: string) {
  const workItemId = randomUUID()
  const timestamp = new Date().toISOString()
  
  const workItem = {
    id: workItemId,
    title: taskData.title,
    description: taskData.description,
    type: taskData.type,
    status: 'PLANNED',
    priority: taskData.priority,
    functionalArea: 'SOFTWARE',
    category: taskData.category,
    estimatedEffort: taskData.estimatedEffort,
    createdAt: timestamp,
    updatedAt: timestamp,
    vibeGenerated: true,
    originalMessage
  }

  // Generate markdown content for the task
  const markdownContent = generateVibeTaskMarkdown(workItem, taskData, originalMessage)
  
  // Save to file system
  await saveWorkItemToMarkdown(projectName, workItemId, markdownContent)
  
  return workItem
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

function generateVibeTaskMarkdown(workItem: any, taskData: any, originalMessage: string): string {
  const dateFormatted = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return `---
id: ${workItem.id}
title: "${workItem.title}"
type: ${workItem.type}
status: ${workItem.status}
priority: ${workItem.priority}
functionalArea: ${workItem.functionalArea}
category: "${workItem.category}"
estimatedEffort: "${workItem.estimatedEffort}"
createdAt: ${workItem.createdAt}
updatedAt: ${workItem.updatedAt}
vibeGenerated: true
---

# ${workItem.title}

## 📋 Description
${workItem.description}

**Generated from conversation:** "${originalMessage}"

## 🏷️ Classification
- **Type:** ${workItem.type}
- **Priority:** ${workItem.priority}
- **Category:** ${workItem.category}
- **Estimated Effort:** ${workItem.estimatedEffort}

## 🎯 Acceptance Criteria

${taskData.acceptanceCriteria.map((criteria: string) => `- [ ] ${criteria}`).join('\n')}

## 🚀 Getting Started

1. **Review Requirements** - Make sure you understand what needs to be done
2. **Plan Your Approach** - Break this down into smaller steps if needed
3. **Start Development** - Begin with the simplest working solution
4. **Test Thoroughly** - Verify all acceptance criteria are met
5. **Document Changes** - Update any relevant documentation

## 💭 Context & Notes

This task was created through the Vibe chat interface based on your conversation about project needs and priorities. 

The AI has analyzed your request and structured it into this actionable work item. Feel free to refine the requirements or break it down further if needed.

## 📅 Timeline

- **Created:** ${dateFormatted}
- **Target:** Based on ${workItem.estimatedEffort} estimate
- **Dependencies:** Review for any blocking work

---

**Generated by:** Maverick Vibe Chat ✨ | **Source:** Natural language conversation
`
}