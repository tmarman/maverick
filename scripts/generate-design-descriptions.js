#!/usr/bin/env node

/**
 * Generate AI descriptions for all design files
 * Usage: node scripts/generate-design-descriptions.js
 */

const fs = require('fs').promises
const path = require('path')

const DESIGN_DIR = path.join(__dirname, '..', 'design')
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']

async function generateDescription(imagePath, context = '') {
  try {
    const response = await fetch('http://localhost:5001/api/design/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imagePath: path.relative(process.cwd(), imagePath),
        context
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ ${path.basename(imagePath)}: ${data.existed ? 'Found existing' : 'Generated new'} description`)
      return data
    } else {
      console.error(`❌ ${path.basename(imagePath)}: Failed to generate description`)
      return null
    }
  } catch (error) {
    console.error(`❌ ${path.basename(imagePath)}: ${error.message}`)
    return null
  }
}

async function processDirectory(dirPath) {
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true })
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name)
      
      if (item.isDirectory()) {
        console.log(`📁 Processing directory: ${item.name}`)
        await processDirectory(fullPath)
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase()
        
        if (IMAGE_EXTENSIONS.includes(ext)) {
          // Determine context based on path and filename
          let context = ''
          if (item.name.includes('asana')) {
            context = 'Asana interface reference for task management'
          } else if (item.name.includes('icon')) {
            context = 'Application icon or branding element'
          } else if (item.name.includes('logo') || item.name.includes('textmark')) {
            context = 'Logo or brand identity element'
          } else if (fullPath.includes('feedback')) {
            context = 'User feedback screenshot or design iteration'
          }
          
          await generateDescription(fullPath, context)
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message)
  }
}

async function main() {
  console.log('🎨 Generating design descriptions...')
  console.log(`📂 Processing design directory: ${DESIGN_DIR}`)
  
  try {
    await processDirectory(DESIGN_DIR)
    console.log('✨ Design description generation complete!')
  } catch (error) {
    console.error('❌ Error during processing:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { generateDescription, processDirectory }