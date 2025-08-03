#!/usr/bin/env node

/**
 * Update work items with manually collected Claude Code descriptions
 * Run this after collecting the descriptions manually
 */

const { promises: fs } = require('fs')
const path = require('path')

// Paste the Claude Code results here after running the commands
const featureDescriptions = {
  "Project Canvas & Work Item Management": `[PASTE CLAUDE OUTPUT HERE]`,
  "AI-Powered Work Item Analysis": `[PASTE CLAUDE OUTPUT HERE]`,
  "GitHub Repository Integration": `[PASTE CLAUDE OUTPUT HERE]`,
  "Project-Based Navigation & Routing": `[PASTE CLAUDE OUTPUT HERE]`,
  "Markdown-Based Work Item Storage": `[PASTE CLAUDE OUTPUT HERE]`
}

async function updateWorkItems() {
  console.log('📝 Updating work items with Claude Code descriptions...')
  
  const projectDir = path.join(process.cwd(), 'projects', 'maverick')
  const indexPath = path.join(projectDir, '.maverick.work-items.json')
  
  const indexContent = await fs.readFile(indexPath, 'utf-8')
  const index = JSON.parse(indexContent)
  
  let updatedCount = 0
  
  for (const [featureName, description] of Object.entries(featureDescriptions)) {
    if (description.includes('[PASTE CLAUDE OUTPUT HERE]')) {
      console.log(`⏭️  Skipping ${featureName} - no description provided`)
      continue
    }
    
    const workItem = index.items.find(item => item.title === featureName)
    if (!workItem) continue
    
    const filePath = path.join(projectDir, 'work-items', workItem.filename)
    
    try {
      let content = await fs.readFile(filePath, 'utf-8')
      
      // Update description section
      const descriptionRegex = /## 📋 Description\n[\s\S]*?\n\n\*\*Original Feature Category:/
      content = content.replace(descriptionRegex, `## 📋 Description\n${description}\n\n**Original Feature Category:`)
      
      // Update timestamp
      const now = new Date().toISOString()
      content = content.replace(/^updatedAt: .*$/m, `updatedAt: ${now}`)
      
      await fs.writeFile(filePath, content, 'utf-8')
      
      console.log(`✅ Updated: ${featureName}`)
      updatedCount++
      
    } catch (error) {
      console.log(`❌ Error updating ${featureName}: ${error.message}`)
    }
  }
  
  if (updatedCount > 0) {
    index.lastUpdated = new Date().toISOString()
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8')
  }
  
  console.log(`\n🎉 Updated ${updatedCount} work items!`)
}

updateWorkItems().catch(console.error)