// Database Service Layer
// Portable across PostgreSQL, SQL Server, and future Cosmos DB

import { PrismaClient } from '@prisma/client'

// Type definitions for the new models (portable across databases)
export interface CreateOrganizationData {
  name: string
  description?: string
  industry?: string
  organizationType?: string
  location?: string
  legalStructure?: string
  state?: string
  squareServices?: string[] // Will be converted to JSON string for SQL Server
  appType?: string
  appFeatures?: string[] // Will be converted to JSON string for SQL Server
}

export interface CreateProjectData {
  name: string
  description?: string
  type: 'SOFTWARE' | 'MARKETING' | 'OPERATIONS' | 'LEGAL' | 'FINANCIAL' | 'RESEARCH' | 'CONTENT'
  organizationId: string
  githubConfig?: {
    repoUrl?: string
    defaultBranch?: string
    featureBranchPrefix?: string
    codeGenPath?: string
    claudeMdPath?: string
  }
  aiAgentConfig?: {
    preferredAgents?: string[]
    defaultAgent?: string
    autoGenerate?: boolean
  }
}

export interface CreateDocumentData {
  title: string
  type: 'PRD' | 'CANVAS' | 'CHAT' | 'SPEC' | 'CODE_REVIEW' | 'MEETING_NOTES' | 'STRATEGY' | 'RESEARCH' | 'WIREFRAME' | 'LEGAL'
  projectId: string
  createdById: string
  content: {
    // Canvas mode data
    canvasElements?: Array<{
      id: string
      type: 'text' | 'sticky_note' | 'diagram' | 'ai_suggestion'
      position: { x: number, y: number }
      content: any
      aiGenerated?: boolean
    }>
    
    // Chat mode data
    messages?: Array<{
      id: string
      sender: { type: 'user' | 'ai_agent', id: string, name: string }
      content: string
      messageType: 'text' | 'code' | 'image' | 'file'
      timestamp: Date
      aiContext?: any
    }>
    
    // Document mode data
    document?: {
      sections: Array<{
        id: string
        title: string
        content: string
        aiGenerated?: boolean
      }>
    }
  }
  aiContext?: {
    systemPrompt?: string
    conversationHistory?: any[]
    activeAgent?: string
    suggestedActions?: string[]
  }
  collaborationMode?: 'CANVAS' | 'CHAT' | 'HYBRID' | 'DOCUMENT'
}

export interface CreateFeatureData {
  title: string
  description?: string
  projectId: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  acceptanceCriteria?: {
    userStories: string[]
    requirements: string[]
    testCases?: string[]
  }
  assignedToId?: string
  estimatedEffort?: string
}

export interface CreateAIAgentData {
  name: string
  displayName: string
  systemPrompt: string
  specialization: string
  createdById: string
  configuration?: {
    temperature?: number
    maxTokens?: number
    model?: string
    provider?: 'claude' | 'openai' | 'local'
  }
}

// Helper functions for SQL Server JSON handling
function parseJsonField(field: string | null): any {
  if (!field) return null
  try {
    return JSON.parse(field)
  } catch {
    return null
  }
}

function parseJsonArray(field: string | null): any[] {
  if (!field) return []
  try {
    const parsed = JSON.parse(field)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Database service class
export class DatabaseService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  // Business operations
  async createBusiness(userId: string, data: CreateOrganizationData) {
    return this.prisma.organization.create({
      data: {
        name: data.name,
        description: data.description,
        industry: data.industry,
        organizationType: data.organizationType,
        location: data.location,
        legalStructure: data.legalStructure,
        state: data.state,
        // Convert arrays to JSON strings for SQL Server
        squareServices: data.squareServices ? JSON.stringify(data.squareServices) : '[]',
        appType: data.appType,
        appFeatures: data.appFeatures ? JSON.stringify(data.appFeatures) : '[]',
        ownerId: userId,
        status: 'DRAFT'
      },
      include: {
        owner: true,
        projects: true
      }
    })
  }

  async getOrganizationWithProjects(organizationId: string) {
    return this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        owner: true,
        projects: {
          include: {
            documents: true,
            workItems: true
          }
        }
      }
    })
  }

  // Project operations
  async createProject(data: CreateProjectData) {
    return this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        organizationId: data.organizationId,
        // Convert objects to JSON strings for SQL Server
        githubConfig: data.githubConfig ? JSON.stringify(data.githubConfig) : null,
        aiAgentConfig: data.aiAgentConfig ? JSON.stringify(data.aiAgentConfig) : null,
        metadata: null
      },
      include: {
        organization: true,
        documents: true,
        workItems: true
      }
    })
  }

  async getProjectWithDocuments(projectId: string) {
    return this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: true,
        documents: {
          include: {
            createdBy: true
          }
        },
        workItems: {
          include: {
            assignedTo: true
          }
        }
      }
    })
  }

  // Document operations
  async createDocument(data: CreateDocumentData) {
    return this.prisma.document.create({
      data: {
        title: data.title,
        type: data.type,
        projectId: data.projectId,
        createdById: data.createdById,
        // Convert objects to JSON strings for SQL Server
        content: JSON.stringify(data.content),
        aiContext: data.aiContext ? JSON.stringify(data.aiContext) : null,
        settings: null,
        status: 'DRAFT',
        collaborationMode: data.collaborationMode || 'HYBRID'
      },
      include: {
        project: true,
        createdBy: true
      }
    })
  }

  async updateDocumentContent(documentId: string, content: any, aiContext?: any) {
    return this.prisma.document.update({
      where: { id: documentId },
      data: {
        content: JSON.stringify(content),
        aiContext: aiContext ? JSON.stringify(aiContext) : undefined,
        updatedAt: new Date()
      }
    })
  }

  // Feature operations (removed duplicate - using more comprehensive version below)

  /*
  async updateFeatureGitHubInfo(featureId: string, githubData: any) {
    throw new Error('updateFeatureGitHubInfo is deprecated - use WorkItem API instead')
  }
  */

  // AI Agent operations
  async createAIAgent(data: CreateAIAgentData) {
    return this.prisma.aIAgent.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        systemPrompt: data.systemPrompt,
        specialization: data.specialization,
        createdById: data.createdById,
        // Convert configuration to JSON string for SQL Server
        configuration: data.configuration ? JSON.stringify(data.configuration) : null,
        isActive: true
      }
    })
  }

  async getActiveAIAgents() {
    return this.prisma.aIAgent.findMany({
      where: { isActive: true },
      include: {
        createdBy: true
      }
    })
  }

  async getAIAgentByName(name: string) {
    return this.prisma.aIAgent.findUnique({
      where: { name }
    })
  }

  // Search and recommendations
  async searchRecommendations(category?: string, query?: string) {
    const where: any = {}
    
    if (category) {
      where.category = category
    }
    
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } }
      ]
    }

    return this.prisma.recommendation.findMany({
      where,
      orderBy: [
        { confidenceScore: 'desc' },
        { usageCount: 'desc' }
      ]
    })
  }

  // Analytics and insights
  async getOrganizationOverview(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        projects: {
          include: {
            documents: true,
            workItems: true
          }
        }
      }
    })

    if (!organization) return null

    return {
      organization,
      stats: {
        totalProjects: organization.projects.length,
        activeProjects: organization.projects.filter(p => p.status === 'ACTIVE').length,
        totalDocuments: organization.projects.reduce((sum, p) => sum + p.documents.length, 0),
        totalWorkItems: organization.projects.reduce((sum, p) => sum + p.workItems.length, 0),
        completedWorkItems: organization.projects.reduce((sum, p) => 
          sum + p.workItems.filter(f => f.status === 'DONE').length, 0
        )
      }
    }
  }

  // Legacy feature operations - DEPRECATED - Use WorkItem instead
  // TODO: Remove these methods after migrating to WorkItem
  /*
  async createFeature(data: any) {
    throw new Error('createFeature is deprecated - use WorkItem API instead')
  }
  */

  /*
  // Legacy feature methods - DEPRECATED - Use WorkItem API instead
  async getFeature(featureId: string, userEmail: string) {
    throw new Error('getFeature is deprecated - use WorkItem API instead')
  }

  async updateFeature(featureId: string, updates: any) {
    throw new Error('updateFeature is deprecated - use WorkItem API instead')
  }

  async getFeaturesByProduct(productId: string, userEmail: string) {
    throw new Error('getFeaturesByProduct is deprecated - use WorkItem API instead')
  }
  */

  // Get user's accessible companies (businesses)
  async getUserCompanies(userEmail: string) {
    try {
      const userWithBusinesses = await this.prisma.user.findUnique({
        where: { email: userEmail },
        include: {
          ownedOrganizations: {
            include: {
              projects: {
                include: {
                  workItems: {
                    select: {
                      id: true,
                      status: true
                    }
                  }
                }
              }
            }
          },
          organizationMemberships: {
            where: { status: 'ACCEPTED' },
            include: {
              organization: {
                include: {
                  projects: {
                    include: {
                      workItems: {
                        select: {
                          id: true,
                          status: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      })

      if (!userWithBusinesses) return []

      // Combine owned organizations and member organizations
      const allOrganizations = [
        ...userWithBusinesses.ownedOrganizations,
        ...userWithBusinesses.organizationMemberships.map(m => m.organization)
      ]

      // Transform to the expected format
      return allOrganizations.map(organization => ({
        id: organization.id,
        name: organization.name,
        description: organization.description,
        repositoryUrl: null, // This will come from GitHub integration
        products: organization.projects.map(project => ({
          id: project.id,
          name: project.name,
          description: project.description,
          path: `/projects/${project.name}/`,
          submoduleUrl: null, // This will come from GitHub integration
          workItems: project.workItems.map(workItem => ({
            id: workItem.id,
            status: workItem.status.toLowerCase()
          }))
        }))
      }))
    } catch (error) {
      console.error('Failed to get user companies:', error)
      return []
    }
  }

  // User's organizations and projects
  async getUserBusinesses(userId: string) {
    return this.prisma.organization.findMany({
      where: { ownerId: userId },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            updatedAt: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
  }

  // Close connection
  async disconnect() {
    await this.prisma.$disconnect()
  }
}

// Singleton instance
let dbInstance: DatabaseService | null = null

export function getDatabase(): DatabaseService {
  if (!dbInstance) {
    dbInstance = new DatabaseService()
  }
  return dbInstance
}

// Export the singleton for easy access
export const db = getDatabase()