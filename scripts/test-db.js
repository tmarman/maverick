const { PrismaClient } = require('@prisma/client')

async function testDatabase() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful!')
    
    // Test a simple query
    const userCount = await prisma.user.count()
    console.log(`📊 User count: ${userCount}`)
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    
    if (error.message.includes("Can't reach database server")) {
      console.log('\n🔍 Troubleshooting steps:')
      console.log('1. Check if Azure SQL Database is running/resumed')
      console.log('2. Verify firewall rules allow your IP address')
      console.log('3. Check connection string format and credentials')
      console.log('4. Ensure database server is not paused (Azure SQL can auto-pause)')
    }
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()