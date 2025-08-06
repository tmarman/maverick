import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    })

    // Always return success for security (don't reveal if email exists)
    // But only send email if user actually exists
    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

      // Save reset token to database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          // We'll need to add these fields to the User model
          resetToken,
          resetTokenExpiry
        }
      })

      // Send password reset email
      try {
        const { azureEmailService } = await import('@/lib/azure-email')
        const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`
        
        await azureEmailService.sendPasswordResetEmail(email, resetUrl, user.name || undefined)
        
        console.log(`📧 Password reset email sent to ${email}`)
        
        // Also log the reset URL for development
        if (process.env.NODE_ENV === 'development') {
          console.log('\n🔐 PASSWORD RESET LINK')
          console.log(`Email: ${email}`)
          console.log(`Reset URL: ${resetUrl}`)
          console.log('Use this link to reset the password!\n')
        }
      } catch (error) {
        console.error('Password reset email error:', error)
        
        // Fallback: log the reset link for development
        if (process.env.NODE_ENV === 'development') {
          const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`
          console.log('\n🔐 PASSWORD RESET LINK (FALLBACK)')
          console.log(`Email: ${email}`)
          console.log(`Reset URL: ${resetUrl}`)
          console.log('Use this link to reset the password!\n')
        }
      }
    } else {
      console.log(`Password reset requested for non-existent email: ${email}`)
    }

    // Always return success (security best practice)
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: 500 }
    )
  }
}