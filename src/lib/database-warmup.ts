import { prisma } from './prisma'

let isWarmedUp = false
let warmupPromise: Promise<boolean> | null = null

export async function warmupDatabase(): Promise<boolean> {
  // Return existing warmup promise if already in progress
  if (warmupPromise) {
    return warmupPromise
  }
  
  // Return immediately if already warmed up
  if (isWarmedUp) {
    return true
  }

  console.log('🔥 Warming up Azure SQL Serverless database...')
  
  warmupPromise = (async () => {
    try {
      const startTime = Date.now()
      
      // Simple query to wake up the database
      await prisma.$queryRaw`SELECT 1 as warmup`
      
      const duration = Date.now() - startTime
      console.log(`✅ Database warmed up successfully in ${duration}ms`)
      
      isWarmedUp = true
      return true
    } catch (error) {
      console.error('❌ Database warmup failed:', error)
      return false
    } finally {
      warmupPromise = null
    }
  })()
  
  return warmupPromise
}

// Reset warmup status (useful for testing)
export function resetWarmupStatus() {
  isWarmedUp = false
  warmupPromise = null
}

// Middleware-style function to ensure database is warmed up before operations
export async function ensureDatabaseWarmed(): Promise<void> {
  if (!isWarmedUp) {
    console.log('🔥 Database not warmed up, warming up now...')
    await warmupDatabase()
  }
}

// Get warmup status
export function getDatabaseWarmupStatus(): { isWarmedUp: boolean, inProgress: boolean } {
  return {
    isWarmedUp,
    inProgress: warmupPromise !== null
  }
}