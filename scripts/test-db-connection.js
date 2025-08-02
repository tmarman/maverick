#!/usr/bin/env node

/**
 * Database Connection Test
 * Quick test to check if Azure SQL Database is accessible
 */

require('dotenv').config({ path: '.env.local' })

async function testConnection() {
  console.log('🔌 Testing Azure SQL Database Connection')
  console.log('========================================')
  
  try {
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    console.log('📡 Attempting connection to marmandb.database.windows.net:1433...')
    
    await prisma.$connect()
    console.log('✅ Database connection successful!')
    
    // Test a simple query
    const userCount = await prisma.user.count()
    console.log(`📊 Current user count: ${userCount}`)
    
    const businessCount = await prisma.business.count()
    console.log(`🏢 Current business count: ${businessCount}`)
    
    console.log('')
    console.log('🎉 Database is ready! You can now run:')
    console.log('1. npx prisma db push (to update schema)')
    console.log('2. Execute meta-bootstrap.sql (to load META data)')
    console.log('3. Visit /cockpit to see the magic!')
    
    await prisma.$disconnect()
    
  } catch (error) {
    console.log('❌ Database connection failed')
    
    if (error.message.includes("Can't reach database server")) {
      console.log('')
      console.log('🔍 Possible solutions:')
      console.log('1. Resume Azure SQL Database (it may be paused)')
      console.log('2. Add your IP to Azure SQL firewall rules')
      console.log('3. Check if the connection string is correct')
      console.log('4. Verify Azure SQL Database is running')
      console.log('')
      console.log('💡 Azure SQL Databases auto-pause after inactivity to save costs')
      console.log('   Visit Azure Portal → SQL Database → Resume to activate')
    }
    
    console.log('')
    console.log('Error details:', error.message)
  }
}

testConnection()