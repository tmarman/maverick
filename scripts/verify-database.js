#!/usr/bin/env node

/**
 * Database Verification Script
 * Run this after setting up your Azure database to verify everything is working
 */

require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

async function verifyDatabase() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Verifying database connection...')
    
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Test table creation by counting records
    const userCount = await prisma.user.count()
    console.log(`✅ Users table accessible (${userCount} records)`)
    
    const accountCount = await prisma.account.count()
    console.log(`✅ Accounts table accessible (${accountCount} records)`)
    
    const businessCount = await prisma.business.count()
    console.log(`✅ Businesses table accessible (${businessCount} records)`)
    
    const squareCount = await prisma.squareConnection.count()
    console.log(`✅ Square connections table accessible (${squareCount} records)`)
    
    console.log('\n🎉 Database setup verification complete!')
    console.log('Your Azure database is ready for NextAuth and Maverick!')
    
  } catch (error) {
    console.error('❌ Database verification failed:')
    console.error(error.message)
    
    if (error.message.includes('Environment variable not found')) {
      console.log('\n💡 Make sure DATABASE_URL is set in your .env.local file')
    }
    
    if (error.message.includes('connect ETIMEDOUT')) {
      console.log('\n💡 Check your Azure database connection string and firewall rules')
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyDatabase()