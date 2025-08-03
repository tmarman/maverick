#!/usr/bin/env node

/**
 * Test Claude Code with verbose mode and capture detailed output
 * This helps us debug and understand how our AI integration works
 */

const { spawn } = require('child_process')
const { promises: fs } = require('fs')
const path = require('path')

async function testClaudeWithVerbose() {
  console.log('🔍 Testing Claude Code with verbose mode...\n')
  
  // Create logs directory
  const logsDir = path.join(process.cwd(), 'projects', 'maverick', 'ai-logs')
  await fs.mkdir(logsDir, { recursive: true })
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const logFile = path.join(logsDir, `claude-test-${timestamp}.log`)
  
  console.log(`📝 Capturing output to: ${logFile}\n`)
  
  const testPrompt = `You are a technical product manager analyzing a software feature. Generate a realistic, detailed description for this feature:

Feature: Project Canvas & Work Item Management
Current Description: Visual project canvas where users can create, organize and manage work items (features, bugs, tasks). Includes AI-powered smart creation, drag-and-drop organization by stages (Plan, Execute, Review, Complete), and detailed work item sidebar with subtasks and planning.
Components: SimpleWorkItemCanvas, WorkItemDetailSidebar, WorkItemManager
Key Files: src/components/SimpleWorkItemCanvas.tsx, src/components/WorkItemDetailSidebar.tsx, src/app/api/projects/[name]/work-items/

Create a comprehensive feature description that includes:
1. What the feature does (2-3 sentences)
2. Key capabilities (3-5 bullet points using • )
3. Current metrics/scale (realistic numbers)
4. Technical implementation details

Format: Single paragraph followed by bullet points. Be specific, realistic, and professional.
Return only the description text, no JSON or extra formatting.`

  return new Promise(async (resolve, reject) => {
    console.log('🚀 Starting Claude Code with verbose mode...')
    
    // Use verbose mode to capture detailed output
    const claude = spawn('claude', ['--verbose', '-p', testPrompt], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env
    })

    let stdout = ''
    let stderr = ''
    let allOutput = []

    // Capture all output with timestamps
    claude.stdout.on('data', (data) => {
      const chunk = data.toString()
      stdout += chunk
      allOutput.push({
        timestamp: new Date().toISOString(),
        type: 'stdout',
        data: chunk
      })
      // Show progress
      if (chunk.trim()) {
        console.log('📤 Output chunk received')
      }
    })

    claude.stderr.on('data', (data) => {
      const chunk = data.toString()
      stderr += chunk
      allOutput.push({
        timestamp: new Date().toISOString(),
        type: 'stderr', 
        data: chunk
      })
      // Show verbose/debug info
      if (chunk.trim()) {
        console.log('🔍 Verbose/Debug:', chunk.trim())
      }
    })

    claude.on('close', async (code) => {
      console.log(`\n🏁 Claude Code finished with exit code: ${code}`)
      
      // Create comprehensive log
      const logData = {
        timestamp: new Date().toISOString(),
        prompt: testPrompt,
        exitCode: code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        allOutput,
        success: code === 0 && stdout.trim().length > 0,
        outputLength: stdout.trim().length,
        duration: Date.now() - startTime
      }
      
      // Save detailed log
      await fs.writeFile(logFile, JSON.stringify(logData, null, 2), 'utf-8')
      console.log(`💾 Detailed log saved to: ${logFile}`)
      
      if (code === 0 && stdout.trim().length > 0) {
        console.log('\n✅ Claude Code SUCCESS!')
        console.log('\n📋 Generated Description:')
        console.log('---')
        console.log(stdout.trim())
        console.log('---')
        resolve(stdout.trim())
      } else {
        console.log('\n❌ Claude Code FAILED!')
        console.log('Exit code:', code)
        console.log('Stderr:', stderr)
        reject(new Error(`Claude Code failed with exit code ${code}: ${stderr}`))
      }
    })

    claude.on('error', async (err) => {
      console.log('\n💥 Process Error:', err.message)
      
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: err.message,
        prompt: testPrompt,
        type: 'process_error'
      }
      
      await fs.writeFile(logFile.replace('.log', '-error.log'), JSON.stringify(errorLog, null, 2), 'utf-8')
      reject(new Error(`Failed to spawn Claude Code: ${err.message}`))
    })

    const startTime = Date.now()
    
    // Extended timeout for complex prompts
    setTimeout(() => {
      console.log('\n⏰ Timeout reached, killing process...')
      claude.kill('SIGTERM')
      reject(new Error('Claude Code timeout after 4 minutes'))
    }, 240000) // 4 minutes
  })
}

async function createAILogsSummary() {
  const logsDir = path.join(process.cwd(), 'projects', 'maverick', 'ai-logs')
  const summaryFile = path.join(logsDir, 'AI_LOGS_README.md')
  
  const readme = `# AI Provider Logs

This directory contains detailed logs from our AI provider testing and usage.

## Files
- \`claude-test-*.log\` - Detailed Claude Code test logs with verbose output
- \`claude-test-*-error.log\` - Error logs when Claude Code fails
- \`AI_LOGS_README.md\` - This file

## Log Structure
Each log file contains:
- \`timestamp\` - When the test was run
- \`prompt\` - The exact prompt sent to Claude Code
- \`exitCode\` - Process exit code (0 = success)
- \`stdout\` - Claude Code's response
- \`stderr\` - Verbose/debug output from Claude Code
- \`allOutput\` - Timestamped array of all output chunks
- \`success\` - Whether the test succeeded
- \`outputLength\` - Length of generated response
- \`duration\` - How long the request took (milliseconds)

## Usage
These logs help us:
1. Debug Claude Code integration issues
2. Understand response times and performance
3. Improve our AI prompts
4. Monitor AI provider reliability
5. Analyze output quality

## Azure Storage
Future enhancement: Upload logs to Azure Storage for team collaboration and long-term analysis.
`

  await fs.writeFile(summaryFile, readme, 'utf-8')
  console.log(`📖 Created logs README: ${summaryFile}`)
}

async function main() {
  try {
    await createAILogsSummary()
    await testClaudeWithVerbose()
    
    console.log('\n🎉 Test completed successfully!')
    console.log('💡 Check the ai-logs directory for detailed output analysis')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.log('💡 Check the ai-logs directory for error details')
  }
}

main().catch(console.error)