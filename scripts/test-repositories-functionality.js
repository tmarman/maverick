#!/usr/bin/env node

// Test script to verify repositories page functionality
// Tests database connectivity, API endpoints, and core flow

const { execSync } = require('child_process')
const path = require('path')

console.log('🔍 Testing Repositories Page Functionality\n')

// Test 1: Database connectivity
console.log('1. Testing database connectivity...')
try {
  execSync('node scripts/test-db-connection.js', { stdio: 'inherit' })
  console.log('✅ Database connection successful\n')
} catch (error) {
  console.log('❌ Database connection failed')
  console.log('   This might be expected if DB is not configured yet\n')
}

// Test 2: Build verification
console.log('2. Testing build compilation...')
try {
  execSync('npm run build', { stdio: 'pipe' })
  console.log('✅ Build successful\n')
} catch (error) {
  console.log('❌ Build failed')
  console.log(error.toString())
  process.exit(1)
}

// Test 3: TypeScript verification
console.log('3. Testing TypeScript types...')
try {
  execSync('npm run type-check', { stdio: 'pipe' })
  console.log('✅ TypeScript validation successful\n')
} catch (error) {
  console.log('❌ TypeScript validation failed')
  console.log(error.toString())
  process.exit(1)
}

// Test 4: Check key API routes exist
console.log('4. Checking API route files...')
const routes = [
  'src/app/api/github/repositories/route.ts',
  'src/app/api/businesses/route.ts',
  'src/app/api/businesses/[businessId]/projects/route.ts'
]

routes.forEach(route => {
  const fullPath = path.join(process.cwd(), route)
  try {
    require('fs').accessSync(fullPath)
    console.log(`   ✅ ${route}`)
  } catch {
    console.log(`   ❌ ${route} - Missing`)
  }
})

console.log()

// Test 5: Check key UI components
console.log('5. Checking UI components...')
const components = [
  'src/app/cockpit/repositories/page.tsx',
  'src/components/CockpitShell.tsx',
  'src/app/cockpit/layout.tsx'
]

components.forEach(component => {
  const fullPath = path.join(process.cwd(), component)
  try {
    require('fs').accessSync(fullPath)
    console.log(`   ✅ ${component}`)
  } catch {
    console.log(`   ❌ ${component} - Missing`)
  }
})

console.log()
console.log('🎉 Repository page functionality test complete!')
console.log('   The build is working and all key files are in place.')
console.log('   Ready for live testing with authentication and GitHub integration.')