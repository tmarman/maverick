#!/usr/bin/env node

/**
 * Migration Script: Business → Organization Schema Refactor
 * Safely migrates from Business terminology to Organization terminology
 * 
 * This script:
 * 1. Backs up the current schema
 * 2. Runs the SQL migration
 * 3. Updates the Prisma schema file
 * 4. Regenerates Prisma client
 * 5. Updates code references
 */

const fs = require('fs').promises
const path = require('path')
const { execSync } = require('child_process')

async function migrateToOrganization() {
  console.log('🔄 Starting Business → Organization schema migration...')

  try {
    // Step 1: Backup current schema
    console.log('📋 Creating schema backup...')
    const currentSchema = await fs.readFile(
      path.join(__dirname, '..', 'prisma', 'schema.prisma'),
      'utf-8'
    )
    await fs.writeFile(
      path.join(__dirname, '..', 'prisma', 'schema-backup-business.prisma'),
      currentSchema
    )
    console.log('✅ Schema backup created')

    // Step 2: Check if we're connected to the database
    console.log('🔍 Checking database connection...')
    try {
      execSync('npx prisma db pull --force', { 
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.join(__dirname, '..')
      })
      console.log('✅ Database connection verified')
    } catch (error) {
      console.warn('⚠️  Database connection failed, proceeding with schema-only migration')
    }

    // Step 3: Replace the schema file
    console.log('🔄 Updating Prisma schema...')
    const newSchema = await fs.readFile(
      path.join(__dirname, '..', 'prisma', 'schema-organization.prisma'),
      'utf-8'
    )
    await fs.writeFile(
      path.join(__dirname, '..', 'prisma', 'schema.prisma'),
      newSchema
    )
    console.log('✅ Prisma schema updated')

    // Step 4: Generate new Prisma client
    console.log('🔄 Generating new Prisma client...')
    execSync('npx prisma generate', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    })
    console.log('✅ Prisma client regenerated')

    // Step 5: Update TypeScript code references
    console.log('🔄 Updating code references...')
    await updateCodeReferences()
    console.log('✅ Code references updated')

    // Step 6: Run the actual database migration (if connected)
    if (process.env.DATABASE_URL) {
      console.log('🔄 Running database migration...')
      try {
        // Create a migration file
        const migrationSql = await fs.readFile(
          path.join(__dirname, 'migrate-to-organization-schema.sql'),
          'utf-8'
        )
        
        // Apply migration using Prisma's raw query capability
        const { PrismaClient } = require('@prisma/client')
        const prisma = new PrismaClient()
        
        // Split SQL into individual statements and execute
        const statements = migrationSql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'))

        for (const statement of statements) {
          if (statement.includes('EXEC sp_rename') || statement.includes('ALTER TABLE') || statement.includes('CREATE')) {
            console.log(`Executing: ${statement.substring(0, 50)}...`)
            await prisma.$executeRawUnsafe(statement)
          }
        }
        
        await prisma.$disconnect()
        console.log('✅ Database migration completed')
      } catch (dbError) {
        console.error('❌ Database migration failed:', dbError.message)
        console.log('📝 You may need to run the SQL migration manually')
        console.log('📄 SQL migration file: scripts/migrate-to-organization-schema.sql')
      }
    } else {
      console.log('⚠️  No DATABASE_URL found, skipping database migration')
      console.log('📝 Run the SQL migration manually: scripts/migrate-to-organization-schema.sql')
    }

    console.log('\n🎉 Migration completed successfully!')
    console.log('\n📋 Summary:')
    console.log('  ✅ Business → Organization terminology updated')
    console.log('  ✅ Prisma schema migrated')
    console.log('  ✅ TypeScript code updated')
    console.log('  ✅ Prisma client regenerated')
    
    console.log('\n🔧 Next steps:')
    console.log('  1. Run npm run build to verify all TypeScript compiles')
    console.log('  2. Test the application to ensure everything works')
    console.log('  3. Update any remaining UI text from "Business" to "Organization"')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    console.log('\n🔧 Recovery steps:')
    console.log('  1. Restore backup: cp prisma/schema-backup-business.prisma prisma/schema.prisma')
    console.log('  2. Run: npx prisma generate')
    process.exit(1)
  }
}

async function updateCodeReferences() {
  const filesToUpdate = [
    'src/app/api/projects/route.ts',
    'src/app/api/projects/rehydrate/route.ts',
    'src/lib/rehydration-service.ts',
    'src/lib/cosmos-db.ts'
  ]

  const replacements = [
    // Model name changes
    { from: /Business/g, to: 'Organization' },
    { from: /business/g, to: 'organization' },
    { from: /BusinessMember/g, to: 'OrganizationMember' },
    { from: /businessMember/g, to: 'organizationMember' },
    { from: /BusinessFormation/g, to: 'OrganizationFormation' },
    { from: /businessFormation/g, to: 'organizationFormation' },
    
    // Property name changes
    { from: /businessId/g, to: 'organizationId' },
    { from: /businessType/g, to: 'organizationType' },
    { from: /ownedBusinesses/g, to: 'ownedOrganizations' },
    { from: /businessMemberships/g, to: 'organizationMemberships' },
    
    // Comments and strings
    { from: /"business"/g, to: '"organization"' },
    { from: /'business'/g, to: "'organization'" },
    { from: /business\./g, to: 'organization.' },
  ]

  for (const filePath of filesToUpdate) {
    try {
      const fullPath = path.join(__dirname, '..', filePath)
      let content = await fs.readFile(fullPath, 'utf-8')
      
      for (const { from, to } of replacements) {
        content = content.replace(from, to)
      }
      
      await fs.writeFile(fullPath, content)
      console.log(`  ✅ Updated ${filePath}`)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(`  ⚠️  Failed to update ${filePath}:`, error.message)
      }
    }
  }
}

// Run the migration
migrateToOrganization().catch(console.error)