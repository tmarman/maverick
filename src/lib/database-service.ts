// Database Service Layer
// Portable across PostgreSQL, SQL Server, and future Cosmos DB

import { PrismaClient } from '@prisma/client'

// Type definitions for the new models (portable across databases)
export interface CreateBusinessData {
  name: string
  description?: string
  industry?: string
  businessType?: string
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
  businessId: string
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
  async createBusiness(userId: string, data: CreateBusinessData) {
    return this.prisma.business.create({
      data: {
        name: data.name,
        description: data.description,
        industry: data.industry,
        businessType: data.businessType,
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

  async getBusinessWithProjects(businessId: string) {
    return this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        owner: true,
        projects: {
          include: {
            documents: true,
            features: true
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
        businessId: data.businessId,
        // Convert objects to JSON strings for SQL Server
        githubConfig: data.githubConfig ? JSON.stringify(data.githubConfig) : null,
        aiAgentConfig: data.aiAgentConfig ? JSON.stringify(data.aiAgentConfig) : null,
        metadata: null
      },
      include: {
        business: true,
        documents: true,
        features: true
      }
    })
  }

  async getProjectWithDocuments(projectId: string) {
    return this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        business: true,
        documents: {
          include: {
            createdBy: true
          }
        },
        features: {
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

  async updateFeatureGitHubInfo(featureId: string, githubData: {
    issueNumber?: number
    prNumber?: number
    branch?: string
  }) {
    return this.prisma.feature.update({
      where: { id: featureId },
      data: {
        githubIssueNumber: githubData.issueNumber,
        githubPRNumber: githubData.prNumber,
        githubBranch: githubData.branch
      }
    })
  }

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
  async getBusinessOverview(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        projects: {
          include: {
            documents: true,
            features: true
          }
        }
      }
    })

    if (!business) return null

    return {
      business,
      stats: {
        totalProjects: business.projects.length,
        activeProjects: business.projects.filter(p => p.status === 'ACTIVE').length,
        totalDocuments: business.projects.reduce((sum, p) => sum + p.documents.length, 0),
        totalFeatures: business.projects.reduce((sum, p) => sum + p.features.length, 0),
        completedFeatures: business.projects.reduce((sum, p) => 
          sum + p.features.filter(f => f.status === 'DONE').length, 0
        )
      }
    }
  }

  // Feature operations (for cockpit) - Real Prisma implementation
  async createFeature(data: {
    id: string
    title: string
    description?: string
    status: 'planned' | 'in_progress' | 'in_review' | 'done' | 'blocked'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    functionalArea: 'Software' | 'Legal' | 'Operations' | 'Marketing'
    userId: string
    productId: string // This is actually projectId in our schema
    estimatedEffort?: string
    assignee?: string
    chatHistory?: any[]
    createdAt: Date
    updatedAt: Date
  }) {
    try {
      const feature = await this.prisma.feature.create({
        data: {
          id: data.id,
          title: data.title,
          description: data.description,
          status: data.status.toUpperCase(),
          priority: data.priority.toUpperCase(),
          functionalArea: data.functionalArea.toUpperCase(),
          projectId: data.productId, // Map productId to projectId
          estimatedEffort: data.estimatedEffort,
          assignedToId: data.assignee === 'Claude' ? null : data.assignee,
          chatHistory: JSON.stringify(data.chatHistory || []),
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        },
        include: {
          project: true,
          assignedTo: true
        }
      })

      return {
        ...feature,
        chatHistory: feature.chatHistory ? JSON.parse(feature.chatHistory) : [],
        status: feature.status.toLowerCase(),
        priority: feature.priority.toLowerCase(),
        functionalArea: feature.functionalArea
      }
    } catch (error) {
      console.error('Failed to create feature in database:', error)
      // Fallback to in-memory feature
      return {
        ...data,
        chatHistory: data.chatHistory || []
      }
    }
  }

  async getFeature(featureId: string, userEmail: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true }
      })
      
      if (!user) return null

      const feature = await this.prisma.feature.findFirst({
        where: {
          id: featureId,
          project: {
            business: {
              OR: [
                { ownerId: user.id },
                { members: { some: { userId: user.id } } }
              ]
            }
          }
        },
        include: {
          project: true,
          assignedTo: true
        }
      })

      if (!feature) return null

      return {
        ...feature,
        chatHistory: feature.chatHistory ? JSON.parse(feature.chatHistory) : [],
        status: feature.status.toLowerCase(),
        priority: feature.priority.toLowerCase(),
        functionalArea: feature.functionalArea
      }
    } catch (error) {
      console.error('Failed to get feature from database:', error)
      return null
    }
  }

  async updateFeature(featureId: string, updates: {
    chatHistory?: any[]
    updatedAt?: Date
    status?: string
    [key: string]: any
  }) {
    try {
      const updateData: any = {
        updatedAt: updates.updatedAt || new Date()
      }

      if (updates.chatHistory) {
        updateData.chatHistory = JSON.stringify(updates.chatHistory)
      }

      if (updates.status) {
        updateData.status = updates.status.toUpperCase()
      }

      await this.prisma.feature.update({
        where: { id: featureId },
        data: updateData
      })

      return true
    } catch (error) {
      console.error('Failed to update feature in database:', error)
      return false
    }
  }

  async getFeaturesByProduct(productId: string, userEmail: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true }
      })
      
      if (!user) return []

      const features = await this.prisma.feature.findMany({
        where: {
          projectId: productId, // Map productId to projectId
          project: {
            business: {
              OR: [
                { ownerId: user.id },
                { members: { some: { userId: user.id } } }
              ]
            }
          }
        },
        include: {
          assignedTo: true
        },
        orderBy: { createdAt: 'desc' }
      })

      return features.map(feature => ({
        ...feature,
        chatHistory: feature.chatHistory ? JSON.parse(feature.chatHistory) : [],
        status: feature.status.toLowerCase(),
        priority: feature.priority.toLowerCase(),
        functionalArea: feature.functionalArea
      }))
    } catch (error) {
      console.error('Failed to get features from database:', error)
      return []
    }
  }

  // Get user's accessible companies (businesses)
  async getUserCompanies(userEmail: string) {
    try {
      const userWithBusinesses = await this.prisma.user.findUnique({
        where: { email: userEmail },
        include: {
          ownedBusinesses: {
            include: {
              projects: {
                include: {
                  features: {
                    select: {
                      id: true,
                      status: true
                    }
                  }
                }
              }
            }
          },
          businessMemberships: {
            where: { status: 'ACCEPTED' },
            include: {
              business: {
                include: {
                  projects: {
                    include: {
                      features: {
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

      // Combine owned businesses and member businesses
      const allBusinesses = [
        ...userWithBusinesses.ownedBusinesses,
        ...userWithBusinesses.businessMemberships.map(m => m.business)
      ]

      // Transform to the expected format
      return allBusinesses.map(business => ({
        id: business.id,
        name: business.name,
        description: business.description,
        repositoryUrl: null, // This will come from GitHub integration
        products: business.projects.map(project => ({
          id: project.id,
          name: project.name,
          description: project.description,
          path: `/projects/${project.name}/`,
          submoduleUrl: null, // This will come from GitHub integration
          features: project.features.map(feature => ({
            id: feature.id,
            status: feature.status.toLowerCase()
          }))
        }))
      }))
    } catch (error) {
      console.error('Failed to get user companies:', error)
      return []
    }
  }

  // User's businesses and projects
  async getUserBusinesses(userId: string) {
    return this.prisma.business.findMany({
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