/**
 * File System Rehydration Service
 * Rehydrates Cosmos DB from .maverick/ directory structure
 * This keeps the file system as the source of truth while providing Cosmos DB performance
 */

import { promises as fs } from 'fs'
import path from 'path'
import { getCosmosService, WorkItemDocument, ProjectDocument } from './cosmos-db'
import { maverickParser } from './maverick-markdown'
import { v4 as uuidv4 } from 'uuid'

export interface RehydrationResult {
  success: boolean
  projectsProcessed: number
  workItemsProcessed: number
  agentsProcessed: number
  errors: string[]
}

export class RehydrationService {
  private cosmosService = getCosmosService()

  async rehydrateProject(projectPath: string, projectName: string, userId: string, organizationId: string): Promise<RehydrationResult> {
    console.log(`🔄 Starting rehydration for project: ${projectName}`)
    
    const result: RehydrationResult = {
      success: true,
      projectsProcessed: 0,
      workItemsProcessed: 0,
      agentsProcessed: 0,
      errors: []
    }

    try {
      const maverickPath = path.join(projectPath, '.maverick')
      
      // Check if .maverick directory exists
      const maverickExists = await fs.access(maverickPath).then(() => true).catch(() => false)
      if (!maverickExists) {
        console.log('📁 No .maverick directory found, creating fresh project structure')
        await this.createFreshMaverickStructure(maverickPath)
      }

      // Generate project UUID
      const projectUuid = uuidv4()

      // 1. Rehydrate Project Document
      await this.rehydrateProjectDocument(maverickPath, projectName, projectUuid, userId, organizationId)
      result.projectsProcessed = 1

      // 2. Rehydrate Work Items from tasks/ directory
      const workItemsCount = await this.rehydrateWorkItems(maverickPath, projectUuid)
      result.workItemsProcessed = workItemsCount

      // 3. Rehydrate Agents from agents/ directory
      const agentsCount = await this.rehydrateAgents(maverickPath, projectUuid)
      result.agentsProcessed = agentsCount

      console.log(`✅ Rehydration completed for ${projectName}`)
      console.log(`📊 Summary: ${result.projectsProcessed} projects, ${result.workItemsProcessed} work items, ${result.agentsProcessed} agents`)

    } catch (error) {
      console.error(`❌ Rehydration failed for ${projectName}:`, error)
      result.success = false
      result.errors.push(error instanceof Error ? error.message : String(error))
    }

    return result
  }

  private async createFreshMaverickStructure(maverickPath: string): Promise<void> {
    // Create .maverick directory structure
    await fs.mkdir(maverickPath, { recursive: true })
    await fs.mkdir(path.join(maverickPath, 'tasks'), { recursive: true })
    await fs.mkdir(path.join(maverickPath, 'agents'), { recursive: true })
    await fs.mkdir(path.join(maverickPath, 'docs'), { recursive: true })
    await fs.mkdir(path.join(maverickPath, 'chat'), { recursive: true })

    // Create initial project.md
    const projectMd = `# Project Overview

This project was created fresh with Maverick's file-based architecture.

## Quick Start
- Tasks are managed in \`tasks/\` directory
- AI agents are configured in \`agents/\` directory  
- Documentation lives in \`docs/\` directory
- Chat transcripts are saved in \`chat/\` directory

## Smart Snippets
Use smart snippet syntax for interactive elements:
- \`::task[Task Name]{priority="high"}\`
- \`::agent[Agent Name]{type="developer"}\`
- \`::smart-section[Section Name]\`
`

    await fs.writeFile(path.join(maverickPath, 'project.md'), projectMd)
  }

  private async rehydrateProjectDocument(
    maverickPath: string, 
    projectName: string, 
    projectUuid: string, 
    userId: string, 
    organizationId: string
  ): Promise<void> {
    console.log('📁 Rehydrating project document...')

    // Try to read existing project.md
    let description = `AI-native project: ${projectName}`
    try {
      const projectMdPath = path.join(maverickPath, 'project.md')
      const projectMdContent = await fs.readFile(projectMdPath, 'utf-8')
      
      // Extract description from markdown (first paragraph after title)
      const lines = projectMdContent.split('\n')
      const descriptionLine = lines.find(line => line.trim() && !line.startsWith('#') && !line.startsWith('::'))
      if (descriptionLine) {
        description = descriptionLine.trim()
      }
    } catch (error) {
      console.log('📝 No project.md found, using default description')
    }

    const projectDoc: Omit<ProjectDocument, '_rid' | '_self' | '_etag' | '_attachments' | '_ts'> = {
      id: projectUuid,
      projectId: projectUuid,
      name: projectName,
      description,
      type: 'organization-app',
      status: 'active',
      organizationId,
      ownerId: userId,
      settings: {
        defaultBranch: 'main',
        workflowSettings: {
          autoCreateBranches: true,
          requirePullRequests: false
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await this.cosmosService.createProject(projectDoc)
    console.log('✅ Project document created in Cosmos DB')
  }

  private async rehydrateWorkItems(maverickPath: string, projectUuid: string): Promise<number> {
    console.log('📝 Rehydrating work items...')

    const tasksPath = path.join(maverickPath, 'tasks')
    let workItemsCount = 0

    try {
      const taskFiles = await fs.readdir(tasksPath)
      const markdownFiles = taskFiles.filter(file => file.endsWith('.md'))

      for (const file of markdownFiles) {
        try {
          const filePath = path.join(tasksPath, file)
          const content = await fs.readFile(filePath, 'utf-8')
          
          // Parse the markdown content
          const parsed = await maverickParser.parse(content)
          
          // Extract work item data from filename and content
          const workItemId = path.basename(file, '.md')
          const title = this.extractTitle(content) || workItemId
          const description = this.extractDescription(content)
          
          // Extract metadata from smart snippets
          const taskSnippets = parsed.snippets.filter(s => s.type === 'task')
          const priority = taskSnippets[0]?.attributes?.priority || 'MEDIUM'
          const status = taskSnippets[0]?.attributes?.status || 'PLANNED'
          const type = taskSnippets[0]?.attributes?.type || 'TASK'

          const workItemDoc: Omit<WorkItemDocument, '_rid' | '_self' | '_etag' | '_attachments' | '_ts'> = {
            id: workItemId.includes('-') ? workItemId : uuidv4(),
            projectId: projectUuid,
            title,
            description: description || undefined,
            type: type.toUpperCase() as WorkItemDocument['type'],
            status: status.toUpperCase() as WorkItemDocument['status'],
            priority: priority.toUpperCase() as WorkItemDocument['priority'],
            functionalArea: 'SOFTWARE',
            orderIndex: workItemsCount,
            depth: 0,
            markdownContent: content,
            smartSnippets: parsed.snippets.map(s => ({
              type: s.type,
              content: s.text,
              attributes: s.attributes
            })),
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'rehydration'
          }

          await this.cosmosService.createWorkItem(workItemDoc)
          workItemsCount++
          console.log(`✅ Rehydrated work item: ${title}`)

        } catch (error) {
          console.error(`❌ Failed to rehydrate work item from ${file}:`, error)
        }
      }

    } catch (error) {
      console.log('📁 No tasks directory found, creating empty structure')
    }

    return workItemsCount
  }

  private async rehydrateAgents(maverickPath: string, projectUuid: string): Promise<number> {
    console.log('🤖 Rehydrating agents...')

    const agentsPath = path.join(maverickPath, 'agents')
    let agentsCount = 0

    try {
      const agentFiles = await fs.readdir(agentsPath)
      const markdownFiles = agentFiles.filter(file => file.endsWith('.md'))

      for (const file of markdownFiles) {
        try {
          const filePath = path.join(agentsPath, file)
          const content = await fs.readFile(filePath, 'utf-8')
          
          // Parse agent configuration from markdown
          const agentId = path.basename(file, '.md')
          const title = this.extractTitle(content) || agentId
          
          // For now, we'll store agents as special work items with type 'AGENT'
          // Later we can create a dedicated agents container if needed
          const agentDoc: Omit<WorkItemDocument, '_rid' | '_self' | '_etag' | '_attachments' | '_ts'> = {
            id: agentId.includes('-') ? agentId : uuidv4(),
            projectId: projectUuid,
            title,
            description: content,
            type: 'TASK', // We'll use a special marker in functionalArea
            status: 'DONE', // Agents are always "active"
            priority: 'HIGH', // Agents are important
            functionalArea: 'BUSINESS', // Use BUSINESS for agents since they're organization tools
            orderIndex: 9999 + agentsCount, // Put agents at the end
            depth: 0,
            markdownContent: content,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'rehydration'
          }

          await this.cosmosService.createWorkItem(agentDoc)
          agentsCount++
          console.log(`✅ Rehydrated agent: ${title}`)

        } catch (error) {
          console.error(`❌ Failed to rehydrate agent from ${file}:`, error)
        }
      }

    } catch (error) {
      console.log('🤖 No agents directory found, will create during agent setup')
    }

    return agentsCount
  }

  private extractTitle(markdown: string): string | null {
    // Look for first H1 or H2
    const lines = markdown.split('\n')
    for (const line of lines) {
      const match = line.match(/^#\s+(.+)$/) || line.match(/^##\s+(.+)$/)
      if (match) {
        return match[1].trim()
      }
    }
    return null
  }

  private extractDescription(markdown: string): string | null {
    // Get first paragraph that's not a title
    const lines = markdown.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('::') && !trimmed.startsWith('```')) {
        return trimmed
      }
    }
    return null
  }

  // Method to sync changes back from Cosmos to filesystem
  async syncToFileSystem(projectPath: string, projectUuid: string): Promise<void> {
    console.log('💾 Syncing Cosmos DB changes back to file system...')

    const maverickPath = path.join(projectPath, '.maverick')
    const tasksPath = path.join(maverickPath, 'tasks')

    // Get all work items for the project
    const workItems = await this.cosmosService.getWorkItemsByProject(projectUuid)
    
    // Separate regular work items from agents (agents have orderIndex > 9999)
    const regularWorkItems = workItems.filter(item => item.orderIndex < 9999)
    const agents = workItems.filter(item => item.orderIndex >= 9999)

    // Sync work items to tasks/ directory
    await fs.mkdir(tasksPath, { recursive: true })
    for (const workItem of regularWorkItems) {
      const fileName = `${workItem.id}.md`
      const filePath = path.join(tasksPath, fileName)
      
      const content = workItem.markdownContent || this.generateMarkdownFromWorkItem(workItem)
      await fs.writeFile(filePath, content)
    }

    // Sync agents to agents/ directory
    if (agents.length > 0) {
      const agentsPath = path.join(maverickPath, 'agents')
      await fs.mkdir(agentsPath, { recursive: true })
      
      for (const agent of agents) {
        const fileName = `${agent.id}.md`
        const filePath = path.join(agentsPath, fileName)
        await fs.writeFile(filePath, agent.markdownContent || agent.description || '')
      }
    }

    console.log('✅ File system sync completed')
  }

  private generateMarkdownFromWorkItem(workItem: WorkItemDocument): string {
    return `# ${workItem.title}

${workItem.description || ''}

::task[${workItem.title}]{priority="${workItem.priority.toLowerCase()}", status="${workItem.status.toLowerCase()}", type="${workItem.type.toLowerCase()}"}

**Status:** ${workItem.status}
**Priority:** ${workItem.priority}
**Type:** ${workItem.type}
**Functional Area:** ${workItem.functionalArea}

${workItem.estimatedEffort ? `**Estimated Effort:** ${workItem.estimatedEffort}` : ''}

---
*Created: ${workItem.createdAt.toISOString()}*
*Updated: ${workItem.updatedAt.toISOString()}*
`
  }
}

// Singleton instance
let rehydrationService: RehydrationService | null = null

export const getRehydrationService = (): RehydrationService => {
  if (!rehydrationService) {
    rehydrationService = new RehydrationService()
  }
  return rehydrationService
}