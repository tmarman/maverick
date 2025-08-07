#!/usr/bin/env node

/**
 * Test Cosmos DB connection and basic operations
 */

const { CosmosClient } = require('@azure/cosmos')
const { v4: uuidv4 } = require('uuid')

async function testCosmosDB() {
  console.log('🧪 Testing Cosmos DB connection...')

  // Cosmos DB configuration
  const endpoint = process.env.COSMOS_DB_ENDPOINT || 'https://marman.documents.azure.com:443/'
  const key = process.env.COSMOS_DB_KEY || 'your-cosmos-db-key-here'

  console.log(`📍 Endpoint: ${endpoint}`)
  console.log(`🔑 Key: ${key.substring(0, 10)}...`)

  try {
    // Initialize client
    const client = new CosmosClient({ endpoint, key })
    const database = client.database('maverick')
    const tasksContainer = database.container('tasks')
    const projectsContainer = database.container('projects')

    console.log('✅ Cosmos DB client initialized')

    // Test database connection
    const { resource: dbResource } = await database.read()
    console.log(`✅ Connected to database: ${dbResource.id}`)

    // Test containers
    const { resource: tasksContainerResource } = await tasksContainer.read()
    console.log(`✅ Connected to tasks container: ${tasksContainerResource.id}`)

    const { resource: projectsContainerResource } = await projectsContainer.read()
    console.log(`✅ Connected to projects container: ${projectsContainerResource.id}`)

    // Test creating a sample work item
    const testProjectId = 'test-project-' + Date.now()
    const testWorkItem = {
      id: uuidv4(),
      projectId: testProjectId,
      title: 'Test Work Item',
      description: 'This is a test work item to verify Cosmos DB integration',
      type: 'TASK',
      status: 'PLANNED',
      priority: 'MEDIUM',
      functionalArea: 'SOFTWARE',
      orderIndex: 1,
      depth: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test-script'
    }

    console.log('📝 Creating test work item...')
    const { resource: createdItem } = await tasksContainer.items.create(testWorkItem)
    console.log(`✅ Created work item: ${createdItem.id}`)

    // Test querying
    console.log('🔍 Querying work items...')
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.projectId = @projectId',
      parameters: [{ name: '@projectId', value: testProjectId }]
    }
    const { resources: items } = await tasksContainer.items.query(querySpec).fetchAll()
    console.log(`✅ Found ${items.length} work items for project ${testProjectId}`)

    // Clean up test data
    console.log('🧹 Cleaning up test data...')
    await tasksContainer.item(createdItem.id, testProjectId).delete()
    console.log('✅ Test data cleaned up')

    console.log('🎉 Cosmos DB test completed successfully!')

  } catch (error) {
    console.error('❌ Cosmos DB test failed:', error)
    process.exit(1)
  }
}

// Run the test
testCosmosDB().catch(console.error)