import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient | null = null
let lastHealthCheck = 0
let isHealthy = false
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes

// Database connection with retry logic
export async function getDatabase(): Promise<PrismaClient> {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })
  }

  // Check health periodically
  const now = Date.now()
  if (now - lastHealthCheck > HEALTH_CHECK_INTERVAL || !isHealthy) {
    try {
      await prisma.$queryRaw`SELECT 1`
      isHealthy = true
      lastHealthCheck = now
    } catch (error) {
      console.error('Database health check failed:', error)
      isHealthy = false
      throw new DatabaseError('Database is not accessible', error)
    }
  }

  return prisma
}

// Database health status
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean
  lastCheck: number
  error?: string
}> {
  try {
    const db = await getDatabase()
    await db.$queryRaw`SELECT 1`
    return {
      healthy: true,
      lastCheck: Date.now()
    }
  } catch (error) {
    return {
      healthy: false,
      lastCheck: Date.now(),
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

// Custom error class for database issues
export class DatabaseError extends Error {
  public originalError?: Error

  constructor(message: string, originalError?: unknown) {
    super(message)
    this.name = 'DatabaseError'
    if (originalError instanceof Error) {
      this.originalError = originalError
    }
  }
}

// Retry wrapper for database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt === maxRetries) {
        throw new DatabaseError(`Operation failed after ${maxRetries} attempts`, lastError)
      }

      // Exponential backoff
      const delay = delayMs * Math.pow(2, attempt - 1)
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect()
    prisma = null
    isHealthy = false
  }
}