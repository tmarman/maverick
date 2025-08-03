/**
 * Client-side validation utilities for the Maverick platform
 * Provides consistent validation across forms and user inputs
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

/**
 * Base validation function
 */
export function validateField(value: any, rules: ValidationRule, fieldName: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required validation
  if (rules.required && (value === undefined || value === null || value === '')) {
    errors.push(`${fieldName} is required`)
    return { isValid: false, errors, warnings }
  }

  // Skip other validations if value is empty and not required
  if (!value && !rules.required) {
    return { isValid: true, errors: [], warnings }
  }

  // String validations
  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`${fieldName} must be at least ${rules.minLength} characters`)
    }
    
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`${fieldName} must be no more than ${rules.maxLength} characters`)
    }
    
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(`${fieldName} format is invalid`)
    }
  }

  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(value)
    if (customError) {
      errors.push(customError)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Predefined validation rules for common fields
 */
export const ValidationRules = {
  // Project names: lowercase letters, numbers, hyphens only
  projectName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-z0-9-]+$/,
    custom: (value: string) => {
      if (value?.startsWith('-') || value?.endsWith('-')) {
        return 'Project name cannot start or end with a hyphen'
      }
      if (value?.includes('--')) {
        return 'Project name cannot contain consecutive hyphens'
      }
      return null
    }
  },

  // Work item titles
  workItemTitle: {
    required: true,
    minLength: 3,
    maxLength: 100,
    custom: (value: string) => {
      if (value?.trim() !== value) {
        return 'Title cannot start or end with whitespace'
      }
      return null
    }
  },

  // Work item descriptions
  workItemDescription: {
    required: true,
    minLength: 10,
    maxLength: 2000,
    custom: (value: string) => {
      if (value && value.split(' ').length < 3) {
        return 'Description should contain at least 3 words'
      }
      return null
    }
  },

  // Email addresses
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (value?.length > 254) {
        return 'Email address is too long'
      }
      return null
    }
  },

  // Passwords
  password: {
    required: true,
    minLength: 8,
    maxLength: 128,
    custom: (value: string) => {
      if (!/(?=.*[a-z])/.test(value)) {
        return 'Password must contain at least one lowercase letter'
      }
      if (!/(?=.*[A-Z])/.test(value)) {
        return 'Password must contain at least one uppercase letter'
      }
      if (!/(?=.*\d)/.test(value)) {
        return 'Password must contain at least one number'
      }
      return null
    }
  },

  // GitHub repository names
  repositoryName: {
    required: true,
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9._-]+$/,
    custom: (value: string) => {
      if (value?.startsWith('.') || value?.endsWith('.')) {
        return 'Repository name cannot start or end with a period'
      }
      return null
    }
  },

  // URLs
  url: {
    required: false,
    custom: (value: string) => {
      if (!value) return null
      try {
        new URL(value)
        return null
      } catch {
        return 'Please enter a valid URL'
      }
    }
  },

  // UUIDs
  uuid: {
    required: true,
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  }
}

/**
 * Validate multiple fields at once
 */
export function validateForm(
  data: Record<string, any>, 
  rules: Record<string, ValidationRule>
): ValidationResult {
  const allErrors: string[] = []
  const allWarnings: string[] = []

  for (const [fieldName, fieldRules] of Object.entries(rules)) {
    const result = validateField(data[fieldName], fieldRules, fieldName)
    allErrors.push(...result.errors)
    if (result.warnings) {
      allWarnings.push(...result.warnings)
    }
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings.length > 0 ? allWarnings : undefined
  }
}

/**
 * Sanitize user input to prevent XSS and other attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 10000) // Limit length
}

/**
 * Sanitize markdown input (allow basic markdown but prevent XSS)
 */
export function sanitizeMarkdown(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 50000) // Limit length for markdown
}

/**
 * Validate file uploads
 */
export interface FileValidationOptions {
  maxSize?: number // in bytes
  allowedTypes?: string[]
  allowedExtensions?: string[]
}

export function validateFile(file: File, options: FileValidationOptions = {}): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Size validation
  if (options.maxSize && file.size > options.maxSize) {
    const maxMB = Math.round(options.maxSize / (1024 * 1024))
    errors.push(`File size must be less than ${maxMB}MB`)
  }

  // Type validation
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`)
  }

  // Extension validation
  if (options.allowedExtensions) {
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !options.allowedExtensions.includes(extension)) {
      errors.push(`File extension must be one of: ${options.allowedExtensions.join(', ')}`)
    }
  }

  // Security warnings
  const suspiciousExtensions = ['exe', 'bat', 'cmd', 'scr', 'com', 'pif']
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension && suspiciousExtensions.includes(extension)) {
    warnings.push('This file type may contain executable code')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Rate limiting helpers for client-side
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map()

  check(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(key) || []
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < windowMs)
    
    if (recentAttempts.length >= maxAttempts) {
      return false // Rate limited
    }

    // Add this attempt
    recentAttempts.push(now)
    this.attempts.set(key, recentAttempts)
    
    return true // Allow request
  }

  reset(key: string): void {
    this.attempts.delete(key)
  }
}

export const clientRateLimiter = new RateLimiter()

/**
 * Security headers for API responses
 */
export const SecurityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:",
}

/**
 * Validate and sanitize environment variables
 */
export function validateEnvVar(name: string, value: string | undefined, required = true): string {
  if (required && !value) {
    throw new Error(`Required environment variable ${name} is not set`)
  }
  
  if (!value) return ''
  
  // Basic sanitization
  return value.trim().replace(/[<>]/g, '')
}

/**
 * Common validation patterns
 */
export const Patterns = {
  projectName: /^[a-z0-9-]+$/,
  username: /^[a-zA-Z0-9_-]{3,20}$/,
  slug: /^[a-z0-9-]+$/,
  semver: /^\d+\.\d+\.\d+$/,
  hexColor: /^#[0-9A-Fa-f]{6}$/,
  ipAddress: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  port: /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/
}

/**
 * Error messages for common validation failures
 */
export const ErrorMessages = {
  required: (field: string) => `${field} is required`,
  minLength: (field: string, min: number) => `${field} must be at least ${min} characters`,
  maxLength: (field: string, max: number) => `${field} must be no more than ${max} characters`,
  pattern: (field: string) => `${field} format is invalid`,
  email: 'Please enter a valid email address',
  password: 'Password must contain at least 8 characters with uppercase, lowercase, and numbers',
  projectName: 'Project name must contain only lowercase letters, numbers, and hyphens',
  url: 'Please enter a valid URL',
  fileSize: (maxMB: number) => `File size must be less than ${maxMB}MB`,
  fileType: (types: string[]) => `File type must be one of: ${types.join(', ')}`
}