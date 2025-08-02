#!/usr/bin/env node

/**
 * Email API Test Script
 * Tests the email functionality via the API endpoint
 */

require('dotenv').config({ path: '.env.local' })

async function testEmailAPI() {
  console.log('📧 Testing Magic Link Email via API')
  console.log('===================================')
  
  try {
    // Test the API endpoint we created
    const testEmail = 'tim@voxelbox.com'
    const testURL = `http://localhost:5001/api/test-email?email=${encodeURIComponent(testEmail)}`
    
    console.log(`🔗 Testing API endpoint: ${testURL}`)
    console.log('📍 Note: Make sure the server is running on port 5001')
    console.log('')
    
    const response = await fetch(testURL)
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ API Test Result:', result)
      
      if (result.success) {
        console.log('')
        console.log('🎉 Email Service Working!')
        console.log('========================')
        console.log('✅ Azure Communication Services is configured correctly')
        console.log('✅ Magic link emails can be sent')
        console.log('📬 Check your inbox for the test email')
        console.log('')
        console.log('The magic link authentication system is ready!')
        console.log('Database connectivity is the only remaining issue.')
      } else {
        console.log('❌ Email sending failed:', result.error)
      }
    } else {
      console.log('❌ API request failed:', result)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('')
    console.log('Make sure to:')
    console.log('1. Start the server: npm run dev')
    console.log('2. Wait for it to fully load')
    console.log('3. Run this test again')
  }
}

testEmailAPI()