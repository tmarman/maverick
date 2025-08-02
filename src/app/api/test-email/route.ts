import { NextRequest, NextResponse } from 'next/server'
import { azureEmailService } from '@/lib/azure-email'

export async function POST(request: NextRequest) {
  try {
    const { email, type = 'magic' } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    let success = false
    
    if (type === 'magic') {
      // Test magic link email
      const testMagicLink = `https://maverick.com/auth/callback/email?token=test123&email=${encodeURIComponent(email)}`
      success = await azureEmailService.sendMagicLinkEmail(email, testMagicLink)
    } else if (type === 'welcome') {
      // Test welcome email
      success = await azureEmailService.sendWelcomeEmail(email, 'Test User')
    }

    return NextResponse.json({
      success,
      message: success ? 'Email sent successfully' : 'Failed to send email',
      service: 'Azure Communication Services'
    })

  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: 'Failed to send test email', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}