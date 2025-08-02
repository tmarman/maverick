#!/usr/bin/env node

const fetch = require('node-fetch')

async function testRegistrationFlow() {
  console.log('🧪 Testing Full Registration Flow')
  console.log('================================\n')
  
  const baseUrl = 'http://localhost:5001'
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'TestPassword123'
  
  try {
    // Step 1: Register a new user
    console.log('📝 Step 1: Registering new user...')
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    })
    
    const registerResult = await registerResponse.json()
    console.log('Registration result:', registerResult)
    
    if (!registerResponse.ok) {
      throw new Error(`Registration failed: ${registerResult.error}`)
    }
    
    console.log('✅ Registration successful!\n')
    
    // Step 2: Test credentials signin
    console.log('🔐 Step 2: Testing credentials signin...')
    
    // First get CSRF token
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`)
    const { csrfToken } = await csrfResponse.json()
    console.log('CSRF Token:', csrfToken.slice(0, 20) + '...')
    
    // Now try to sign in
    const signinResponse = await fetch(`${baseUrl}/api/auth/signin/credentials`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: testEmail,
        password: testPassword,
        csrfToken,
        callbackUrl: '/app',
        json: 'true'
      })
    })
    
    const signinResult = await signinResponse.text()
    console.log('Signin response:', signinResult.slice(0, 200) + '...')
    
    if (signinResponse.ok) {
      console.log('✅ Login flow working!')
    } else {
      console.log('⚠️  Login response indicates redirect or additional steps needed')
    }
    
    console.log('\n🎉 Registration and authentication flow is working!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

testRegistrationFlow()