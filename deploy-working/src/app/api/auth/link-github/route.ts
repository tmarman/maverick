import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { signIn } from 'next-auth/react'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Store a linking intent in the session or database
    // This helps differentiate between new user signup and account linking
    const linkingIntent = {
      userId: session.user.id,
      email: session.user.email,
      action: 'link-github',
      timestamp: new Date().toISOString()
    }

    // For now, we'll use the callback URL to indicate this is a linking scenario
    const callbackUrl = '/accounts?tab=integrations&linking=github'

    return NextResponse.json({
      success: true,
      callbackUrl,
      message: 'Ready to link GitHub account'
    })

  } catch (error) {
    console.error('Link GitHub error:', error)
    return NextResponse.json(
      { error: 'Failed to prepare GitHub linking' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Handle the OAuth callback specifically for account linking
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!session) {
      return NextResponse.redirect('/accounts?tab=integrations&error=not-authenticated')
    }

    if (!code) {
      return NextResponse.redirect('/accounts?tab=integrations&error=missing-code')
    }

    // The NextAuth GitHub handler will handle the actual OAuth flow
    // This endpoint mainly serves to provide explicit linking context
    return NextResponse.redirect('/accounts?tab=integrations&connected=github')

  } catch (error) {
    console.error('GitHub linking callback error:', error)
    return NextResponse.redirect('/accounts?tab=integrations&error=linking-failed')
  }
}