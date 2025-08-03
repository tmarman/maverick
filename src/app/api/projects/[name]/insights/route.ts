import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateProjectInsights } from '@/lib/structured-ai-provider'
import * as fs from 'fs/promises'
import * as path from 'path'

export async function GET(
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
    
    // Load project work items
    const workItems = await loadProjectWorkItems(projectName)
    
    // Get project context (you could enhance this with actual project description)
    const projectDescription = `Project: ${projectName} - AI-powered business platform`
    
    // Generate AI insights
    const insights = await generateProjectInsights(projectName, workItems, projectDescription)
    
    return NextResponse.json({
      success: true,
      projectName,
      insights,
      workItemsAnalyzed: workItems.length,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating project insights:', error)
    return NextResponse.json(
      { error: 'Failed to generate project insights' },
      { status: 500 }
    )
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
    
    // Load project work items
    const workItems = await loadProjectWorkItems(projectName)
    
    // Generate insights with custom parameters
    const insights = await generateProjectInsights(
      projectName, 
      workItems, 
      body.projectDescription,
      body.businessGoals
    )
    
    // Optionally save insights to project folder
    if (body.saveToProject) {
      await saveInsightsToProject(projectName, insights)
    }
    
    return NextResponse.json({
      success: true,
      projectName,
      insights,
      saved: body.saveToProject || false,
      workItemsAnalyzed: workItems.length,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating custom project insights:', error)
    return NextResponse.json(
      { error: 'Failed to generate custom project insights' },
      { status: 500 }
    )
  }
}

async function loadProjectWorkItems(projectName: string) {
  const workItemsDir = path.join(process.cwd(), 'projects', projectName, 'work-items')
  
  try {
    await fs.mkdir(workItemsDir, { recursive: true })
    const files = await fs.readdir(workItemsDir)
    const markdownFiles = files.filter(file => file.endsWith('.md'))
    
    const workItems = []
    for (const file of markdownFiles) {
      try {
        const content = await fs.readFile(path.join(workItemsDir, file), 'utf-8')
        const parsed = parseWorkItemFromMarkdown(content, file)
        if (parsed) workItems.push(parsed)
      } catch (error) {
        console.error(`Error reading work item ${file}:`, error)
      }
    }
    
    return workItems
  } catch (error) {
    console.error('Error loading project work items:', error)
    return []
  }
}

function parseWorkItemFromMarkdown(content: string, filename: string) {
  const lines = content.split('\n')
  const item: any = { 
    id: filename.replace('.md', ''),
    filename
  }
  
  // Extract frontmatter
  let inFrontmatter = false
  let frontmatterEnd = -1
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (line === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true
        continue
      } else {
        frontmatterEnd = i
        break
      }
    }
    
    if (inFrontmatter) {
      if (line.startsWith('title:')) {
        item.title = line.substring(6).trim().replace(/^"(.*)"$/, '$1')
      } else if (line.startsWith('type:')) {
        item.type = line.substring(5).trim()
      } else if (line.startsWith('status:')) {
        item.status = line.substring(7).trim()
      } else if (line.startsWith('priority:')) {
        item.priority = line.substring(9).trim()
      } else if (line.startsWith('functionalArea:')) {
        item.functionalArea = line.substring(15).trim()
      } else if (line.startsWith('estimatedEffort:')) {
        item.estimatedEffort = line.substring(16).trim().replace(/^"(.*)"$/, '$1')
      } else if (line.startsWith('businessImpact:')) {
        item.businessImpact = line.substring(15).trim().replace(/^"(.*)"$/, '$1')
      } else if (line.startsWith('createdAt:')) {
        item.createdAt = line.substring(10).trim()
      } else if (line.startsWith('updatedAt:')) {
        item.updatedAt = line.substring(10).trim()
      }
    }
  }
  
  // Extract description from content
  if (frontmatterEnd !== -1) {
    const contentAfterFrontmatter = lines.slice(frontmatterEnd + 1)
    const descriptionIndex = contentAfterFrontmatter.findIndex(line => line.trim() === '## 📋 Description')
    
    if (descriptionIndex !== -1) {
      let nextSectionIndex = contentAfterFrontmatter.findIndex((line, index) => 
        index > descriptionIndex + 1 && line.startsWith('## ')
      )
      if (nextSectionIndex === -1) {
        nextSectionIndex = contentAfterFrontmatter.length
      }
      
      const descriptionLines = contentAfterFrontmatter.slice(descriptionIndex + 1, nextSectionIndex)
      item.description = descriptionLines.join('\n').trim()
    }
  }
  
  return item
}

async function saveInsightsToProject(projectName: string, insights: any) {
  const projectDir = path.join(process.cwd(), 'projects', projectName)
  const insightsPath = path.join(projectDir, '.maverick.insights.json')
  
  try {
    await fs.mkdir(projectDir, { recursive: true })
    
    const insightsData = {
      projectName,
      insights,
      generatedAt: new Date().toISOString(),
      version: '1.0'
    }
    
    await fs.writeFile(insightsPath, JSON.stringify(insightsData, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error saving insights to project:', error)
  }
}