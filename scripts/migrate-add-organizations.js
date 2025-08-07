/**
 * Safe Migration: Add Organizations to Existing Projects
 * This script creates organizations for existing projects without losing data
 */

const { PrismaClient } = require('@prisma/client')

async function safeOrganizationMigration() {
  console.log('🚀 Starting safe organization migration...')
  
  const prisma = new PrismaClient()
  
  try {
    // First, check if organizations table exists by trying to count
    let organizationsExist = false
    try {
      await prisma.organization.count()
      organizationsExist = true
      console.log('✅ Organizations table already exists')
    } catch (error) {
      console.log('📝 Organizations table needs to be created')
    }

    // If organizations don't exist, we need to create the table first
    // This requires a schema change without the foreign key constraint
    if (!organizationsExist) {
      console.log('❌ Cannot proceed - organizations table must be created first')
      console.log('   Run this instead:')
      console.log('   1. Temporarily remove organizationId from Project model')
      console.log('   2. Run prisma db push')  
      console.log('   3. Add organizationId back as optional')
      console.log('   4. Run prisma db push')
      console.log('   5. Run this migration script')
      console.log('   6. Make organizationId required')
      console.log('   7. Run prisma db push')
      return
    }

    // Get all existing projects
    const existingProjects = await prisma.project.findMany({
      include: {
        // Note: this might fail if organizationId is required
      }
    })
    
    console.log(`📊 Found ${existingProjects.length} existing projects`)

    // Get all users to create organizations for them
    const users = await prisma.user.findMany()
    console.log(`👥 Found ${users.length} users`)

    // Create organizations for each user
    for (const user of users) {
      console.log(`🏢 Creating organization for user: ${user.email}`)
      
      // Check if user already has an organization
      const existingOrg = await prisma.organization.findFirst({
        where: { ownerId: user.id }
      })

      let organization
      if (existingOrg) {
        console.log(`   ✅ Organization already exists: ${existingOrg.name}`)
        organization = existingOrg
      } else {
        organization = await prisma.organization.create({
          data: {
            name: `${user.name || user.email.split('@')[0]}'s Organization`,
            ownerId: user.id,
            organizationType: 'online',
            status: 'ACTIVE',
            squareServices: JSON.stringify([]),
            appFeatures: JSON.stringify([])
          }
        })
        console.log(`   ✅ Created organization: ${organization.name}`)
      }

      // Find projects that don't have an organizationId yet
      // This query might fail if organizationId is required - we'll handle that
      const userProjects = existingProjects.filter(project => {
        // If organizationId already exists, skip
        if (project.organizationId) return false
        
        // For now, assign all unassigned projects to the first user
        // In a real scenario, you'd have better logic to determine ownership
        return true
      })

      if (userProjects.length > 0) {
        console.log(`   📁 Assigning ${userProjects.length} projects to ${organization.name}`)
        
        for (const project of userProjects) {
          await prisma.project.update({
            where: { id: project.id },
            data: { organizationId: organization.id }
          })
          console.log(`     ✅ Assigned project: ${project.name}`)
        }
      }
    }

    console.log('🎉 Migration completed successfully!')
    console.log('📋 Summary:')
    console.log(`   - Created/verified organizations for ${users.length} users`)
    console.log(`   - Assigned ${existingProjects.length} projects to organizations`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    console.log('\n🔧 This is likely because the schema needs to be updated in steps.')
    console.log('   The organizationId column might not exist yet or might be required.')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
safeOrganizationMigration()
  .catch(console.error)