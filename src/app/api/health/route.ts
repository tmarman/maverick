import { NextRequest, NextResponse } from 'next/server'
import { 
  withErrorHandling, 
  extractErrorContext, 
  logInfo, 
  HealthCheck,
  ErrorCodes,
  MaverickError
} from '@/lib/error-handling'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  services: {
    database: boolean
    ai: boolean
    github: boolean
    square: boolean
  }
  requestId: string
  uptime: number
}

const startTime = Date.now()

async function healthHandler(request: NextRequest): Promise<NextResponse> {
  const context = extractErrorContext(request, { endpoint: '/api/health' })
  
  logInfo('Health check requested', context)
  
  try {
    // Check all services
    const [database, ai, external] = await Promise.all([
      HealthCheck.database(),
      HealthCheck.ai(),
      HealthCheck.external()
    ])
    
    const services = {
      database,
      ai,
      github: external.github,
      square: external.square
    }
    
    // Determine overall status
    const allHealthy = Object.values(services).every(status => status === true)
    const anyUnhealthy = Object.values(services).some(status => status === false)
    
    let status: 'healthy' | 'degraded' | 'unhealthy'
    if (allHealthy) {
      status = 'healthy'
    } else if (anyUnhealthy) {
      status = 'unhealthy'
    } else {
      status = 'degraded'
    }
    
    const healthStatus: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services,
      requestId: context.requestId!,
      uptime: Math.floor((Date.now() - startTime) / 1000)
    }
    
    // Return appropriate status code
    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503
    
    logInfo(`Health check completed: ${status}`, context, { healthStatus })
    
    return NextResponse.json(healthStatus, { status: statusCode })
    
  } catch (error) {
    throw new MaverickError({
      message: 'Health check failed',
      code: ErrorCodes.SERVICE_UNAVAILABLE,
      statusCode: 503,
      context,
      originalError: error
    })
  }
}

export const GET = withErrorHandling(healthHandler, (request) => ({
  endpoint: '/api/health',
  method: 'GET'
}))