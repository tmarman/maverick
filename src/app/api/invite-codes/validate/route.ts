import { NextRequest, NextResponse } from 'next/server'

// General everlasting invite code + user-generated codes
const GENERAL_INVITE_CODE = 'MAVERICK2025'

// In production, this would be stored in the database
const VALID_INVITE_CODES = new Set([
  GENERAL_INVITE_CODE,
  // Additional codes can be added here
  'EARLY2025',
  'BETA2025'
])

// For demo purposes, we'll also accept any code that starts with 'INVITE-'
const isValidInviteCode = (code: string): boolean => {
  // Check if it's the general code or in our list
  if (VALID_INVITE_CODES.has(code.toUpperCase())) {
    return true
  }
  
  // Check if it's a user-generated code (starts with INVITE-)
  if (code.toUpperCase().startsWith('INVITE-')) {
    return true
  }
  
  return false
}

// POST - Validate an invite code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invite code is required' 
      }, { status: 400 })
    }

    const isValid = isValidInviteCode(code)
    
    if (isValid) {
      // In production, you might want to track usage
      console.log(`Valid invite code used: ${code}`)
      
      return NextResponse.json({
        valid: true,
        message: 'Invite code is valid'
      })
    } else {
      return NextResponse.json({
        valid: false,
        error: 'Invalid invite code'
      }, { status: 403 })
    }

  } catch (error) {
    console.error('Invite code validation error:', error)
    return NextResponse.json(
      { 
        valid: false, 
        error: 'Failed to validate invite code' 
      },
      { status: 500 }
    )
  }
}

// GET - Get invite code info (without revealing the actual codes)
export async function GET() {
  return NextResponse.json({
    message: 'Invite codes are required for registration',
    hints: [
      'General invite codes are available for early access',
      'Existing users can generate invite codes for others',
      'Check your email if you signed up for the waitlist'
    ]
  })
}