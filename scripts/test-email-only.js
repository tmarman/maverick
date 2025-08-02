#!/usr/bin/env node

/**
 * Email Service Test Script
 * Tests Azure Communication Services email functionality without database
 */

require('dotenv').config({ path: '.env.local' })

async function testEmailService() {
  console.log('📧 Testing Azure Communication Services')
  console.log('=====================================')
  
  try {
    // Load Azure email service
    const path = require('path')
    const { azureEmailService } = require(path.join(__dirname, '../src/lib/azure-email'))
    
    console.log('✅ Azure Communication Services client loaded')
    
    // Test magic link email
    const testEmail = 'tim@voxelbox.com' // Use a real email you have access to
    const testMagicLink = 'http://localhost:5001/api/auth/callback/email?token=test123&email=' + encodeURIComponent(testEmail)
    
    console.log(`📮 Sending test magic link email to: ${testEmail}`)
    
    const magicLinkResult = await azureEmailService.sendMagicLinkEmail(testEmail, testMagicLink)
    
    if (magicLinkResult) {
      console.log('✅ Magic link email sent successfully!')
    } else {
      console.log('❌ Magic link email failed to send')
    }
    
    // Test welcome email
    console.log(`📮 Sending test welcome email to: ${testEmail}`)
    
    const welcomeResult = await azureEmailService.sendWelcomeEmail(testEmail, 'Tim')
    
    if (welcomeResult) {
      console.log('✅ Welcome email sent successfully!')
    } else {
      console.log('❌ Welcome email failed to send')
    }
    
    console.log('')
    console.log('🎉 Email Service Test Complete!')
    console.log('==============================')
    console.log('')
    console.log('If emails were sent successfully:')
    console.log('1. Check your inbox for both emails')
    console.log('2. The magic link authentication system is working!')
    console.log('3. Azure Communication Services is properly configured')
    console.log('')
    console.log('Note: Database connectivity issues do not affect email sending.')
    console.log('The magic link authentication will work once the database is accessible.')
    
  } catch (error) {
    console.error('❌ Email service test failed:', error.message)
    console.log('')
    console.log('Possible issues:')
    console.log('- Check AZURE_COMMUNICATION_CONNECTION_STRING in .env.local')
    console.log('- Verify Azure Communication Services is active')
    console.log('- Ensure voxelbox.com domain is properly configured')
  }
}

testEmailService()