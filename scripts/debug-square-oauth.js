#!/usr/bin/env node

/**
 * Debug Square OAuth URL generation
 */

require('dotenv').config({ path: '.env.local' })

function debugSquareOAuth() {
  console.log('🔍 Debugging Square OAuth URL Generation')
  console.log('==========================================')
  
  const clientId = process.env.NEXT_PUBLIC_SQUARE_CLIENT_ID
  
  // Simulate what the browser code does
  const origin = 'http://localhost:5001'  // This is what window.location.origin would be
  const redirectUri = `${origin}/auth/square`
  
  const scopes = [
    'MERCHANT_PROFILE_READ',
    'PAYMENTS_READ',
    'PAYMENTS_WRITE',
    'ORDERS_READ',
    'ORDERS_WRITE',
    'CUSTOMERS_READ',
    'CUSTOMERS_WRITE',
    'SETTLEMENTS_READ',
    'BANK_ACCOUNTS_READ'
  ].join('+')
  
  const state = 'login'
  const squareAuthUrl = `https://connect.squareup.com/oauth2/authorize?client_id=${clientId}&scope=${scopes}&session=false&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
  
  console.log('📋 Generated OAuth URL Components:')
  console.log(`   Client ID: ${clientId}`)
  console.log(`   Redirect URI (raw): ${redirectUri}`)
  console.log(`   Redirect URI (encoded): ${encodeURIComponent(redirectUri)}`)
  console.log(`   Scopes: ${scopes}`)
  console.log(`   State: ${state}`)
  
  console.log('\n🌐 Full OAuth URL:')
  console.log(squareAuthUrl)
  
  console.log('\n📝 Square Developer Dashboard Settings:')
  console.log('   Make sure your Square app has this EXACT redirect URI:')
  console.log(`   ${redirectUri}`)
  
  console.log('\n🔍 Common Issues:')
  console.log('   1. URL must match EXACTLY (including http/https)')
  console.log('   2. No trailing slashes')
  console.log('   3. Case sensitive')
  console.log('   4. Port numbers must match')
  console.log('   5. Make sure you\'re editing the PRODUCTION app settings, not sandbox')
}

debugSquareOAuth()