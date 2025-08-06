import { NextResponse } from 'next/server'

/**
 * Comprehensive error handling and logging utilities for Maverick platform
 */

export interface ErrorContext {
  requestId?: string
  userId?: string
  projectId?: string
  endpoint?: string
  method?: string
  timestamp?: string
  userAgent?: string
  ip?: string
  sessionId?: string
}

export interface ErrorDetails {
  message: string
  code?: string
  statusCode?: number
  context?: ErrorContext
  originalError?: unknown
  stack?: string
  metadata?: Record<string, unknown>
}

export class MaverickError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly context?: ErrorContext
  public readonly metadata?: Record<string, unknown>
  public readonly originalError?: unknown

  constructor(details: ErrorDetails) {
    super(details.message)
    this.name = 'MaverickError'
    this.code = details.code || 'UNKNOWN_ERROR'
    this.statusCode = details.statusCode || 500
    this.context = details.context
    this.metadata = details.metadata
    this.originalError = details.originalError
    
    if (details.stack) {
      this.stack = details.stack
    }
  }
}

/**
 * Standard error codes used throughout the platform
 */
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_INPUT_FORMAT: 'INVALID_INPUT_FORMAT',
  
  // Project Management
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  WORK_ITEM_NOT_FOUND: 'WORK_ITEM_NOT_FOUND',
  INVALID_PROJECT_NAME: 'INVALID_PROJECT_NAME',
  PROJECT_ACCESS_DENIED: 'PROJECT_ACCESS_DENIED',
  
  // AI Integration
  AI_PROVIDER_ERROR: 'AI_PROVIDER_ERROR',
  AI_TIMEOUT: 'AI_TIMEOUT',
  AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',
  CLAUDE_CODE_ERROR: 'CLAUDE_CODE_ERROR',
  
  // File System
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_PERMISSION_ERROR: 'FILE_PERMISSION_ERROR',
  DIRECTORY_CREATION_FAILED: 'DIRECTORY_CREATION_FAILED',
  
  // External APIs
  GITHUB_API_ERROR: 'GITHUB_API_ERROR',
  SQUARE_API_ERROR: 'SQUARE_API_ERROR',
  EXTERNAL_SERVICE_UNAVAILABLE: 'EXTERNAL_SERVICE_UNAVAILABLE',
  
  // Database
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR: 'DATABASE_QUERY_ERROR',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  
  // General
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TIMEOUT: 'TIMEOUT'
} as const

/**
 * Generate a unique request ID for tracking
 */
export function generateRequestId(): string {
  return Math.random().toString(36).substr(2, 9)
}

/**
 * Extract error context from a request
 */
export function extractErrorContext(request?: Request, additionalContext?: Partial<ErrorContext>): ErrorContext {
  const requestId = generateRequestId()
  const timestamp = new Date().toISOString()
  
  let context: ErrorContext = {
    requestId,
    timestamp,
    ...additionalContext
  }
  
  if (request) {
    context.endpoint = request.url
    context.method = request.method
    context.userAgent = request.headers.get('user-agent') || undefined
    context.ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
  }
  
  return context
}

/**
 * Log error with structured format
 */
export function logError(error: unknown, context?: ErrorContext): void {
  const logEntry = {
    timestamp: context?.timestamp || new Date().toISOString(),
    level: 'ERROR',
    requestId: context?.requestId,
    userId: context?.userId,
    projectId: context?.projectId,
    endpoint: context?.endpoint,
    method: context?.method,
    errorDetails: {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'UnknownError',
      stack: error instanceof Error ? error.stack : undefined,
      code: error instanceof MaverickError ? error.code : undefined,
      statusCode: error instanceof MaverickError ? error.statusCode : undefined
    },
    context
  }
  
  // Use console.error with structured format for now
  // TODO: Replace with proper logging service (e.g., Winston, Datadog)
  console.error(`🚨 [${logEntry.requestId}] ${logEntry.errorDetails.name}:`, logEntry)
}

/**
 * Log warning with structured format
 */
export function logWarning(message: string, context?: ErrorContext, metadata?: Record<string, unknown>): void {
  const logEntry = {
    timestamp: context?.timestamp || new Date().toISOString(),
    level: 'WARNING',
    requestId: context?.requestId,
    userId: context?.userId,
    projectId: context?.projectId,
    message,
    metadata,
    context
  }
  
  console.warn(`⚠️ [${logEntry.requestId}] Warning:`, logEntry)
}

/**
 * Log info with structured format
 */
export function logInfo(message: string, context?: ErrorContext, metadata?: Record<string, unknown>): void {
  const logEntry = {
    timestamp: context?.timestamp || new Date().toISOString(),
    level: 'INFO',
    requestId: context?.requestId,
    userId: context?.userId,
    projectId: context?.projectId,
    message,
    metadata,
    context
  }
  
  console.log(`ℹ️ [${logEntry.requestId}] Info:`, logEntry)
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: unknown, 
  context?: ErrorContext,
  includeStack = false
): NextResponse {
  let statusCode = 500
  let errorCode: string = ErrorCodes.INTERNAL_SERVER_ERROR
  let message = 'An unexpected error occurred'
  
  if (error instanceof MaverickError) {
    statusCode = error.statusCode
    errorCode = error.code
    message = error.message
  } else if (error instanceof Error) {
    message = error.message
    
    // Map common error patterns to status codes
    if (error.message.toLowerCase().includes('unauthorized')) {
      statusCode = 401
      errorCode = ErrorCodes.UNAUTHORIZED
    } else if (error.message.toLowerCase().includes('forbidden')) {
      statusCode = 403
      errorCode = ErrorCodes.FORBIDDEN
    } else if (error.message.toLowerCase().includes('not found')) {
      statusCode = 404
      errorCode = ErrorCodes.RECORD_NOT_FOUND
    } else if (error.message.toLowerCase().includes('validation')) {
      statusCode = 400
      errorCode = ErrorCodes.VALIDATION_ERROR
    }
  }
  
  // Log the error
  logError(error, context)
  
  const responseBody: any = {
    error: true,
    code: errorCode,
    message,
    requestId: context?.requestId,
    timestamp: context?.timestamp || new Date().toISOString()
  }
  
  // Include stack trace in development
  if (includeStack && process.env.NODE_ENV === 'development' && error instanceof Error) {
    responseBody.stack = error.stack
  }
  
  return NextResponse.json(responseBody, { status: statusCode })
}

/**
 * Wrapper for API route handlers with automatic error handling
 */
export function withErrorHandling<T extends unknown[], R>(
  handler: (...args: T) => Promise<R>,
  contextExtractor?: (...args: T) => Partial<ErrorContext>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    let context: ErrorContext | undefined
    
    try {
      // Extract context if extractor provided
      if (contextExtractor) {
        const additionalContext = contextExtractor(...args)
        // Try to extract from first argument if it's a Request
        const request = args[0] as unknown
        if (request && typeof request === 'object' && 'url' in request) {
          context = extractErrorContext(request as Request, additionalContext)
        } else {
          context = { ...extractErrorContext(), ...additionalContext }
        }
      }
      
      // Execute the handler
      return await handler(...args)
    } catch (error) {
      // Return standardized error response
      return createErrorResponse(error, context) as R
    }
  }
}

/**
 * Validation helper functions
 */
export const Validators = {
  required(value: unknown, fieldName: string): void {
    if (value === undefined || value === null || value === '') {
      throw new MaverickError({
        message: `${fieldName} is required`,
        code: ErrorCodes.MISSING_REQUIRED_FIELD,
        statusCode: 400
      })
    }
  },
  
  string(value: unknown, fieldName: string): void {
    if (typeof value !== 'string') {
      throw new MaverickError({
        message: `${fieldName} must be a string`,
        code: ErrorCodes.INVALID_INPUT_FORMAT,
        statusCode: 400
      })
    }
  },
  
  email(value: string, fieldName = 'email'): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      throw new MaverickError({
        message: `${fieldName} must be a valid email address`,
        code: ErrorCodes.INVALID_INPUT_FORMAT,
        statusCode: 400
      })
    }
  },
  
  projectName(value: string): void {
    const projectNameRegex = /^[a-z0-9-]+$/
    if (!projectNameRegex.test(value)) {
      throw new MaverickError({
        message: 'Project name must contain only lowercase letters, numbers, and hyphens',
        code: ErrorCodes.INVALID_PROJECT_NAME,
        statusCode: 400
      })
    }
  },
  
  uuid(value: string, fieldName = 'id'): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(value)) {
      throw new MaverickError({
        message: `${fieldName} must be a valid UUID`,
        code: ErrorCodes.INVALID_INPUT_FORMAT,
        statusCode: 400
      })
    }
  }
}

/**
 * Retry helper for operations that might fail temporarily
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
  context?: ErrorContext
): Promise<T> {
  let lastError: unknown
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries) {
        logError(error, context)
        throw error
      }
      
      logWarning(
        `Operation failed, retrying (${attempt}/${maxRetries})`,
        context,
        { 
          attempt, 
          maxRetries, 
          error: error instanceof Error ? error.message : String(error),
          nextRetryIn: delayMs
        }
      )
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs))
      
      // Exponential backoff
      delayMs *= 2
    }
  }
  
  throw lastError
}

/**
 * Rate limiting helper (simple in-memory implementation)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  key: string, 
  maxRequests = 100, 
  windowMs = 60000,
  context?: ErrorContext
): void {
  const now = Date.now()
  const entry = rateLimitStore.get(key)
  
  if (!entry || now > entry.resetTime) {
    // Reset window
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return
  }
  
  if (entry.count >= maxRequests) {
    throw new MaverickError({
      message: 'Rate limit exceeded. Please try again later.',
      code: ErrorCodes.RATE_LIMIT_EXCEEDED,
      statusCode: 429,
      context,
      metadata: {
        maxRequests,
        windowMs,
        currentCount: entry.count,
        resetTime: entry.resetTime
      }
    })
  }
  
  entry.count++
}

/**
 * Health check utilities
 */
export const HealthCheck = {
  async database(): Promise<boolean> {
    try {
      // TODO: Add actual database health check
      // For now, just return true
      return true
    } catch (error) {
      logError(error, { endpoint: '/health/database' })
      return false
    }
  },
  
  async ai(): Promise<boolean> {
    try {
      // TODO: Add AI provider health check
      return true
    } catch (error) {
      logError(error, { endpoint: '/health/ai' })
      return false
    }
  },
  
  async external(): Promise<{ github: boolean; square: boolean }> {
    return {
      github: true, // TODO: Actual GitHub API health check
      square: true  // TODO: Actual Square API health check
    }
  }
}