import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGitHubServiceForUser } from '@/lib/github-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'all' | 'owner' | 'member' || 'owner'
    const sort = searchParams.get('sort') as 'created' | 'updated' | 'pushed' | 'full_name' || 'updated'
    const page = parseInt(searchParams.get('page') || '1')
    const per_page = parseInt(searchParams.get('per_page') || '30')

    // Get GitHub service for user
    const githubService = await getGitHubServiceForUser(session.user.email)
    if (!githubService) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 })
    }

    // Get user's repositories
    const repositories = await githubService.getUserRepositories({
      type,
      sort,
      direction: 'desc',
      page,
      per_page,
    })

    return NextResponse.json({
      repositories,
      pagination: {
        page,
        per_page,
        total: repositories.length,
        has_more: repositories.length === per_page
      }
    })

  } catch (error) {
    console.error('Error fetching GitHub repositories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    )
  }
}