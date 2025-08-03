#!/usr/bin/env node

/**
 * Generate improved feature descriptions using Claude Code
 * Based on the working pattern: claude -p "simple prompt"
 */

const { spawn } = require('child_process')
const { promises: fs } = require('fs')
const path = require('path')

// Simplified, shorter prompts that work better with Claude Code
const featurePrompts = {
  "Project Canvas & Work Item Management": `Describe this React feature: Visual drag-and-drop project canvas with work item management. Components: SimpleWorkItemCanvas, WorkItemDetailSidebar. Include 3 bullet points of key capabilities and mention it handles task organization across stages.`,
  
  "AI-Powered Work Item Analysis": `Describe this AI feature: Structured AI integration using Claude/Gemini APIs that analyzes user input and creates comprehensive work items with tasks, opportunities, and risks. Include JSON response format and multi-provider fallback.`,
  
  "GitHub Repository Integration": `Describe this GitHub feature: Repository import, worktree management, and git-native project storage. Components: GitHubRepositorySelector, WorktreeManager. Include OAuth integration and branch lifecycle management.`,
  
  "Project-Based Navigation & Routing": `Describe this Next.js feature: Hierarchical project navigation with App Router, project-specific sidebars, and clean URLs. Components: ProjectSidebar, CockpitShell. Include responsive design.`,
  
  "Markdown-Based Work Item Storage": `Describe this storage feature: Git-native architecture storing work items as markdown files with YAML frontmatter. Include version control benefits and JSON indexing for performance.`
}

async function callClaudeSimple(prompt) {
  return new Promise((resolve, reject) => {
    const claude = spawn('claude', ['-p', prompt], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env
    })

    let output = ''
    let error = ''

    claude.stdout.on('data', (data) => {
      output += data.toString()
    })

    claude.stderr.on('data', (data) => {
      error += data.toString()
    })

    claude.on('close', (code) => {
      if (code === 0 && output.trim().length > 0) {
        resolve(output.trim())
      } else {
        reject(new Error(`Claude failed: ${error || 'No output'}`))
      }
    })

    claude.on('error', (err) => {
      reject(new Error(`Process error: ${err.message}`))
    })

    // Shorter timeout for simple prompts
    setTimeout(() => {
      claude.kill()
      reject(new Error('Timeout after 60 seconds'))
    }, 60000)
  })
}

async function generateFeatureDescriptions() {
  console.log('🤖 Generating feature descriptions with Claude Code...\n')
  
  const results = []
  
  for (const [featureName, prompt] of Object.entries(featurePrompts)) {
    console.log(`📝 Processing: ${featureName}`)
    
    try {
      console.log('   🚀 Calling Claude Code...')
      const description = await callClaudeSimple(prompt)
      
      results.push({
        feature: featureName,
        description: description,
        success: true,
        length: description.length
      })
      
      console.log(`   ✅ Generated ${description.length} characters`)
      console.log(`   📋 Preview: ${description.substring(0, 100)}...`)
      
      // Small delay between calls
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`)
      results.push({
        feature: featureName,
        error: error.message,
        success: false
      })
    }
  }
  
  // Save results
  const outputDir = path.join(process.cwd(), 'projects', 'maverick', 'ai-logs')
  await fs.mkdir(outputDir, { recursive: true })
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const resultsFile = path.join(outputDir, `feature-descriptions-${timestamp}.json`)
  
  await fs.writeFile(resultsFile, JSON.stringify(results, null, 2), 'utf-8')
  
  console.log(`\n📊 Results Summary:`)
  console.log(`   ✅ Successful: ${results.filter(r => r.success).length}`)
  console.log(`   ❌ Failed: ${results.filter(r => !r.success).length}`)
  console.log(`   📄 Results saved to: ${resultsFile}`)
  
  return results
}

async function updateWorkItemsWithAIDescriptions(results) {
  console.log('\n📝 Updating work items with AI-generated descriptions...')
  
  const projectDir = path.join(process.cwd(), 'projects', 'maverick')
  const indexPath = path.join(projectDir, '.maverick.work-items.json')
  
  try {
    const indexContent = await fs.readFile(indexPath, 'utf-8')
    const index = JSON.parse(indexContent)
    
    let updatedCount = 0
    
    for (const result of results) {
      if (!result.success) continue
      
      // Find the work item
      const workItem = index.items.find(item => item.title === result.feature)
      if (!workItem) continue
      
      const filePath = path.join(projectDir, 'work-items', workItem.filename)
      
      try {
        let content = await fs.readFile(filePath, 'utf-8')
        
        // Update description section
        const descriptionRegex = /## 📋 Description\n[\s\S]*?\n\n\*\*Original Feature Category:/
        content = content.replace(descriptionRegex, `## 📋 Description\n${result.description}\n\n**Original Feature Category:`)
        
        // Update timestamp
        const now = new Date().toISOString()
        content = content.replace(/^updatedAt: .*$/m, `updatedAt: ${now}`)
        
        await fs.writeFile(filePath, content, 'utf-8')
        
        console.log(`   ✅ Updated: ${result.feature}`)
        updatedCount++
        
      } catch (error) {
        console.log(`   ❌ Error updating ${result.feature}: ${error.message}`)
      }
    }
    
    if (updatedCount > 0) {
      // Update index timestamp
      index.lastUpdated = new Date().toISOString()
      await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8')
    }
    
    console.log(`\n🎉 Updated ${updatedCount} work items with AI descriptions!`)
    
  } catch (error) {
    console.error('Error updating work items:', error)
  }
}

async function main() {
  try {
    const results = await generateFeatureDescriptions()
    await updateWorkItemsWithAIDescriptions(results)
    
    console.log('\n✨ Feature description generation complete!')
    console.log('🎯 Visit http://localhost:5001/cockpit/projects/maverick/tasks to see the results!')
    
  } catch (error) {
    console.error('❌ Process failed:', error)
  }
}

main().catch(console.error)