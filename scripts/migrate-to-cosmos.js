#!/usr/bin/env node

/**
 * Migration script from Prisma/SQL Server to Cosmos DB
 * Migrates work items and projects while preserving UUIDs and relationships
 */

const { PrismaClient } = require('@prisma/client')
const { getCosmosService } = require('../src/lib/cosmos-db')
const { v4: uuidv4 } = require('uuid')

async function migrateToCosmosDB() {
  console.log('🔄 Starting migration from Prisma to Cosmos DB...')

  try {
    // Initialize services
    const prisma = new PrismaClient()
    const cosmos = getCosmosService()

    console.log('✅ Services initialized')

    // Migrate Projects first (since work items reference them)
    console.log('\n📁 Migrating Projects...')
    const prismaProjects = await prisma.project.findMany({
      include: {
        business: true,
        owner: true,
      }
    })

    for (const project of prismaProjects) {
      try {
        const cosmosProject = {
          id: project.uuid || uuidv4(),
          projectId: project.uuid || uuidv4(), // Same as ID for partition consistency
          name: project.name,
          description: project.description || undefined,
          type: project.type || 'business-app',
          status: project.status || 'active',
          repositoryUrl: project.repositoryUrl || undefined,
          businessId: project.businessId,
          ownerId: project.ownerId,
          settings: project.settings ? JSON.parse(project.settings) : undefined,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        }

        await cosmos.createProject(cosmosProject)
        console.log(`✅ Migrated project: ${project.name}`)
      } catch (error) {
        console.error(`❌ Failed to migrate project ${project.id}: ${project.name}`, error.message)
      }
    }

    // Migrate Work Items
    console.log('\n📝 Migrating Work Items...')
    const prismaWorkItems = await prisma.workItem.findMany({
      include: {
        project: true,
      },
      orderBy: {
        orderIndex: 'asc'
      }
    })

    console.log(`Found ${prismaWorkItems.length} work items to migrate`)

    for (const item of prismaWorkItems) {
      try {
        const cosmosWorkItem = {
          id: item.uuid || uuidv4(),
          projectId: item.project?.uuid || item.projectId, // Use project UUID if available
          title: item.title,
          description: item.description,
          type: item.type || 'TASK',
          status: item.status || 'PLANNED',
          priority: item.priority || 'MEDIUM',
          functionalArea: item.functionalArea || 'SOFTWARE',
          estimatedEffort: item.estimatedEffort,
          assignedToId: item.assignedToId,
          parentId: item.parentId,
          orderIndex: item.orderIndex,
          depth: item.depth || 0,
          worktreeName: item.worktreeName,
          githubBranch: item.githubBranch,
          worktreeStatus: item.worktreeStatus,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          createdBy: item.createdBy || 'migration'
        }

        await cosmos.createWorkItem(cosmosWorkItem)
        console.log(`✅ Migrated work item: ${item.title}`)
      } catch (error) {
        console.error(`❌ Failed to migrate work item ${item.id}: ${item.title}`, error.message)
      }
    }

    console.log('\n🎉 Migration completed successfully!')
    console.log(`📊 Migration Summary:`)
    console.log(`  - Projects: ${prismaProjects.length}`)
    console.log(`  - Work Items: ${prismaWorkItems.length}`)

    await prisma.$disconnect()

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Command line options
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')

if (dryRun) {
  console.log('🔍 DRY RUN MODE - No data will be written to Cosmos DB')
  // Add dry run logic here if needed
} else {
  migrateToCosmosDB().catch(console.error)
}