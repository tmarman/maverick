'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  UserPlus, 
  Mail, 
  Settings, 
  Crown, 
  Shield, 
  Edit, 
  Eye,
  MoreHorizontal,
  Send
} from 'lucide-react'

interface WorkspaceMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'contributor' | 'viewer'
  avatar?: string
  joinedAt: Date
  lastActive: Date
  status: 'active' | 'invited' | 'inactive'
}

interface WorkspaceTeamManagerProps {
  projectName: string
  currentUserRole: 'admin' | 'contributor' | 'viewer'
}

export function WorkspaceTeamManager({ projectName, currentUserRole }: WorkspaceTeamManagerProps) {
  const { data: session } = useSession()
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'contributor' | 'viewer'>('contributor')
  const [isInviting, setIsInviting] = useState(false)

  const canManageTeam = currentUserRole === 'admin'

  useEffect(() => {
    loadTeamMembers()
  }, [projectName, session])

  const loadTeamMembers = async () => {
    try {
      setLoading(true)
      
      // For now, just show the current user as admin
      if (session?.user) {
        const currentUserMember: WorkspaceMember = {
          id: '1',
          name: session.user.name || 'Current User',
          email: session.user.email || 'user@example.com',
          role: 'admin',
          avatar: session.user.image || undefined,
          joinedAt: new Date('2025-01-01'),
          lastActive: new Date(),
          status: 'active'
        }
        setMembers([currentUserMember])
      }
    } catch (error) {
      console.error('Error loading team members:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />
      case 'contributor':
        return <Edit className="w-4 h-4 text-blue-500" />
      case 'viewer':
        return <Eye className="w-4 h-4 text-gray-500" />
      default:
        return <Users className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-100 text-yellow-800'
      case 'contributor':
        return 'bg-blue-100 text-blue-800'
      case 'viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Full access to project, team management, and settings'
      case 'contributor':
        return 'Can view and edit work items, participate in discussions'
      case 'viewer':
        return 'Read-only access to project content and discussions'
      default:
        return 'Unknown role'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
      case 'invited':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Invited</Badge>
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Inactive</Badge>
      default:
        return null
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail || !canManageTeam) return

    setIsInviting(true)
    try {
      // API call to invite user
      const response = await fetch(`/api/projects/${projectName}/team/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        })
      })

      if (response.ok) {
        // Add invited member to list
        const newMember: WorkspaceMember = {
          id: Date.now().toString(),
          name: inviteEmail.split('@')[0],
          email: inviteEmail,
          role: inviteRole,
          joinedAt: new Date(),
          lastActive: new Date(),
          status: 'invited'
        }
        setMembers(prev => [...prev, newMember])
        setInviteEmail('')
        setInviteRole('contributor')
      }
    } catch (error) {
      console.error('Failed to invite user:', error)
    } finally {
      setIsInviting(false)
    }
  }

  const formatLastActive = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return 'Active now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    return `${diffDays} days ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Workspace Team
              </CardTitle>
              <CardDescription>
                Manage team access and permissions for {projectName}
              </CardDescription>
            </div>
            {canManageTeam && (
              <Button size="sm" className="gap-2">
                <UserPlus className="w-4 h-4" />
                Invite Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Team Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{members.filter(m => m.status === 'active').length}</div>
              <div className="text-sm text-gray-600">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{members.filter(m => m.status === 'invited').length}</div>
              <div className="text-sm text-gray-600">Pending Invites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{members.filter(m => m.role === 'admin').length}</div>
              <div className="text-sm text-gray-600">Admins</div>
            </div>
          </div>

          {/* Invite Section */}
          {canManageTeam && (
            <div className="border rounded-lg p-4 mb-6 bg-gray-50">
              <h4 className="font-medium mb-3">Invite New Member</h4>
              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'contributor' | 'viewer')}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="contributor">Contributor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <Button 
                  onClick={handleInvite}
                  disabled={!inviteEmail || isInviting}
                  size="sm"
                  className="gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isInviting ? 'Inviting...' : 'Invite'}
                </Button>
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.name}</span>
                      {getRoleIcon(member.role)}
                      <Badge className={getRoleBadgeColor(member.role)} variant="outline">
                        {member.role}
                      </Badge>
                      {getStatusBadge(member.status)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {member.email} • {formatLastActive(member.lastActive)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getRoleDescription(member.role)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {canManageTeam && member.role !== 'admin' && (
                    <>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Definitions */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>
            Understanding workspace roles and their access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <div className="font-medium">Admin</div>
                <div className="text-sm text-gray-600">
                  Full project access, team management, settings, billing, and can delete workspace
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Edit className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <div className="font-medium">Contributor</div>
                <div className="text-sm text-gray-600">
                  Can create, edit, and manage work items, participate in discussions, access Claude Code terminal
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <div className="font-medium">Viewer</div>
                <div className="text-sm text-gray-600">
                  Read-only access to project content, can view work items and discussions but cannot edit
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}