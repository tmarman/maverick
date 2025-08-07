/**
 * Backup existing business data before migration
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs').promises

async function backupBusinessData() {
  console.log('💾 Backing up existing business data...')
  
  const prisma = new PrismaClient()
  
  try {
    // Backup businesses
    const businesses = await prisma.$queryRaw`SELECT * FROM businesses`
    console.log(`📊 Found ${businesses.length} businesses`)

    // Backup business members  
    const businessMembers = await prisma.$queryRaw`SELECT * FROM business_members`
    console.log(`👥 Found ${businessMembers.length} business members`)

    // Backup projects with their businessId
    const projects = await prisma.$queryRaw`SELECT * FROM projects`
    console.log(`📁 Found ${projects.length} projects`)

    // Save backup data
    const backupData = {
      timestamp: new Date().toISOString(),
      businesses,
      businessMembers, 
      projects
    }

    await fs.writeFile(
      'scripts/business-data-backup.json', 
      JSON.stringify(backupData, null, 2)
    )

    console.log('✅ Backup saved to scripts/business-data-backup.json')
    console.log('\n📋 Summary:')
    console.log(`   - ${businesses.length} businesses`)
    console.log(`   - ${businessMembers.length} business members`)
    console.log(`   - ${projects.length} projects`)
    
  } catch (error) {
    console.error('❌ Backup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

backupBusinessData().catch(console.error)