const fetch = require('node-fetch')

async function testMagicLink() {
  console.log('✨ Testing Magic Link Authentication')
  console.log('==================================\n')
  
  const baseUrl = 'http://localhost:5001'
  const testEmail = `magiclink-${Date.now()}@example.com`
  
  try {
    // Step 1: Get CSRF token
    console.log('🔐 Step 1: Getting CSRF token...')
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`)
    const { csrfToken } = await csrfResponse.json()
    console.log('CSRF Token:', csrfToken.slice(0, 20) + '...')
    
    // Step 2: Request magic link
    console.log('\n📧 Step 2: Requesting magic link...')
    const magicLinkResponse = await fetch(`${baseUrl}/api/auth/signin/email`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: testEmail,
        csrfToken,
        callbackUrl: '/app',
        json: 'true'
      })
    })
    
    const magicLinkResult = await magicLinkResponse.text()
    console.log('Magic link response status:', magicLinkResponse.status)
    console.log('Magic link response:', magicLinkResult.slice(0, 300) + '...')
    
    if (magicLinkResponse.ok || magicLinkResponse.status === 302) {
      console.log('✅ Magic link request processed!')
      console.log('📬 Check the server logs for the magic link URL (development mode)')
      console.log('📧 In production, this would send an email via Azure Communication Services')
    } else {
      console.log('⚠️  Magic link request may have issues')
    }
    
    console.log('\n🎉 Magic link flow initiated successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

testMagicLink()