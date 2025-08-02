#!/usr/bin/env node

/**
 * Test Login Functionality
 * Tests magic link authentication with Azure Communication Services
 */

require('dotenv').config({ path: '.env.local' })

async function testLogin() {
  console.log('🧪 Testing Login Functionality')
  console.log('===============================')
  
  try {
    // Test 1: Check environment variables
    console.log('1. Checking environment variables...')
    const requiredEnvVars = [
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'AZURE_COMMUNICATION_CONNECTION_STRING',
      'AZURE_COMMUNICATION_FROM_EMAIL'
    ]
    
    const missing = requiredEnvVars.filter(envVar => !process.env[envVar])
    if (missing.length > 0) {
      console.error('❌ Missing environment variables:', missing)
      return
    }
    console.log('✅ All required environment variables present')
    
    // Test 2: Test Azure Communication Services connection
    console.log('\n2. Testing Azure Communication Services...')
    
    // Import Azure email service directly since we're in Node.js context
    const { EmailClient } = require('@azure/communication-email')
    const client = new EmailClient(process.env.AZURE_COMMUNICATION_CONNECTION_STRING)
    
    // Create a test magic link
    const testEmail = 'test@example.com'
    const testMagicLink = 'http://localhost:5001/api/auth/callback/email?callbackUrl=http%3A%2F%2Flocalhost%3A5001%2Fapp&token=test&email=test%40example.com'
    
    console.log(`📧 Sending test magic link to ${testEmail}...`)
    
    const emailMessage = {
      senderAddress: process.env.AZURE_COMMUNICATION_FROM_EMAIL,
      content: {
        subject: '🧪 Test Magic Link from Maverick',
        html: `<h1>Test Magic Link</h1><p>This is a test email from Maverick.</p><p><a href="${testMagicLink}">Click here to test login</a></p>`,
        plainText: `Test Magic Link\n\nThis is a test email from Maverick.\n\nTest link: ${testMagicLink}`
      },
      recipients: {
        to: [{ address: testEmail }]
      }
    }

    try {
      const poller = await client.beginSend(emailMessage)
      const result = await poller.pollUntilDone()
      
      if (result.status === 'Succeeded') {
        console.log('✅ Test magic link email sent successfully!')
        console.log('📧 Check your Azure Communication Services logs for delivery confirmation')
      } else {
        console.log('❌ Failed to send test magic link email - Status:', result.status)
      }
    } catch (emailError) {
      console.log('❌ Failed to send test magic link email:', emailError.message)
      console.log('💡 Check your Azure Communication Services configuration')
    }
    
    // Test 3: Test database connection for auth
    console.log('\n3. Testing database connection for authentication...')
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    // Try to query users table
    const userCount = await prisma.user.count()
    console.log(`✅ Database connected - Found ${userCount} users`)
    
    await prisma.$disconnect()
    
    console.log('\n🎉 Login System Test Complete!')
    console.log('================================')
    console.log('✅ Environment variables configured')
    console.log('✅ Azure Communication Services tested (check logs above)')
    console.log('✅ Database connection working')
    console.log('\n🚀 Ready to test login at http://localhost:5001/login')
    
  } catch (error) {
    console.error('❌ Login test failed:', error)
    
    if (error.message.includes('AZURE_COMMUNICATION_CONNECTION_STRING')) {
      console.log('💡 Make sure your Azure Communication Services connection string is correct')
    }
    
    if (error.message.includes('database')) {
      console.log('💡 Make sure your database is running and accessible')
    }
  }
}

testLogin()