import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  logWarning, 
  logError, 
  ErrorCodes, 
  MaverickError, 
  extractErrorContext,
  checkRateLimit 
} from '@/lib/error-handling'

/**
 * Security middleware and utilities for the Maverick platform
 */

export interface SecurityConfig {
  requireAuth?: boolean
  requireOwnership?: boolean
  allowedMethods?: string[]
  rateLimitKey?: string
  maxRequestsPerMinute?: number
  requireHTTPS?: boolean
  allowedOrigins?: string[]
  validateCSRF?: boolean
}

/**
 * Security middleware wrapper for API routes
 */
export function withSecurity(config: SecurityConfig = {}) {
  return function securityMiddleware<T extends unknown[], R>(
    handler: (...args: T) => Promise<R>
  ) {
    return async (...args: T): Promise<R | NextResponse> => {
      try {
        // Extract request from arguments (assuming first arg is NextRequest)
        const request = args[0] as unknown as NextRequest
        if (!request || typeof request !== 'object' || !('url' in request)) {
          throw new MaverickError({
            message: 'Invalid request object',
            code: ErrorCodes.INTERNAL_SERVER_ERROR,
            statusCode: 500
          })
        }

        const context = extractErrorContext(request)

        // HTTPS validation (in production)
        if (config.requireHTTPS && process.env.NODE_ENV === 'production') {
          const url = new URL(request.url)
          if (url.protocol !== 'https:') {
            logWarning('HTTP request in production', context)
            throw new MaverickError({
              message: 'HTTPS required',
              code: ErrorCodes.FORBIDDEN,
              statusCode: 403,
              context
            })
          }
        }

        // Method validation
        if (config.allowedMethods && !config.allowedMethods.includes(request.method)) {
          logWarning(`Disallowed method: ${request.method}`, context)
          throw new MaverickError({
            message: `Method ${request.method} not allowed`,
            code: ErrorCodes.VALIDATION_ERROR,
            statusCode: 405,
            context
          })
        }

        // CORS validation
        const origin = request.headers.get('origin')
        if (config.allowedOrigins && origin && !config.allowedOrigins.includes(origin)) {
          logWarning(`Disallowed origin: ${origin}`, context)
          throw new MaverickError({
            message: 'Origin not allowed',
            code: ErrorCodes.FORBIDDEN,
            statusCode: 403,
            context
          })
        }

        // Rate limiting
        if (config.rateLimitKey && config.maxRequestsPerMinute) {
          const ip = getClientIP(request)
          const key = `${config.rateLimitKey}:${ip}`
          
          try {
            checkRateLimit(key, config.maxRequestsPerMinute, 60000, context)
          } catch (error) {
            logWarning('Rate limit exceeded', context, { ip, key })
            throw error
          }
        }

        // Authentication validation
        if (config.requireAuth) {
          const session = await getServerSession(authOptions)
          if (!session?.user?.email) {
            logWarning('Authentication required but not provided', context)
            throw new MaverickError({
              message: 'Authentication required',
              code: ErrorCodes.UNAUTHORIZED,
              statusCode: 401,
              context
            })
          }

          // Add user to context
          context.userId = session.user.id
        }

        // Content Security Policy headers
        const response = await handler(...args) as NextResponse
        
        if (response && typeof response === 'object' && 'headers' in response) {
          // Add security headers
          response.headers.set('X-Content-Type-Options', 'nosniff')
          response.headers.set('X-Frame-Options', 'DENY')
          response.headers.set('X-XSS-Protection', '1; mode=block')
          response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
          
          // Add CORS headers if origins are specified
          if (config.allowedOrigins && origin && config.allowedOrigins.includes(origin)) {
            response.headers.set('Access-Control-Allow-Origin', origin)
            response.headers.set('Access-Control-Allow-Credentials', 'true')
          }
        }

        return response
      } catch (error) {
        logError(error, extractErrorContext(args[0] as NextRequest))
        throw error
      }
    }
  }
}

/**
 * Extract client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for')
  const xRealIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  // Priority: CF-Connecting-IP > X-Real-IP > X-Forwarded-For > connection IP
  return cfConnectingIP || 
         xRealIP || 
         (xForwardedFor ? xForwardedFor.split(',')[0].trim() : '') ||
         'unknown'
}

/**
 * Validate request body size
 */
export async function validateRequestSize(
  request: NextRequest, 
  maxSizeBytes: number = 1024 * 1024 // 1MB default
): Promise<void> {
  const contentLength = request.headers.get('content-length')
  
  if (contentLength && parseInt(contentLength) > maxSizeBytes) {
    throw new MaverickError({
      message: `Request body too large. Maximum size: ${Math.round(maxSizeBytes / 1024)}KB`,
      code: ErrorCodes.VALIDATION_ERROR,
      statusCode: 413,
      context: extractErrorContext(request)
    })
  }
}

/**
 * Sanitize JSON input to prevent prototype pollution
 */
export function sanitizeJSON(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeJSON(item))
  }

  const sanitized: any = {}
  for (const [key, value] of Object.entries(obj)) {
    // Prevent prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue
    }
    
    // Recursively sanitize nested objects
    sanitized[key] = sanitizeJSON(value)
  }

  return sanitized
}

/**
 * Validate and sanitize project ownership
 */
export async function validateProjectOwnership(
  projectName: string, 
  userId: string,
  context?: any
): Promise<boolean> {
  try {
    // TODO: Implement actual ownership validation with database
    // For now, return true (allow all authenticated users)
    
    // In a real implementation, this would:
    // 1. Query the database for project ownership
    // 2. Check if user has access (owner, collaborator, etc.)
    // 3. Return boolean result
    
    return true
  } catch (error) {
    logError(error, context)
    throw new MaverickError({
      message: 'Failed to validate project ownership',
      code: ErrorCodes.PROJECT_ACCESS_DENIED,
      statusCode: 403,
      context
    })
  }
}

/**
 * Content Security Policy configurations
 */
export const CSPDirectives = {
  development: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'localhost:*'],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:', 'localhost:*'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", 'localhost:*', 'ws:', 'wss:'],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"]
  },
  
  production: {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'"], // Some UI libraries require inline styles
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", 'https:', 'wss:'],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
  }
}

/**
 * Generate CSP header value
 */
export function generateCSPHeader(environment: 'development' | 'production' = 'production'): string {
  const directives = CSPDirectives[environment]
  
  return Object.entries(directives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ')
}

/**
 * Security audit logging
 */
export function auditLog(action: string, details: any, context?: any): void {
  logWarning(`Security audit: ${action}`, context, {
    action,
    details,
    auditTimestamp: new Date().toISOString()
  })
}

/**
 * Input sanitization for different contexts
 */
export const InputSanitizer = {
  /**
   * Sanitize for HTML output (prevent XSS)
   */
  forHTML(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  },

  /**
   * Sanitize for JavaScript output
   */
  forJS(input: string): string {
    return input
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
  },

  /**
   * Sanitize for SQL (though we should use parameterized queries)
   */
  forSQL(input: string): string {
    return input.replace(/'/g, "''")
  },

  /**
   * Sanitize file names
   */
  forFileName(input: string): string {
    return input
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .replace(/\.{2,}/g, '.') // Prevent directory traversal
      .substring(0, 255)
  },

  /**
   * Sanitize for shell commands (use with extreme caution)
   */
  forShell(input: string): string {
    return input.replace(/[;&|`$(){}[\]\\]/g, '')
  }
}

/**
 * Common security configurations for different endpoint types
 */
export const SecurityConfigs = {
  // Public endpoints (no auth required)
  public: {
    requireAuth: false,
    allowedMethods: ['GET'],
    maxRequestsPerMinute: 100
  },

  // User authentication endpoints
  auth: {
    requireAuth: false,
    allowedMethods: ['POST'],
    maxRequestsPerMinute: 20,
    rateLimitKey: 'auth'
  },

  // Project management endpoints
  projectManagement: {
    requireAuth: true,
    requireOwnership: true,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    maxRequestsPerMinute: 200,
    rateLimitKey: 'project'
  },

  // AI/LLM endpoints (higher resource usage)
  ai: {
    requireAuth: true,
    allowedMethods: ['POST'],
    maxRequestsPerMinute: 30,
    rateLimitKey: 'ai'
  },

  // File upload endpoints
  upload: {
    requireAuth: true,
    allowedMethods: ['POST'],
    maxRequestsPerMinute: 10,
    rateLimitKey: 'upload'
  },

  // Admin endpoints
  admin: {
    requireAuth: true,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    maxRequestsPerMinute: 50,
    rateLimitKey: 'admin'
  }
}

/**
 * Detect suspicious patterns in requests
 */
export function detectSuspiciousActivity(request: NextRequest): string[] {
  const suspiciousPatterns: string[] = []
  
  const url = request.url.toLowerCase()
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || ''
  
  // SQL injection patterns
  if (url.includes('union') || url.includes('select') || url.includes('drop')) {
    suspiciousPatterns.push('potential_sql_injection')
  }
  
  // XSS patterns
  if (url.includes('<script') || url.includes('javascript:') || url.includes('onerror=')) {
    suspiciousPatterns.push('potential_xss')
  }
  
  // Directory traversal
  if (url.includes('..') || url.includes('%2e%2e')) {
    suspiciousPatterns.push('directory_traversal')
  }
  
  // Command injection
  if (url.includes('|') || url.includes('&&') || url.includes('$(')) {
    suspiciousPatterns.push('command_injection')
  }
  
  // Bot detection
  if (userAgent.includes('bot') || userAgent.includes('crawler') || userAgent.includes('spider')) {
    suspiciousPatterns.push('automated_request')
  }
  
  // Unusual request size
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB
    suspiciousPatterns.push('large_request')
  }
  
  return suspiciousPatterns
}