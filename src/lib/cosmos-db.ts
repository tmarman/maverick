/**
 * Cosmos DB Service for Maverick Platform
 * Handles document operations with UUID-based architecture
 */

import { CosmosClient, Database, Container, FeedResponse } from '@azure/cosmos'

export interface WorkItemDocument {
  id: string // UUID
  projectId: string // Partition key
  title: string
  description?: string
  type: 'FEATURE' | 'BUG' | 'TASK' | 'EPIC'
  status: 'PLANNED' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  functionalArea: 'SOFTWARE' | 'DESIGN' | 'MARKETING' | 'BUSINESS'
  estimatedEffort?: string
  assignedToId?: string
  parentId?: string
  orderIndex: number
  depth: number
  worktreeName?: string
  githubBranch?: string
  worktreeStatus?: string
  
  // Cosmos DB metadata
  _rid?: string
  _self?: string
  _etag?: string
  _attachments?: string
  _ts?: number
  
  // Maverick metadata
  markdownContent?: string
  smartSnippets?: Array<{
    type: string
    content: string
    attributes?: Record<string, string>
  }>
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy?: string
  
  // Relationships for graph queries
  relationships?: {
    dependsOn?: string[]
    blocks?: string[]
    relatedTo?: string[]
    childTasks?: string[]
  }
}

export interface ProjectDocument {
  id: string // UUID
  projectId: string // Same as ID for partition key consistency
  name: string
  description?: string
  type: string
  status: string
  repositoryUrl?: string
  organizationId: string
  ownerId: string
  
  // Project metadata
  settings?: {
    defaultBranch?: string
    workflowSettings?: Record<string, any>
    aiAgents?: Array<{
      id: string
      name: string
      type: string
      configuration: Record<string, any>
    }>
  }
  
  createdAt: Date
  updatedAt: Date
}

class CosmosDBService {
  private client: CosmosClient
  private database: Database
  private workItemsContainer: Container
  private projectsContainer: Container
  
  constructor() {
    const endpoint = process.env.COSMOS_DB_ENDPOINT
    const key = process.env.COSMOS_DB_KEY
    
    if (!endpoint || !key) {
      throw new Error('Cosmos DB configuration missing. Set COSMOS_DB_ENDPOINT and COSMOS_DB_KEY environment variables.')
    }
    
    this.client = new CosmosClient({ endpoint, key })
    this.database = this.client.database('maverick')
    this.workItemsContainer = this.database.container('tasks')
    this.projectsContainer = this.database.container('projects')
  }
  
  // Work Items Operations
  async createWorkItem(workItem: Omit<WorkItemDocument, '_rid' | '_self' | '_etag' | '_attachments' | '_ts'>): Promise<WorkItemDocument> {
    const { resource } = await this.workItemsContainer.items.create(workItem)
    return resource as WorkItemDocument
  }
  
  async getWorkItem(id: string, projectId: string): Promise<WorkItemDocument | null> {
    try {
      const { resource } = await this.workItemsContainer.item(id, projectId).read<WorkItemDocument>()
      return resource || null
    } catch (error: any) {
      if (error.code === 404) return null
      throw error
    }
  }
  
  async getWorkItemsByProject(projectId: string): Promise<WorkItemDocument[]> {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.projectId = @projectId ORDER BY c.orderIndex ASC',
      parameters: [{ name: '@projectId', value: projectId }]
    }
    
    const { resources } = await this.workItemsContainer.items.query<WorkItemDocument>(querySpec).fetchAll()
    return resources
  }
  
  async updateWorkItem(workItem: WorkItemDocument): Promise<WorkItemDocument> {
    workItem.updatedAt = new Date()
    const { resource } = await this.workItemsContainer.item(workItem.id, workItem.projectId).replace(workItem)
    return resource as WorkItemDocument
  }
  
  async deleteWorkItem(id: string, projectId: string): Promise<void> {
    await this.workItemsContainer.item(id, projectId).delete()
  }
  
  // Advanced Queries
  async getWorkItemsByStatus(projectId: string, status: WorkItemDocument['status']): Promise<WorkItemDocument[]> {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.projectId = @projectId AND c.status = @status ORDER BY c.orderIndex ASC',
      parameters: [
        { name: '@projectId', value: projectId },
        { name: '@status', value: status }
      ]
    }
    
    const { resources } = await this.workItemsContainer.items.query<WorkItemDocument>(querySpec).fetchAll()
    return resources
  }
  
  async getWorkItemDependencies(workItemId: string, projectId: string): Promise<{
    dependsOn: WorkItemDocument[]
    blocks: WorkItemDocument[]
    relatedTo: WorkItemDocument[]
  }> {
    const workItem = await this.getWorkItem(workItemId, projectId)
    if (!workItem?.relationships) {
      return { dependsOn: [], blocks: [], relatedTo: [] }
    }
    
    const fetchRelated = async (ids: string[]) => {
      if (!ids.length) return []
      const querySpec = {
        query: `SELECT * FROM c WHERE c.projectId = @projectId AND c.id IN (${ids.map((_, i) => `@id${i}`).join(',')})`,
        parameters: [
          { name: '@projectId', value: projectId },
          ...ids.map((id, i) => ({ name: `@id${i}`, value: id }))
        ]
      }
      const { resources } = await this.workItemsContainer.items.query<WorkItemDocument>(querySpec).fetchAll()
      return resources
    }
    
    const [dependsOn, blocks, relatedTo] = await Promise.all([
      fetchRelated(workItem.relationships.dependsOn || []),
      fetchRelated(workItem.relationships.blocks || []),
      fetchRelated(workItem.relationships.relatedTo || [])
    ])
    
    return { dependsOn, blocks, relatedTo }
  }
  
  // Project Operations
  async createProject(project: Omit<ProjectDocument, '_rid' | '_self' | '_etag' | '_attachments' | '_ts'>): Promise<ProjectDocument> {
    const { resource } = await this.projectsContainer.items.create(project)
    return resource as ProjectDocument
  }
  
  async getProject(id: string): Promise<ProjectDocument | null> {
    try {
      const { resource } = await this.projectsContainer.item(id, id).read<ProjectDocument>()
      return resource || null
    } catch (error: any) {
      if (error.code === 404) return null
      throw error
    }
  }
  
  async getProjectByName(name: string, organizationId: string): Promise<ProjectDocument | null> {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.name = @name AND c.organizationId = @organizationId',
      parameters: [
        { name: '@name', value: name },
        { name: '@organizationId', value: organizationId }
      ]
    }
    
    const { resources } = await this.projectsContainer.items.query<ProjectDocument>(querySpec).fetchAll()
    return resources[0] || null
  }
  
  // Migration helpers
  async migrateFromPrisma(prismaWorkItems: any[]): Promise<void> {
    console.log(`🔄 Starting migration of ${prismaWorkItems.length} work items to Cosmos DB...`)
    
    for (const item of prismaWorkItems) {
      try {
        const cosmosWorkItem: WorkItemDocument = {
          id: item.uuid || require('uuid').v4(), // Use existing UUID or generate new one
          projectId: item.projectId,
          title: item.title,
          description: item.description,
          type: item.type,
          status: item.status,
          priority: item.priority,
          functionalArea: item.functionalArea,
          estimatedEffort: item.estimatedEffort,
          assignedToId: item.assignedToId,
          parentId: item.parentId,
          orderIndex: item.orderIndex,
          depth: item.depth,
          worktreeName: item.worktreeName,
          githubBranch: item.githubBranch,
          worktreeStatus: item.worktreeStatus,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
          createdBy: item.createdBy || 'migration',
        }
        
        await this.createWorkItem(cosmosWorkItem)
        console.log(`✅ Migrated work item: ${item.title}`)
        
      } catch (error) {
        console.error(`❌ Failed to migrate work item ${item.id}: ${item.title}`, error)
      }
    }
    
    console.log('🎉 Migration completed!')
  }
}

// Singleton instance
let cosmosService: CosmosDBService | null = null

export const getCosmosService = (): CosmosDBService => {
  if (!cosmosService) {
    cosmosService = new CosmosDBService()
  }
  return cosmosService
}

export default CosmosDBService