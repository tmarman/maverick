import { NextResponse } from 'next/server'
import { getDatabaseWarmupStatus, warmupDatabase } from '@/lib/database-warmup'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const warmupStatus = getDatabaseWarmupStatus()
    
    // Test database connection
    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1 as test`
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'healthy',
      database: {
        connected: true,
        responseTime: `${responseTime}ms`,
        warmup: warmupStatus
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      database: {
        connected: false,
        error: error instanceof Error ? error.message : String(error),
        warmup: getDatabaseWarmupStatus()
      },
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}

export async function POST() {
  try {
    console.log('🔥 Manual database warmup requested...')
    const success = await warmupDatabase()
    
    return NextResponse.json({
      status: success ? 'warmed up' : 'warmup failed',
      warmup: getDatabaseWarmupStatus(),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'warmup error',
      error: error instanceof Error ? error.message : String(error),
      warmup: getDatabaseWarmupStatus(),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}