#!/usr/bin/env node

/**
 * Update the states of populated features to reflect their actual status
 * These are existing, active features so they should be in appropriate states
 */

const { promises: fs } = require('fs')
const path = require('path')

// Define appropriate states for different types of features
const featureStates = {
  "Project Canvas & Work Item Management": "ACTIVE", 
  "AI-Powered Work Item Analysis": "ACTIVE",
  "GitHub Repository Integration": "ACTIVE",
  "Project-Based Navigation & Routing": "ACTIVE", 
  "Markdown-Based Work Item Storage": "ACTIVE",
  "Claude Code Terminal Integration": "ACTIVE",
  "Business Formation Workflow": "TESTING", // Could use some polish
  "Document Canvas & Collaboration": "ACTIVE",
  "Multi-AI Provider System": "ACTIVE",
  "Presentation Generator": "TESTING", // Functional but could be enhanced
  "Authentication & Session Management": "ACTIVE",
  "Project Insights & Analytics": "IN_PROGRESS" // Just created
}

async function updateFeatureStates() {
  console.log('🔄 Updating feature states to reflect actual status...\n')
  
  const projectDir = path.join(process.cwd(), 'projects', 'maverick')
  const indexPath = path.join(projectDir, '.maverick.work-items.json')
  
  // Read the index
  const indexContent = await fs.readFile(indexPath, 'utf-8')
  const index = JSON.parse(indexContent)
  
  let updatedCount = 0
  
  // Update each work item file
  for (const item of index.items) {
    const filePath = path.join(projectDir, 'work-items', item.filename)
    
    try {
      let content = await fs.readFile(filePath, 'utf-8')
      const currentStatus = featureStates[item.title]
      
      if (currentStatus) {
        // Update frontmatter status
        content = content.replace(/^status: ACTIVE$/m, `status: ${currentStatus}`)
        
        // Update the status in the classification section
        content = content.replace(
          /- \*\*Current Status:\*\* ACTIVE/g, 
          `- **Current Status:** ${currentStatus}`
        )
        
        // Update updated timestamp
        const now = new Date().toISOString()
        content = content.replace(
          /^updatedAt: .*$/m,
          `updatedAt: ${now}`
        )
        
        await fs.writeFile(filePath, content, 'utf-8')
        
        // Update index
        const indexItem = index.items.find(i => i.id === item.id)
        if (indexItem) {
          indexItem.status = currentStatus
        }
        
        console.log(`✅ ${item.title} → ${currentStatus}`)
        updatedCount++
      }
    } catch (error) {
      console.error(`❌ Error updating ${item.title}:`, error.message)
    }
  }
  
  // Update the index file
  index.lastUpdated = new Date().toISOString()
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8')
  
  console.log(`\n🎉 Updated ${updatedCount} feature states!`)
  console.log('\n📊 Status Distribution:')
  
  const statusCounts = {}
  index.items.forEach(item => {
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1
  })
  
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   • ${status}: ${count} features`)
  })
  
  console.log('\n🎯 Now visit http://localhost:5001/cockpit/projects/maverick/tasks to see realistic feature states!')
}

updateFeatureStates().catch(console.error)