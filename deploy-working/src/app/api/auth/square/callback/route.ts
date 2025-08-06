import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { code, state, mode } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      )
    }

    // Square OAuth token exchange
    const tokenExchangeUrl = 'https://connect.squareup.com/oauth2/token'
    
    const tokenResponse = await fetch(tokenExchangeUrl, {
      method: 'POST',
      headers: {
        'Square-Version': '2025-01-23',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.SQUARE_CLIENT_ID,
        client_secret: process.env.SQUARE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code'
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      console.error('Square token exchange failed:', errorData)
      return NextResponse.json(
        { error: 'Failed to exchange authorization code' },
        { status: 400 }
      )
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_at, merchant_id } = tokenData

    // Get merchant information
    const merchantResponse = await fetch('https://connect.squareup.com/v2/merchants', {
      headers: {
        'Square-Version': '2025-01-23',
        'Authorization': `Bearer ${access_token}`,
      },
    })

    let merchantInfo = null
    if (merchantResponse.ok) {
      const merchantData = await merchantResponse.json()
      merchantInfo = merchantData.merchants?.[0]
    }

    // TODO: Store user and Square connection in database
    // For now, we'll return the data that would be stored
    const userData = {
      squareAccessToken: access_token,
      squareRefreshToken: refresh_token,
      squareExpiresAt: expires_at,
      squareMerchantId: merchant_id,
      merchantInfo: merchantInfo,
      authMode: mode || state,
      connectedAt: new Date().toISOString()
    }

    console.log('Square OAuth successful:', {
      merchantId: merchant_id,
      businessName: merchantInfo?.business_name,
      mode: mode || state
    })

    // In a real implementation, you would:
    // 1. Create or update user in database
    // 2. Store Square credentials securely
    // 3. Create session/JWT token
    // 4. Return user session data

    return NextResponse.json({
      success: true,
      message: 'Square account connected successfully',
      data: {
        merchantId: merchant_id,
        businessName: merchantInfo?.business_name || 'Your Business',
        hasSquareAccount: true,
        authMode: mode || state
      }
    })

  } catch (error) {
    console.error('Square OAuth callback error:', error)
    return NextResponse.json(
      { error: 'Internal server error during Square authentication' },
      { status: 500 }
    )
  }
}

// Handle GET requests (for direct navigation to the callback URL)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const error = searchParams.get('error')
  
  if (error) {
    // Redirect back to login with error
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  // Redirect to the client-side handler
  return NextResponse.redirect(new URL('/auth/square', request.url))
}