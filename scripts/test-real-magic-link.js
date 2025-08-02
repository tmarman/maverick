const fetch = require('node-fetch')

async function testRealMagicLink() {
  console.log('✨ Testing Real Magic Link Email to tim@marman.org')
  console.log('===============================================\n')
  
  const baseUrl = 'http://localhost:5001'
  const testEmail = 'tim@marman.org'
  
  try {
    // Step 1: Get CSRF token
    console.log('🔐 Step 1: Getting CSRF token...')
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`)
    const { csrfToken } = await csrfResponse.json()
    console.log('CSRF Token:', csrfToken.slice(0, 20) + '...')
    
    // Step 2: Request magic link for real email
    console.log('\n📧 Step 2: Requesting magic link for tim@marman.org...')
    const magicLinkResponse = await fetch(`${baseUrl}/api/auth/signin/email`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: testEmail,
        csrfToken,
        callbackUrl: '/cockpit',
        json: 'true'
      })
    })
    
    const magicLinkResult = await magicLinkResponse.text()
    console.log('Magic link response status:', magicLinkResponse.status)
    console.log('Magic link response:', magicLinkResult.slice(0, 300) + '...')
    
    if (magicLinkResponse.ok || magicLinkResponse.status === 302) {
      console.log('✅ Magic link request processed!')
      console.log('📧 Email should be sent to tim@marman.org via Azure Communication Services')
      console.log('📬 Also check server logs for the magic link URL (development mode)')
    } else {
      console.log('⚠️  Magic link request may have issues')
    }
    
    console.log('\n🎉 Real magic link email test completed!')
    console.log('📩 Check your email at tim@marman.org for the magic link')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

testRealMagicLink()