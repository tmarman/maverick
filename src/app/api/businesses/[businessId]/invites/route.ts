import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createApiLogger } from '@/lib/logging'

const apiLogger = createApiLogger('TeamInvitesAPI')

// Send team invitation
export async function POST(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  const startTime = Date.now()
  apiLogger.logRequest(request)

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { businessId } = params
    const { email, role = 'MEMBER', message } = await request.json()

    if (!email || !businessId) {
      return NextResponse.json({ 
        error: 'Email and business ID are required' 
      }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')

    // Verify the current user is an owner or admin of the business
    const currentUserMembership = await prisma.businessMember.findFirst({
      where: {
        businessId,
        userId: session.user.id,
        status: 'ACCEPTED',
        role: { in: ['OWNER', 'ADMIN'] }
      },
      include: {
        business: true
      }
    })

    if (!currentUserMembership) {
      return NextResponse.json({ 
        error: 'You do not have permission to invite members to this business' 
      }, { status: 403 })
    }

    // Check if user already exists
    let invitedUser = await prisma.user.findUnique({
      where: { email }
    })

    // If user doesn't exist, create a placeholder user account
    if (!invitedUser) {
      invitedUser = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0], // Use email prefix as default name
          // User will complete signup when they accept the invite
        }
      })
    }

    // Check if there's already a pending or accepted invitation
    const existingInvite = await prisma.businessMember.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId: invitedUser.id
        }
      }
    })

    if (existingInvite) {
      if (existingInvite.status === 'ACCEPTED') {
        return NextResponse.json({ 
          error: 'User is already a member of this business' 
        }, { status: 400 })
      }
      
      if (existingInvite.status === 'PENDING') {
        return NextResponse.json({ 
          error: 'An invitation is already pending for this user' 
        }, { status: 400 })
      }
    }

    // Create or update the invitation
    const invitation = await prisma.businessMember.upsert({
      where: {
        businessId_userId: {
          businessId,
          userId: invitedUser.id
        }
      },
      create: {
        businessId,
        userId: invitedUser.id,
        role,
        status: 'PENDING',
        invitedBy: session.user.id,
        invitedAt: new Date(),
        permissions: JSON.stringify({}), // Default permissions
      },
      update: {
        role,
        status: 'PENDING',
        invitedBy: session.user.id,
        invitedAt: new Date(),
      },
      include: {
        business: true,
        user: true
      }
    })

    // Send invitation email
    try {
      const { azureEmailService } = await import('@/lib/azure-email')
      
      const inviteUrl = `${process.env.NEXTAUTH_URL || 'https://beta.flywithmaverick.com'}/app/invites/${invitation.id}`
      const businessName = currentUserMembership.business.name
      const inviterName = session.user.name || session.user.email
      
      await azureEmailService.sendTeamInvitationEmail(
        email,
        inviterName,
        businessName,
        role,
        inviteUrl,
        message
      )
      
      apiLogger.info('Team invitation email sent', {
        businessId,
        invitedEmail: email,
        invitedBy: session.user.email,
        role
      })
    } catch (emailError) {
      apiLogger.error('Failed to send invitation email', emailError as Error, {
        businessId,
        invitedEmail: email
      })
      // Continue - the invitation is created, email failure shouldn't block
    }

    const response = NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.user.email,
        name: invitation.user.name,
        role: invitation.role,
        status: invitation.status,
        invitedAt: invitation.invitedAt,
        invitedBy: session.user.name || session.user.email
      },
      message: `Invitation sent to ${email}`
    })

    apiLogger.logResponse(request, response, Date.now() - startTime)
    return response

  } catch (error) {
    apiLogger.logError(request, error as Error)
    const response = NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    )
    apiLogger.logResponse(request, response, Date.now() - startTime)
    return response
  }
}

// Get pending invitations for a business
export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  const startTime = Date.now()
  apiLogger.logRequest(request)

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { businessId } = params
    const { prisma } = await import('@/lib/prisma')

    // Verify user has access to this business
    const userMembership = await prisma.businessMember.findFirst({
      where: {
        businessId,
        userId: session.user.id,
        status: 'ACCEPTED'
      }
    })

    if (!userMembership) {
      return NextResponse.json({ 
        error: 'You do not have access to this business' 
      }, { status: 403 })
    }

    // Get all invitations for this business
    const invitations = await prisma.businessMember.findMany({
      where: {
        businessId,
        status: { in: ['PENDING', 'ACCEPTED', 'DECLINED'] }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // PENDING first
        { invitedAt: 'desc' }
      ]
    })

    // Get inviter names
    const invitedByIds = [...new Set(invitations.map(i => i.invitedBy).filter(Boolean))]
    const inviters = await prisma.user.findMany({
      where: { id: { in: invitedByIds } },
      select: { id: true, name: true, email: true }
    })
    const inviterMap = Object.fromEntries(inviters.map(u => [u.id, u.name || u.email]))

    const formattedInvitations = invitations.map(invitation => ({
      id: invitation.id,
      email: invitation.user.email,
      name: invitation.user.name,
      image: invitation.user.image,
      role: invitation.role,
      status: invitation.status,
      invitedAt: invitation.invitedAt,
      joinedAt: invitation.joinedAt,
      invitedBy: invitation.invitedBy ? inviterMap[invitation.invitedBy] : null,
      permissions: invitation.permissions ? JSON.parse(invitation.permissions) : {}
    }))

    const response = NextResponse.json({
      invitations: formattedInvitations,
      count: formattedInvitations.length,
      pending: formattedInvitations.filter(i => i.status === 'PENDING').length
    })

    apiLogger.logResponse(request, response, Date.now() - startTime)
    return response

  } catch (error) {
    apiLogger.logError(request, error as Error)
    const response = NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    )
    apiLogger.logResponse(request, response, Date.now() - startTime)
    return response
  }
}