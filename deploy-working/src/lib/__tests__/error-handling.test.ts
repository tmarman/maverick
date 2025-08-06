import {
  MaverickError,
  ErrorCodes,
  generateRequestId,
  extractErrorContext,
  logError,
  logWarning,
  logInfo,
  createErrorResponse,
  withErrorHandling,
  Validators,
  withRetry
} from '../error-handling'
import { NextRequest } from 'next/server'

// Mock console methods - will be set up in beforeEach
let mockConsoleError: jest.SpyInstance
let mockConsoleWarn: jest.SpyInstance  
let mockConsoleLog: jest.SpyInstance

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      data,
      status: options?.status || 200,
      headers: new Map()
    }))
  }
}))

describe('Error Handling Library', () => {
  beforeEach(() => {
    // Set up console spies after jest.setup.js has run
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation()
    mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation()
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation()
  })

  afterEach(() => {
    // Restore console methods and clear mocks
    mockConsoleError?.mockRestore()
    mockConsoleWarn?.mockRestore()
    mockConsoleLog?.mockRestore()
    jest.clearAllMocks()
  })

  describe('MaverickError', () => {
    it('should create error with all properties', () => {
      const context = { requestId: 'test-123', userId: 'user-456' }
      const error = new MaverickError({
        message: 'Test error',
        code: ErrorCodes.VALIDATION_ERROR,
        statusCode: 400,
        context,
        metadata: { field: 'test' }
      })

      expect(error.message).toBe('Test error')
      expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR)
      expect(error.statusCode).toBe(400)
      expect(error.context).toBe(context)
      expect(error.metadata).toEqual({ field: 'test' })
      expect(error.name).toBe('MaverickError')
    })

    it('should use default values', () => {
      const error = new MaverickError({
        message: 'Simple error'
      })

      expect(error.code).toBe('UNKNOWN_ERROR')
      expect(error.statusCode).toBe(500)
      expect(error.context).toBeUndefined()
      expect(error.metadata).toBeUndefined()
    })
  })

  describe('generateRequestId', () => {
    it('should generate unique request IDs', () => {
      const id1 = generateRequestId()
      const id2 = generateRequestId()
      
      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
      expect(id1.length).toBe(9)
      expect(id2.length).toBe(9)
    })
  })

  describe('extractErrorContext', () => {
    it('should extract context from request', () => {
      const mockRequest = {
        url: 'https://example.com/api/test',
        method: 'POST',
        headers: new Map([
          ['user-agent', 'Mozilla/5.0'],
          ['x-forwarded-for', '192.168.1.1']
        ])
      } as unknown as Request

      const context = extractErrorContext(mockRequest, { userId: 'test-user' })

      expect(context.endpoint).toBe('https://example.com/api/test')
      expect(context.method).toBe('POST')
      expect(context.userAgent).toBe('Mozilla/5.0')
      expect(context.ip).toBe('192.168.1.1')
      expect(context.userId).toBe('test-user')
      expect(context.requestId).toBeDefined()
      expect(context.timestamp).toBeDefined()
    })

    it('should work without request object', () => {
      const context = extractErrorContext(undefined, { projectId: 'test-project' })

      expect(context.projectId).toBe('test-project')
      expect(context.requestId).toBeDefined()
      expect(context.timestamp).toBeDefined()
      expect(context.endpoint).toBeUndefined()
    })
  })

  describe('logging functions', () => {
    const testContext = { requestId: 'test-123', userId: 'user-456' }

    it('should log errors with structured format', () => {
      const error = new Error('Test error')
      logError(error, testContext)

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/🚨 \[test-123\] Error:/),
        expect.objectContaining({
          requestId: 'test-123',
          userId: 'user-456',
          errorDetails: expect.objectContaining({
            message: 'Test error',
            name: 'Error'
          })
        })
      )
    })

    it('should log warnings with structured format', () => {
      logWarning('Test warning', testContext, { extra: 'data' })

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringMatching(/⚠️ \[test-123\] Warning:/),
        expect.objectContaining({
          requestId: 'test-123',
          userId: 'user-456',
          message: 'Test warning',
          metadata: { extra: 'data' }
        })
      )
    })

    it('should log info with structured format', () => {
      logInfo('Test info', testContext, { extra: 'data' })

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/ℹ️ \[test-123\] Info:/),
        expect.objectContaining({
          requestId: 'test-123',
          userId: 'user-456',
          message: 'Test info',
          metadata: { extra: 'data' }
        })
      )
    })
  })

  describe('createErrorResponse', () => {
    it('should create standardized error response for MaverickError', () => {
      const context = { requestId: 'test-123' }
      const error = new MaverickError({
        message: 'Validation failed',
        code: ErrorCodes.VALIDATION_ERROR,
        statusCode: 400,
        context
      })

      const response = createErrorResponse(error, context)

      expect(response.data).toEqual({
        error: true,
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Validation failed',
        requestId: 'test-123',
        timestamp: expect.any(String)
      })
      expect(response.status).toBe(400)
    })

    it('should handle regular Error objects', () => {
      const error = new Error('Something went wrong')
      const context = { requestId: 'test-123' }

      const response = createErrorResponse(error, context)

      expect(response.data).toEqual({
        error: true,
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: 'Something went wrong',
        requestId: 'test-123',
        timestamp: expect.any(String)
      })
      expect(response.status).toBe(500)
    })

    it('should map common error patterns to status codes', () => {
      const unauthorizedError = new Error('Unauthorized access')
      const response = createErrorResponse(unauthorizedError)

      expect(response.status).toBe(401)
      expect(response.data.code).toBe(ErrorCodes.UNAUTHORIZED)
    })

    it('should include stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const error = new Error('Test error')
      const response = createErrorResponse(error, undefined, true)

      expect(response.data.stack).toBeDefined()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('withErrorHandling', () => {
    it('should wrap handler and catch errors', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Handler error'))
      const wrappedHandler = withErrorHandling(handler)

      const result = await wrappedHandler('arg1', 'arg2')

      expect(handler).toHaveBeenCalledWith('arg1', 'arg2')
      expect(result.data.error).toBe(true)
      expect(result.data.message).toBe('Handler error')
    })

    it('should return handler result when no error', async () => {
      const mockResult = { success: true }
      const handler = jest.fn().mockResolvedValue(mockResult)
      const wrappedHandler = withErrorHandling(handler)

      const result = await wrappedHandler('arg1', 'arg2')

      expect(result).toBe(mockResult)
    })

    it('should extract context using provided extractor', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Test error'))
      const contextExtractor = jest.fn().mockReturnValue({ userId: 'extracted-user' })
      const wrappedHandler = withErrorHandling(handler, contextExtractor)

      await wrappedHandler('arg1', 'arg2')

      expect(contextExtractor).toHaveBeenCalledWith('arg1', 'arg2')
    })
  })

  describe('Validators', () => {
    it('should validate required fields', () => {
      expect(() => Validators.required('value', 'field')).not.toThrow()
      expect(() => Validators.required('', 'field')).toThrow(MaverickError)
      expect(() => Validators.required(null, 'field')).toThrow(MaverickError)
      expect(() => Validators.required(undefined, 'field')).toThrow(MaverickError)
    })

    it('should validate strings', () => {
      expect(() => Validators.string('test', 'field')).not.toThrow()
      expect(() => Validators.string(123, 'field')).toThrow(MaverickError)
      expect(() => Validators.string(null, 'field')).toThrow(MaverickError)
    })

    it('should validate email addresses', () => {
      expect(() => Validators.email('test@example.com')).not.toThrow()
      expect(() => Validators.email('user+tag@domain.co.uk')).not.toThrow()
      expect(() => Validators.email('invalid-email')).toThrow(MaverickError)
      expect(() => Validators.email('test@')).toThrow(MaverickError)
    })

    it('should validate project names', () => {
      expect(() => Validators.projectName('my-project')).not.toThrow()
      expect(() => Validators.projectName('project123')).not.toThrow()
      expect(() => Validators.projectName('My-Project')).toThrow(MaverickError)
      expect(() => Validators.projectName('project_name')).toThrow(MaverickError)
    })

    it('should validate UUIDs', () => {
      expect(() => Validators.uuid('123e4567-e89b-12d3-a456-426614174000')).not.toThrow()
      expect(() => Validators.uuid('invalid-uuid')).toThrow(MaverickError)
      expect(() => Validators.uuid('123e4567-e89b-12d3-a456')).toThrow(MaverickError)
    })
  })

  describe('withRetry', () => {
    it('should retry failed operations', async () => {
      let attemptCount = 0
      const operation = jest.fn().mockImplementation(() => {
        attemptCount++
        if (attemptCount < 3) {
          throw new Error('Temporary failure')
        }
        return 'success'
      })

      const result = await withRetry(operation, 3, 10) // 10ms delay for fast tests

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should throw error after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent failure'))

      await expect(withRetry(operation, 2, 10)).rejects.toThrow('Persistent failure')
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should succeed on first try', async () => {
      const operation = jest.fn().mockResolvedValue('immediate success')

      const result = await withRetry(operation, 3, 10)

      expect(result).toBe('immediate success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should use exponential backoff', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Always fails'))
      const startTime = Date.now()

      await expect(withRetry(operation, 3, 10)).rejects.toThrow()

      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Should take at least 10ms + 20ms = 30ms for exponential backoff
      expect(totalTime).toBeGreaterThan(25)
    })
  })

  describe('ErrorCodes', () => {
    it('should have all expected error codes', () => {
      expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED')
      expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR')
      expect(ErrorCodes.PROJECT_NOT_FOUND).toBe('PROJECT_NOT_FOUND')
      expect(ErrorCodes.AI_PROVIDER_ERROR).toBe('AI_PROVIDER_ERROR')
      expect(ErrorCodes.DATABASE_CONNECTION_ERROR).toBe('DATABASE_CONNECTION_ERROR')
      expect(ErrorCodes.INTERNAL_SERVER_ERROR).toBe('INTERNAL_SERVER_ERROR')
    })
  })
})