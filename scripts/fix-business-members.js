// One-time script to fix missing BusinessMember records
// Run locally: node scripts/fix-business-members.js

require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

async function fixBusinessMembers() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔧 Fixing missing BusinessMember records...')
    
    // Find tim@marman.org user
    const timUser = await prisma.user.findUnique({
      where: { email: 'tim@marman.org' }
    })

    if (!timUser) {
      console.log('❌ Tim user not found')
      return
    }

    // Find Maverick business
    const maverickBusiness = await prisma.business.findUnique({
      where: { id: 'maverick-company-meta' }
    })

    if (!maverickBusiness) {
      console.log('❌ Maverick business not found')
      return
    }

    // Check if membership already exists
    const existingMember = await prisma.businessMember.findFirst({
      where: {
        userId: timUser.id,
        businessId: maverickBusiness.id
      }
    })

    if (existingMember) {
      console.log('✅ BusinessMember record already exists')
      return
    }

    // Create business membership for Tim
    const businessMember = await prisma.businessMember.create({
      data: {
        userId: timUser.id,
        businessId: maverickBusiness.id,
        role: 'OWNER',
        status: 'ACCEPTED',
        invitedBy: timUser.id,
        invitedAt: new Date(),
        joinedAt: new Date(),
        permissions: JSON.stringify({
          canManageProjects: true,
          canManageTeam: true,
          canManageSettings: true,
          canInviteMembers: true
        })
      }
    })

    console.log('✅ Tim added as business owner:', {
      id: businessMember.id,
      role: businessMember.role,
      status: businessMember.status
    })
    
    // Verify projects are now accessible
    const userWithProjects = await prisma.user.findUnique({
      where: { id: timUser.id },
      include: {
        businessMemberships: {
          include: {
            business: {
              include: {
                projects: true
              }
            }
          }
        }
      }
    })

    const totalProjects = userWithProjects.businessMemberships.reduce(
      (total, membership) => total + membership.business.projects.length, 0
    )

    console.log(`✅ Tim now has access to ${totalProjects} projects`)
    
  } catch (error) {
    console.error('❌ Error fixing business members:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixBusinessMembers()