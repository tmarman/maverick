#!/usr/bin/env node

/**
 * Test Claude Code in proper project context and prepare for username system
 */

const { spawn } = require('child_process')
const { promises: fs } = require('fs')
const path = require('path')

async function testClaudeInProjectContext() {
  console.log('🏗️  Testing Claude Code in proper project context...\n')
  
  // Run Claude Code from the actual project directory where it has full context
  const projectDir = process.cwd() // This should be /Users/tim/dev/square/maverick
  console.log(`📁 Project directory: ${projectDir}`)
  
  // Create output directory for logs
  const outputDir = path.join(projectDir, 'projects', 'maverick', 'ai-logs')
  await fs.mkdir(outputDir, { recursive: true })
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  
  // Test 1: Simple context test
  console.log('\n🧪 Test 1: Context awareness test...')
  await testClaudePrompt(
    'You are working on the Maverick project. List 3 files you can see in this codebase and briefly describe what each does.',
    'context-test',
    projectDir,
    outputDir,
    timestamp
  )
  
  // Test 2: Feature description generation (the real use case)
  console.log('\n🧪 Test 2: Feature description generation...')
  await testClaudePrompt(
    `You are a technical product manager analyzing the Maverick codebase. Generate a realistic, detailed description for this feature:

Feature: Project Canvas & Work Item Management
Current Description: Visual project canvas where users can create, organize and manage work items
Components: SimpleWorkItemCanvas, WorkItemDetailSidebar, WorkItemManager
Key Files: src/components/SimpleWorkItemCanvas.tsx, src/components/WorkItemDetailSidebar.tsx

Based on the actual code you can see in this project, create a comprehensive description that includes:
1. What the feature actually does (2-3 sentences based on the code)
2. Key capabilities (3-5 bullet points using • )
3. Current implementation details you can observe
4. Technical architecture from the codebase

Be specific and reference actual code patterns you see. Return only the description text.`,
    'feature-description',
    projectDir,
    outputDir,
    timestamp
  )
  
  // Test 3: Username system design
  console.log('\n🧪 Test 3: Username system design...')
  await testClaudePrompt(
    `You are designing a GitHub-style username system for the Maverick platform. Looking at the current codebase, design how to implement:

1. Username format: @tim, @jack style usernames
2. User profiles similar to GitHub profiles
3. Integration with existing NextAuth system
4. Database schema changes needed
5. How usernames integrate with work items and collaboration

Based on the current authentication system you can see in src/lib/auth.ts and the project structure, provide a technical implementation plan with specific file changes and database schema updates.

Return as structured markdown with clear sections.`,
    'username-system-design',
    projectDir,
    outputDir,
    timestamp
  )
}

async function testClaudePrompt(prompt, testName, workingDir, outputDir, timestamp) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Running ${testName}...`)
    
    const logFile = path.join(outputDir, `${testName}-${timestamp}.log`)
    const outputFile = path.join(outputDir, `${testName}-${timestamp}-response.md`)
    
    // Run Claude Code in the project directory with verbose mode
    const claude = spawn('claude', ['--verbose', '-p', prompt], {
      cwd: workingDir, // This is key - run in project context!
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        // Ensure Claude Code has access to project files
        CLAUDE_PROJECT_ROOT: workingDir
      }
    })

    let stdout = ''
    let stderr = ''
    const startTime = Date.now()

    claude.stdout.on('data', (data) => {
      const chunk = data.toString()
      stdout += chunk
      process.stdout.write('.')
    })

    claude.stderr.on('data', (data) => {
      const chunk = data.toString()
      stderr += chunk
      if (chunk.includes('Error') || chunk.includes('error')) {
        console.log('\n⚠️  Error detected:', chunk.trim())
      }
    })

    claude.on('close', async (code) => {
      const duration = Date.now() - startTime
      console.log(`\n✅ ${testName} completed in ${duration}ms`)
      
      // Save detailed log
      const logData = {
        testName,
        timestamp: new Date().toISOString(),
        workingDirectory: workingDir,
        prompt,
        exitCode: code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        duration,
        success: code === 0 && stdout.trim().length > 0,
        outputLength: stdout.trim().length
      }
      
      try {
        await fs.writeFile(logFile, JSON.stringify(logData, null, 2), 'utf-8')
        
        if (stdout.trim()) {
          await fs.writeFile(outputFile, `# ${testName} - ${timestamp}\n\n${stdout.trim()}`, 'utf-8')
          console.log(`📝 Response saved to: ${outputFile}`)
        }
        
        console.log(`📊 Output length: ${stdout.trim().length} characters`)
        
        if (code === 0) {
          resolve(stdout.trim())
        } else {
          reject(new Error(`Claude failed with code ${code}`))
        }
      } catch (error) {
        console.error('Error saving files:', error)
        reject(error)
      }
    })

    claude.on('error', (err) => {
      console.error(`\n💥 Process error: ${err.message}`)
      reject(err)
    })

    // Longer timeout for complex analysis
    setTimeout(() => {
      claude.kill('SIGTERM')
      reject(new Error(`${testName} timed out after 5 minutes`))
    }, 300000) // 5 minutes
  })
}

async function createUserProfileSchema() {
  console.log('\n👤 Designing user profile schema...')
  
  const userProfileSchema = `-- User Profile Schema for GitHub-style usernames
-- Extends existing NextAuth users table

-- Add username column to existing users table
ALTER TABLE users ADD COLUMN username VARCHAR(39) UNIQUE; -- GitHub max length
ALTER TABLE users ADD COLUMN display_name VARCHAR(255);
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN location VARCHAR(255);
ALTER TABLE users ADD COLUMN website_url VARCHAR(2048);
ALTER TABLE users ADD COLUMN twitter_username VARCHAR(15);
ALTER TABLE users ADD COLUMN github_username VARCHAR(39);
ALTER TABLE users ADD COLUMN profile_image_url VARCHAR(2048);
ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create user_profiles table for extended profile data
CREATE TABLE user_profiles (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(39) UNIQUE NOT NULL, -- @tim, @jack format
  display_name VARCHAR(255),
  bio TEXT,
  location VARCHAR(255),
  website_url VARCHAR(2048),
  twitter_username VARCHAR(15),
  github_username VARCHAR(39),
  profile_image_url VARCHAR(2048),
  is_public BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  repository_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_username (username),
  INDEX idx_user_id (user_id),
  INDEX idx_is_public (is_public)
);

-- User following/followers relationship
CREATE TABLE user_follows (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  follower_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_follow (follower_id, following_id),
  INDEX idx_follower (follower_id),
  INDEX idx_following (following_id)
);

-- Update work items to reference usernames
ALTER TABLE work_items ADD COLUMN assigned_username VARCHAR(39);
ALTER TABLE work_items ADD COLUMN created_by_username VARCHAR(39);
ALTER TABLE work_items ADD INDEX idx_assigned_username (assigned_username);
ALTER TABLE work_items ADD INDEX idx_created_by_username (created_by_username);

-- User activity feed
CREATE TABLE user_activities (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(39) NOT NULL,
  activity_type ENUM('work_item_created', 'work_item_completed', 'project_created', 'profile_updated', 'followed_user') NOT NULL,
  target_type ENUM('work_item', 'project', 'user') NOT NULL,
  target_id VARCHAR(36),
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_username (username),
  INDEX idx_activity_type (activity_type),
  INDEX idx_created_at (created_at)
);`

  const schemaFile = path.join(process.cwd(), 'projects', 'maverick', 'ai-logs', 'user-profile-schema.sql')
  await fs.writeFile(schemaFile, userProfileSchema, 'utf-8')
  console.log(`📄 User profile schema saved to: ${schemaFile}`)
}

async function main() {
  try {
    await testClaudeInProjectContext()
    await createUserProfileSchema()
    
    console.log('\n🎉 All tests completed!')
    console.log('📁 Check projects/maverick/ai-logs/ for detailed results')
    console.log('👤 User profile schema design ready for implementation')
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message)
  }
}

main().catch(console.error)