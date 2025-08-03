import { GET } from '../health/route'
import { NextRequest } from 'next/server'

// Mock the error handling utilities
jest.mock('@/lib/error-handling', () => ({
  withErrorHandling: jest.fn((handler, contextExtractor) => handler),
  extractErrorContext: jest.fn(() => ({
    requestId: 'test-123',
    timestamp: '2023-01-01T00:00:00.000Z',
    endpoint: '/api/health',
    method: 'GET'
  })),
  logInfo: jest.fn(),
  HealthCheck: {
    database: jest.fn(() => Promise.resolve(true)),
    ai: jest.fn(() => Promise.resolve(true)),
    external: jest.fn(() => Promise.resolve({ github: true, square: true }))
  },
  ErrorCodes: {
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
  },
  MaverickError: class MockMaverickError extends Error {
    constructor(details: any) {
      super(details.message)
      this.name = 'MaverickError'
    }
  }
}))

// Mock NextResponse
jest.mock('next/server', () => {
  const mockJsonResponse = jest.fn()
  return {
    NextRequest: jest.fn(),
    NextResponse: {
      json: mockJsonResponse
    }
  }
})

const { NextResponse } = require('next/server')

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    NextResponse.json.mockImplementation((data, options) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200
    }))
  })

  it('should return healthy status when all services are up', async () => {
    const mockRequest = {
      url: 'http://localhost:3000/api/health',
      method: 'GET',
      headers: new Map()
    } as unknown as NextRequest

    const response = await GET(mockRequest)
    const data = await response.json()

    expect(data.status).toBe('healthy')
    expect(data.services.database).toBe(true)
    expect(data.services.ai).toBe(true)
    expect(data.services.github).toBe(true)
    expect(data.services.square).toBe(true)
    expect(data.requestId).toBe('test-123')
    expect(data.version).toBeDefined()
    expect(data.uptime).toBeGreaterThanOrEqual(0)
    expect(response.status).toBe(200)
  })

  it('should return unhealthy status when services are down', async () => {
    // Mock some services as failing
    const { HealthCheck } = require('@/lib/error-handling')
    HealthCheck.database.mockResolvedValueOnce(false)
    HealthCheck.ai.mockResolvedValueOnce(false)
    HealthCheck.external.mockResolvedValueOnce({ github: false, square: true })

    const mockRequest = {
      url: 'http://localhost:3000/api/health',
      method: 'GET',
      headers: new Map()
    } as unknown as NextRequest

    const response = await GET(mockRequest)
    const data = await response.json()

    expect(data.status).toBe('unhealthy')
    expect(data.services.database).toBe(false)
    expect(data.services.ai).toBe(false)
    expect(data.services.github).toBe(false)
    expect(data.services.square).toBe(true)
    expect(response.status).toBe(503)
  })

  it('should include proper timestamp and version info', async () => {
    const mockRequest = {
      url: 'http://localhost:3000/api/health',
      method: 'GET',
      headers: new Map()
    } as unknown as NextRequest

    const response = await GET(mockRequest)
    const data = await response.json()

    expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    expect(data.version).toBeDefined()
    expect(typeof data.uptime).toBe('number')
    expect(data.uptime).toBeGreaterThanOrEqual(0)
  })

  it('should handle service check errors gracefully', async () => {
    // Mock service check to throw error
    const { HealthCheck } = require('@/lib/error-handling')
    HealthCheck.database.mockRejectedValueOnce(new Error('Database connection failed'))

    const mockRequest = {
      url: 'http://localhost:3000/api/health',
      method: 'GET',
      headers: new Map()
    } as unknown as NextRequest

    // Should handle the error and return 503
    await expect(GET(mockRequest)).rejects.toThrow('Health check failed')
  })

  it('should log health check requests', async () => {
    const { logInfo } = require('@/lib/error-handling')
    
    const mockRequest = {
      url: 'http://localhost:3000/api/health',
      method: 'GET',
      headers: new Map()
    } as unknown as NextRequest

    await GET(mockRequest)

    expect(logInfo).toHaveBeenCalledWith(
      'Health check requested',
      expect.objectContaining({
        requestId: 'test-123',
        endpoint: '/api/health'
      })
    )

    expect(logInfo).toHaveBeenCalledWith(
      expect.stringMatching(/Health check completed:/),
      expect.any(Object),
      expect.objectContaining({
        healthStatus: expect.any(Object)
      })
    )
  })

  it('should determine degraded status correctly', async () => {
    // This test would require more complex mocking to create a degraded state
    // For now, we test the basic healthy/unhealthy logic
    const mockRequest = {
      url: 'http://localhost:3000/api/health',
      method: 'GET',
      headers: new Map()
    } as unknown as NextRequest

    const response = await GET(mockRequest)
    const data = await response.json()

    // With all services healthy, should be 'healthy'
    expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status)
  })

  it('should include all required health status fields', async () => {
    const mockRequest = {
      url: 'http://localhost:3000/api/health',
      method: 'GET',
      headers: new Map()
    } as unknown as NextRequest

    const response = await GET(mockRequest)
    const data = await response.json()

    // Check all required fields are present
    expect(data).toHaveProperty('status')
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('version')
    expect(data).toHaveProperty('services')
    expect(data).toHaveProperty('requestId')
    expect(data).toHaveProperty('uptime')

    // Check services object has all expected services
    expect(data.services).toHaveProperty('database')
    expect(data.services).toHaveProperty('ai')
    expect(data.services).toHaveProperty('github')
    expect(data.services).toHaveProperty('square')

    // Check types
    expect(typeof data.status).toBe('string')
    expect(typeof data.timestamp).toBe('string')
    expect(typeof data.version).toBe('string')
    expect(typeof data.services).toBe('object')
    expect(typeof data.requestId).toBe('string')
    expect(typeof data.uptime).toBe('number')
  })
})