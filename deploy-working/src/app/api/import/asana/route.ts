import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { projectContextService } from '@/lib/project-context-service'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectName = formData.get('projectName') as string
    
    if (!file || !projectName) {
      return NextResponse.json(
        { error: 'File and project name are required' },
        { status: 400 }
      )
    }
    
    // Read CSV content
    const csvContent = await file.text()
    const tasks = parseAsanaCSV(csvContent)
    
    if (tasks.length === 0) {
      return NextResponse.json(
        { error: 'No valid tasks found in CSV' },
        { status: 400 }
      )
    }
    
    // Get project context and ensure .maverick structure exists
    const context = await projectContextService.getProjectContext(projectName)
    
    // Convert tasks to Maverick work items
    const workItems = []
    const importLog = []
    
    for (const task of tasks) {
      try {
        const workItemId = randomUUID()
        const workItem = convertAsanaTaskToWorkItem(task, workItemId, projectName)
        const markdown = generateWorkItemMarkdown(workItem)
        
        // Save to file system
        const filePath = path.join(context.workItemsPath, `${workItemId}.md`)
        await fs.writeFile(filePath, markdown, 'utf-8')
        
        workItems.push(workItem)
        importLog.push(`✅ Imported: ${task.name}`)
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        importLog.push(`❌ Failed to import: ${task.name} - ${errorMessage}`)
      }
    }
    
    // Create import summary
    const summaryPath = path.join(context.maverickPath, 'asana-import-log.md')
    const summary = generateImportSummary(workItems, importLog, file.name)
    await fs.writeFile(summaryPath, summary, 'utf-8')
    
    return NextResponse.json({
      success: true,
      imported: workItems.length,
      total: tasks.length,
      workItems,
      log: importLog,
      summary: `Imported ${workItems.length} of ${tasks.length} tasks`
    })
    
  } catch (error) {
    console.error('Asana import error:', error)
    return NextResponse.json(
      { error: 'Failed to import Asana tasks' },
      { status: 500 }
    )
  }
}

function parseAsanaCSV(csvContent: string) {
  const lines = csvContent.split('\n')
  if (lines.length < 2) return []
  
  // Parse header row
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const tasks = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const values = parseCSVLine(line)
    if (values.length < headers.length) continue
    
    const task: any = {}
    headers.forEach((header, index) => {
      task[header] = values[index] || ''
    })
    
    // Only include tasks with names
    if (task['Task name'] || task['Name'] || task['Task']) {
      tasks.push(task)
    }
  }
  
  return tasks
}

function parseCSVLine(line: string): string[] {
  const result = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

function convertAsanaTaskToWorkItem(task: any, workItemId: string, projectName: string) {
  // Map common Asana fields to Maverick fields
  const name = task['Task name'] || task['Name'] || task['Task'] || 'Untitled Task'
  const description = task['Description'] || task['Notes'] || ''
  const assignee = task['Assignee'] || task['Assigned To'] || ''
  const priority = mapAsanaPriority(task['Priority'] || '')
  const status = mapAsanaStatus(task['Completed'] || task['Status'] || '')
  const dueDate = task['Due Date'] || task['Due'] || ''
  const tags = task['Tags'] || task['Projects'] || ''
  
  return {
    id: workItemId,
    title: name,
    description,
    type: inferTaskType(name, description, tags),
    status,
    priority,
    functionalArea: inferFunctionalArea(tags, description),
    assignedTo: assignee,
    estimatedEffort: inferEffort(description),
    projectName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate,
    tags: tags.split(',').map((t: string) => t.trim()).filter(Boolean),
    importedFrom: 'asana',
    originalData: task
  }
}

function mapAsanaPriority(priority: string): string {
  const p = priority.toLowerCase()
  if (p.includes('high') || p.includes('urgent')) return 'HIGH'
  if (p.includes('medium') || p.includes('normal')) return 'MEDIUM'
  if (p.includes('low')) return 'LOW'
  return 'MEDIUM'
}

function mapAsanaStatus(status: string): string {
  const s = status.toLowerCase()
  if (s === 'true' || s === 'completed' || s === 'done') return 'DONE'
  if (s.includes('progress') || s.includes('working')) return 'IN_PROGRESS'
  if (s.includes('review')) return 'IN_REVIEW'
  return 'PLANNED'
}

function inferTaskType(name: string, description: string, tags: string): string {
  const text = (name + ' ' + description + ' ' + tags).toLowerCase()
  
  if (text.includes('bug') || text.includes('fix') || text.includes('error')) return 'BUG'
  if (text.includes('feature') || text.includes('new') || text.includes('add')) return 'FEATURE'
  if (text.includes('epic') || text.includes('milestone')) return 'EPIC'
  if (text.includes('story')) return 'STORY'
  if (text.includes('subtask') || text.includes('sub-task')) return 'SUBTASK'
  
  return 'TASK'
}

function inferFunctionalArea(tags: string, description: string): string {
  const text = (tags + ' ' + description).toLowerCase()
  
  if (text.includes('marketing') || text.includes('content') || text.includes('campaign')) return 'MARKETING'
  if (text.includes('legal') || text.includes('compliance') || text.includes('contract')) return 'LEGAL'
  if (text.includes('operations') || text.includes('process') || text.includes('admin')) return 'OPERATIONS'
  
  return 'SOFTWARE'
}

function inferEffort(description: string): string {
  const text = description.toLowerCase()
  
  if (text.includes('quick') || text.includes('simple') || text.includes('small')) return '4h'
  if (text.includes('complex') || text.includes('large') || text.includes('major')) return '1w'
  if (text.includes('epic') || text.includes('milestone')) return '2w'
  
  return '1d'
}

function generateWorkItemMarkdown(workItem: any): string {
  const timestamp = new Date().toLocaleDateString('en-US', { 
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
estimatedEffort: "${workItem.estimatedEffort}"
assignedTo: ${workItem.assignedTo || 'null'}
createdAt: ${workItem.createdAt}
updatedAt: ${workItem.updatedAt}
importedFrom: asana
dueDate: ${workItem.dueDate || 'null'}
tags: [${workItem.tags.map((tag: string) => `"${tag}"`).join(', ')}]
---

# ${workItem.title}

## 📋 Description
${workItem.description || 'No description provided in Asana import.'}

## 🏷️ Import Details
- **Imported from:** Asana
- **Original assignee:** ${workItem.assignedTo || 'Unassigned'}
- **Due date:** ${workItem.dueDate || 'Not specified'}
- **Tags:** ${workItem.tags.length > 0 ? workItem.tags.join(', ') : 'None'}

## 📝 Next Steps
- [ ] Review and refine task details
- [ ] Add acceptance criteria if needed
- [ ] Assign to team member
- [ ] Set appropriate timeline

---

## Metadata
- **Created:** ${timestamp}
- **Project:** ${workItem.projectName}
- **Imported by:** Maverick Asana Importer ✨

> _This task was imported from Asana. Review and enhance as needed._
`
}

function generateImportSummary(workItems: any[], log: string[], filename: string): string {
  const timestamp = new Date().toLocaleString()
  const byType = workItems.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1
    return acc
  }, {})
  
  const byStatus = workItems.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {})

  return `# Asana Import Summary

**Import Date:** ${timestamp}  
**Source File:** ${filename}  
**Total Tasks Imported:** ${workItems.length}

## 📊 Import Statistics

### By Type
${Object.entries(byType).map(([type, count]) => `- **${type}:** ${count}`).join('\n')}

### By Status  
${Object.entries(byStatus).map(([status, count]) => `- **${status}:** ${count}`).join('\n')}

## 📋 Import Log
${log.join('\n')}

## 🎯 Next Steps
1. Review imported tasks for accuracy
2. Add missing details and acceptance criteria
3. Assign tasks to appropriate team members
4. Set up development branches for features
5. Begin work according to priority

---

*Generated by Maverick Asana Importer*
`
}