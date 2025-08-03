#!/usr/bin/env node

/**
 * Test our AI provider system (Claude Code/Gemini integration)
 */

const path = require('path')

// We need to run this from the project root and import our TypeScript modules
async function testAIProvider() {
  console.log('🧪 Testing Maverick AI Provider System...\n')
  
  try {
    // Import our AI provider (this requires running from project root)
    const { generateAIResponse } = require('../src/lib/ai-provider.ts')
    
    console.log('✅ Successfully imported AI provider')
    
    // Test simple prompt
    console.log('\n🤖 Testing simple prompt...')
    const simpleResponse = await generateAIResponse(
      'Say hello and confirm you are working',
      'Testing AI provider functionality',
      'auto' // This will try Claude Code first, then Gemini
    )
    
    console.log('Response:', simpleResponse)
    
    // Test feature description generation
    console.log('\n📝 Testing feature description generation...')
    const featureResponse = await generateAIResponse(
      `Generate a realistic, detailed description for this software feature:

Feature: Project Canvas & Work Item Management
Current Description: Visual project canvas where users can create, organize and manage work items
Components: SimpleWorkItemCanvas, WorkItemDetailSidebar, WorkItemManager
Key Files: src/components/SimpleWorkItemCanvas.tsx, src/components/WorkItemDetailSidebar.tsx

Create a comprehensive description (2-3 sentences + 3-5 bullet points) that includes:
1. What the feature does
2. Key capabilities  
3. Current metrics/scale
4. Technical implementation

Be specific and professional. Return only the description text.`,
      'Feature analysis and documentation',
      'auto'
    )
    
    console.log('Feature Description:', featureResponse)
    
    console.log('\n🎉 AI Provider system is working correctly!')
    
  } catch (error) {
    console.error('❌ AI Provider test failed:', error)
    
    // Check if it's a module import issue
    if (error.message.includes('Cannot resolve')) {
      console.log('\n💡 Trying alternative approach with direct CLI...')
      
      // Fall back to direct CLI test
      const { spawn } = require('child_process')
      
      const testPrompt = 'Generate a one-sentence description of a project management feature'
      
      return new Promise((resolve, reject) => {
        const claude = spawn('claude', ['-p', testPrompt], {
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
            console.log('✅ Claude Code CLI working directly:', output.trim())
            resolve()
          } else {
            console.error('❌ Claude Code CLI failed:', error)
            reject(new Error(`Claude Code failed: ${error}`))
          }
        })

        setTimeout(() => {
          claude.kill()
          reject(new Error('Timeout after 2 minutes'))
        }, 120000) // 2 minutes timeout for complex prompts
      })
    }
  }
}

testAIProvider().catch(console.error)