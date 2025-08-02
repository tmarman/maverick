import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/database-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's accessible companies using our new database method
    const companies = await db.getUserCompanies(session.user.email)

    // If no companies, return empty array (they'll see the demo data fallback in the UI)
    return NextResponse.json(companies)

  } catch (error) {
    console.error('Error fetching companies:', error)
    
    // Return empty array to trigger demo data fallback
    return NextResponse.json([])
  }
}