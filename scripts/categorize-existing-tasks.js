#!/usr/bin/env node

/**
 * One-time script to categorize all existing tasks using smart categorization
 */

const fs = require('fs')
const path = require('path')

// Load categories from .maverick/categories.md file
function loadCategories() {
  const categoriesPath = '.maverick/categories.md'
  
  try {
    const content = fs.readFileSync(categoriesPath, 'utf-8')
    const categories = []
    
    // Parse markdown sections
    const sections = content.split('### ').slice(1) // Skip header
    
    for (const section of sections) {
      const lines = section.split('\n')
      const name = lines[0].trim()
      
      // Skip the "Custom Categories" section
      if (name === 'Custom Categories') continue
      
      let id = ''
      let color = ''
      let description = ''
      let keywords = []
      
      for (const line of lines.slice(1)) {
        if (line.startsWith('- **ID**:')) {
          id = line.replace('- **ID**:', '').replace(/`/g, '').trim()
        } else if (line.startsWith('- **Color**:')) {
          color = line.replace('- **Color**:', '').replace(/`/g, '').trim()
        } else if (line.startsWith('- **Description**:')) {
          description = line.replace('- **Description**:', '').trim()
        } else if (line.startsWith('- **Keywords**:')) {
          const keywordText = line.replace('- **Keywords**:', '').trim()
          keywords = keywordText.split(',').map(k => k.trim())
        }
      }
      
      if (id && name && color) {
        categories.push({
          id,
          name,
          description,
          color,
          keywords
        })
      }
    }
    
    return categories
  } catch (error) {
    console.error('Error loading categories from .maverick/categories.md:', error)
    console.log('Using fallback categories...')
    // Fallback categories
    return [
      {
        id: 'general',
        name: 'General',
        description: 'General work items',
        color: '#6B7280',
        keywords: []
      }
    ]
  }
}

// Smart categorization logic using dynamic categories
const categorizeTask = (title, description = '', type = '', functionalArea = '', categories) => {
  const content = `${title} ${description} ${type} ${functionalArea}`.toLowerCase()

  const matchesKeywords = (content, keywords) => {
    return keywords.some(keyword => content.includes(keyword.toLowerCase()))
  }
  
  let bestMatch = null
  let bestScore = 0
  
  // Score each category based on keyword matches and description
  for (const category of categories) {
    let score = 0
    
    // Check keywords from category definition
    if (category.keywords && category.keywords.length > 0) {
      for (const keyword of category.keywords) {
        if (content.includes(keyword.toLowerCase())) {
          score += 2 // Strong keyword match
        }
      }
    }
    
    // Check category name words
    const categoryWords = category.name.toLowerCase().split(/[\s&\-]+/)
    for (const word of categoryWords) {
      if (word.length > 2 && content.includes(word)) {
        score += 1 // Name word match
      }
    }
    
    // Check description words
    if (category.description) {
      const descWords = category.description.toLowerCase().split(/[\s,\.]+/)
      for (const word of descWords) {
        if (word.length > 3 && content.includes(word)) {
          score += 0.5 // Description word match
        }
      }
    }
    
    if (score > bestScore) {
      bestMatch = category
      bestScore = score
    }
  }
  
  // Return best match if confident, otherwise first category
  if (bestMatch && bestScore >= 2) {
    return bestMatch
  }
  
  return categories[0] || { id: 'general', name: 'General', description: 'General work items', color: '#6B7280' }
}

async function categorizeAllTasks() {
  const workItemsDir = '.maverick/work-items'
  
  console.log('🤖 Starting smart categorization of all existing tasks...')
  
  try {
    // Load categories from categories.md
    console.log('📂 Loading categories from .maverick/categories.md...')
    const categories = loadCategories()
    console.log(`✅ Loaded ${categories.length} categories:`)
    categories.forEach(cat => console.log(`   - ${cat.name} (${cat.id})`))
    
    // Read all work item files (both .json and .md)
    const files = fs.readdirSync(workItemsDir).filter(file => file.endsWith('.md') || file.endsWith('.json'))
    console.log(`📁 Found ${files.length} work item files`)
    
    let categorizedCount = 0
    const categoryStats = {}
    
    for (const file of files) {
      const filePath = path.join(workItemsDir, file)
      
      let workItem
      if (file.endsWith('.json')) {
        workItem = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      } else {
        // Handle markdown files - read content and extract title from filename or first line
        const content = fs.readFileSync(filePath, 'utf8')
        const title = file.replace('.md', '').replace(/[_-]/g, ' ')
        workItem = {
          title,
          description: content.slice(0, 500), // First 500 chars as description
          type: 'TASK',
          functionalArea: 'SOFTWARE'
        }
      }
      
      // Skip if already has smart category metadata
      if (workItem.smartCategory) {
        continue
      }
      
      // Apply smart categorization using loaded categories
      const category = categorizeTask(
        workItem.title || '',
        workItem.description || '',
        workItem.type || '',
        workItem.functionalArea || '',
        categories
      )
      
      // Add smart categorization metadata
      const categoryMetadata = {
        id: category.id,
        name: category.name,
        team: category.name, // Use category name as team
        color: category.color,
        categorizedAt: new Date().toISOString()
      }
      
      if (file.endsWith('.json')) {
        workItem.smartCategory = categoryMetadata
        fs.writeFileSync(filePath, JSON.stringify(workItem, null, 2))
      } else {
        // For markdown files, add frontmatter
        const content = fs.readFileSync(filePath, 'utf8')
        const frontmatter = `---
smartCategory:
  id: ${categoryMetadata.id}
  name: ${categoryMetadata.name}
  team: ${categoryMetadata.team}
  color: ${categoryMetadata.color}
  categorizedAt: ${categoryMetadata.categorizedAt}
---

${content.replace(/^---[\s\S]*?---\n?/, '')}`
        fs.writeFileSync(filePath, frontmatter)
      }
      
      // Track stats
      categoryStats[category.name] = (categoryStats[category.name] || 0) + 1
      categorizedCount++
      
      console.log(`✅ ${workItem.title} → ${category.name}`)
    }
    
    console.log(`\n🎉 Categorization complete!`)
    console.log(`📊 Processed ${categorizedCount} tasks:`)
    
    Object.entries(categoryStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([categoryName, count]) => {
        console.log(`   ${categoryName}: ${count} tasks`)
      })
      
  } catch (error) {
    console.error('❌ Error categorizing tasks:', error)
  }
}

// Run the categorization
categorizeAllTasks()