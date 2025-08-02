#!/usr/bin/env node

/**
 * Test Square OAuth configuration
 */

require('dotenv').config({ path: '.env.local' })

function testSquareOAuth() {
  console.log('🔒 Testing Square OAuth Configuration')
  console.log('=====================================')
  
  const clientId = process.env.SQUARE_CLIENT_ID
  const clientSecret = process.env.SQUARE_CLIENT_SECRET
  const publicClientId = process.env.NEXT_PUBLIC_SQUARE_CLIENT_ID
  
  console.log('📋 Configuration Check:')
  console.log(`   Client ID: ${clientId ? '✅ Set' : '❌ Missing'} ${clientId ? `(${clientId.slice(0, 20)}...)` : ''}`)
  console.log(`   Client Secret: ${clientSecret ? '✅ Set' : '❌ Missing'} ${clientSecret ? `(${clientSecret.slice(0, 20)}...)` : ''}`)
  console.log(`   Public Client ID: ${publicClientId ? '✅ Set' : '❌ Missing'} ${publicClientId ? `(${publicClientId.slice(0, 20)}...)` : ''}`)
  
  console.log('\n🌐 URLs:')
  console.log(`   Auth URL: http://localhost:5001/auth/square`)
  console.log(`   Callback URL: http://localhost:5001/api/auth/square/callback`)
  
  if (clientId && clientSecret && publicClientId) {
    console.log('\n🎯 OAuth Flow URL:')
    const scopes = [
      'MERCHANT_PROFILE_READ',
      'PAYMENTS_READ',
      'PAYMENTS_WRITE', 
      'ORDERS_READ',
      'ORDERS_WRITE',
      'CUSTOMERS_READ',
      'CUSTOMERS_WRITE'
    ].join('+')
    
    const redirectUri = 'http://localhost:5001/auth/square'
    const authUrl = `https://connect.squareup.com/oauth2/authorize?client_id=${clientId}&scope=${scopes}&session=false&redirect_uri=${encodeURIComponent(redirectUri)}&state=test`
    
    console.log(`   ${authUrl}`)
    console.log('\n✅ Square OAuth is configured and ready!')
    console.log('\n📝 Next Steps:')
    console.log('   1. Update Square Developer Dashboard redirect URL to: http://localhost:5001/auth/square')
    console.log('   2. Test login by clicking "Sign up with Square" on the register page')
    console.log('   3. Or visit the auth URL above directly')
  } else {
    console.log('\n❌ Configuration incomplete')
    console.log('   Please check your .env.local file')
  }
}

testSquareOAuth()