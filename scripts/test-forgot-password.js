const fetch = require('node-fetch')

async function testForgotPassword() {
  console.log('🔐 Testing Forgot Password Flow')
  console.log('==============================\n')
  
  const baseUrl = 'http://localhost:5001'
  const testEmail = 'tim@marman.org' // Use your real email
  
  try {
    // Step 1: Request password reset
    console.log('📧 Step 1: Requesting password reset...')
    const resetResponse = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail })
    })
    
    const resetResult = await resetResponse.json()
    console.log('Reset request status:', resetResponse.status)
    console.log('Reset result:', resetResult)
    
    if (resetResponse.ok) {
      console.log('✅ Password reset request processed!')
      console.log('📬 Check the server logs for the reset link URL (development mode)')
      console.log('📧 In production, this would send an email via Azure Communication Services')
      console.log('📩 Check your email at tim@marman.org for the reset link')
    } else {
      console.log('⚠️  Password reset request may have issues')
    }
    
    console.log('\n🎉 Forgot password flow test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

testForgotPassword()