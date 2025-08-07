import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createApiLogger } from '@/lib/logging'

const apiLogger = createApiLogger('InviteResponseAPI')

// Accept or decline invitation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const startTime = Date.now()
  apiLogger.logRequest(request)

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { inviteId } = await params
    const { action } = await request.json() // 'accept' or 'decline'

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json({ 
        error: 'Action must be "accept" or "decline"' 
      }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')

    // Find the invitation
    const invitation = await prisma.organizationMember.findUnique({
      where: { id: inviteId },
      include: {
        organization: true,
        user: true
      }
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ 
        error: 'This invitation has already been processed' 
      }, { status: 400 })
    }

    // Verify the current user is the one invited
    if (invitation.user.email !== session.user.email) {
      return NextResponse.json({ 
        error: 'You can only respond to invitations sent to your email' 
      }, { status: 403 })
    }

    // Update the invitation status
    const updatedInvitation = await prisma.organizationMember.update({
      where: { id: inviteId },
      data: {
        status: action === 'accept' ? 'ACCEPTED' : 'DECLINED',
        joinedAt: action === 'accept' ? new Date() : null,
        // Update userId to match the authenticated user if they're different
        // This handles the case where a placeholder user was created
        userId: session.user.id
      },
      include: {
        organization: true,
        user: true
      }
    })

    // If accepted, send notification to business owner
    if (action === 'accept') {
      try {
        // Find organization owner
        const organizationOwner = await prisma.user.findUnique({
          where: { id: updatedInvitation.organization.ownerId }
        })

        if (organizationOwner && organizationOwner.email !== session.user.email) {
          const { azureEmailService } = await import('@/lib/azure-email')
          
          await azureEmailService.sendTeamJoinNotificationEmail(
            organizationOwner.email,
            session.user.name || session.user.email,
            updatedInvitation.organization.name,
            updatedInvitation.role
          )
        }
      } catch (emailError) {
        console.warn('Failed to send join notification email:', emailError)
      }
    }

    const response = NextResponse.json({
      success: true,
      invitation: {
        id: updatedInvitation.id,
        status: updatedInvitation.status,
        organizationName: updatedInvitation.organization.name,
        role: updatedInvitation.role,
        joinedAt: updatedInvitation.joinedAt
      },
      message: action === 'accept' 
        ? `Welcome to ${updatedInvitation.organization.name}!`
        : 'Invitation declined'
    })

    apiLogger.logResponse(request, response, Date.now() - startTime)
    return response

  } catch (error) {
    apiLogger.logError(request, error as Error)
    const response = NextResponse.json(
      { error: 'Failed to process invitation' },
      { status: 500 }
    )
    apiLogger.logResponse(request, response, Date.now() - startTime)
    return response
  }
}

// Get invitation details (for the invitation page)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const startTime = Date.now()
  apiLogger.logRequest(request)

  try {
    const { inviteId } = await params
    const { prisma } = await import('@/lib/prisma')

    // Find the invitation
    const invitation = await prisma.organizationMember.findUnique({
      where: { id: inviteId },
      include: {
        organization: true,
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Get inviter details
    let inviterName = 'Someone'
    if (invitation.invitedBy) {
      const inviter = await prisma.user.findUnique({
        where: { id: invitation.invitedBy },
        select: { name: true, email: true }
      })
      inviterName = inviter?.name || inviter?.email || 'Someone'
    }

    const response = NextResponse.json({
      invitation: {
        id: invitation.id,
        organizationName: invitation.organization.name,
        organizationDescription: invitation.organization.description,
        role: invitation.role,
        status: invitation.status,
        invitedEmail: invitation.user.email,
        inviterName,
        invitedAt: invitation.invitedAt,
        joinedAt: invitation.joinedAt
      }
    })

    apiLogger.logResponse(request, response, Date.now() - startTime)
    return response

  } catch (error) {
    apiLogger.logError(request, error as Error)
    const response = NextResponse.json(
      { error: 'Failed to fetch invitation details' },
      { status: 500 }
    )
    apiLogger.logResponse(request, response, Date.now() - startTime)
    return response
  }
}