import { NextRequest } from 'next/server'

export interface APIKeyValidation {
  valid: boolean
  userId?: string
  error?: string
}

/**
 * Validate API key for OpenAI-compatible endpoints
 * This is a simple implementation - in production you'd want more robust key management
 */
export async function validateAPIKey(request: NextRequest): Promise<APIKeyValidation> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return { valid: false, error: 'Missing authorization header' }
  }

  // Handle both "Bearer sk-..." and "sk-..." formats
  const apiKey = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader

  // For now, accept any key that starts with 'mk-' (maverick key)
  // In production, you'd validate against a database
  if (apiKey.startsWith('mk-')) {
    return { 
      valid: true, 
      userId: 'goose-user' // Could extract from key in production
    }
  }

  // For development, also accept standard test keys
  if (process.env.NODE_ENV === 'development') {
    if (apiKey === 'test-key' || apiKey.startsWith('sk-test')) {
      return { 
        valid: true, 
        userId: 'dev-user'
      }
    }
  }

  return { valid: false, error: 'Invalid API key' }
}

/**
 * Generate a Maverick API key (for user onboarding)
 */
export function generateMaverickAPIKey(userId: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2)
  return `mk-${timestamp}${random}${userId.substring(0, 8)}`
}

/**
 * Rate limiting (simple in-memory implementation)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(identifier: string, maxRequests = 100, windowMs = 60000): boolean {
  const now = Date.now()
  const windowStart = now - windowMs
  
  const current = rateLimitMap.get(identifier)
  
  if (!current || current.resetTime < windowStart) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (current.count >= maxRequests) {
    return false
  }
  
  current.count++
  return true
}