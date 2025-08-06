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
  Send,
  Bot,
  Zap,
  Activity,
  Clock,
  User,
  Plus,
  X
} from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  type: 'human' | 'agent'
  role: 'admin' | 'contributor' | 'viewer' | 'specialist'
  avatar?: string
  joinedAt: Date
  lastActive: Date
  status: 'active' | 'invited' | 'inactive' | 'running' | 'idle'
  // Human-specific
  email?: string
  // Agent-specific
  agentType?: string
  specialization?: string
  tasksCompleted?: number
  currentTask?: string
  efficiency?: number
}

interface WorkspaceTeamManagerProps {
  projectName: string
  currentUserRole: 'admin' | 'contributor' | 'viewer'
}

export function WorkspaceTeamManager({ projectName, currentUserRole }: WorkspaceTeamManagerProps) {
  const { data: session } = useSession()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [addMemberType, setAddMemberType] = useState<'human' | 'agent' | null>(null)

  // Human invite state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'contributor' | 'viewer'>('contributor')
  const [isInviting, setIsInviting] = useState(false)

  // Agent selection state
  const [selectedAgentTemplate, setSelectedAgentTemplate] = useState('')
  const [agentTemplates] = useState([
    {
      id: 'frontend-dev',
      name: 'Frontend Developer',
      specialization: 'React, TypeScript, UI/UX',
      description: 'Specializes in building user interfaces and frontend features',
      avatar: '👨‍💻'
    },
    {
      id: 'backend-dev',
      name: 'Backend Engineer', 
      specialization: 'APIs, Database, Server Logic',
      description: 'Handles server-side development and API design',
      avatar: '⚙️'
    },
    {
      id: 'qa-specialist',
      name: 'QA Specialist',
      specialization: 'Testing, Quality Assurance',
      description: 'Ensures code quality and writes comprehensive tests',
      avatar: '🔍'
    },
    {
      id: 'devops-engineer',
      name: 'DevOps Engineer',
      specialization: 'CI/CD, Infrastructure, Deployment',
      description: 'Manages deployment pipelines and infrastructure',
      avatar: '🚀'
    },
    {
      id: 'product-manager',
      name: 'Product Manager',
      specialization: 'Requirements, User Stories',
      description: 'Helps define features and write user requirements',
      avatar: '📋'
    }
  ])

  const canManageTeam = currentUserRole === 'admin'

  const getAgentAvatar = (agentType: string) => {
    switch (agentType) {
      case 'frontend-dev': return '👨‍💻'
      case 'backend-dev': return '⚙️'
      case 'qa-specialist': return '🔍'
      case 'devops-engineer': return '🚀'
      case 'product-manager': return '📋'
      default: return '🤖'
    }
  }

  useEffect(() => {
    loadTeamMembers()
  }, [projectName, session])

  const loadTeamMembers = async () => {
    try {
      setLoading(true)
      
      const team: TeamMember[] = []
      
      // Add current user as admin
      if (session?.user) {
        team.push({
          id: session.user.email || 'current-user',
          name: session.user.name || 'Current User',
          type: 'human',
          email: session.user.email || 'user@example.com',
          role: 'admin',
          avatar: session.user.image || undefined,
          joinedAt: new Date('2025-01-01'),
          lastActive: new Date(),
          status: 'active'
        })
      }
      
      // Load real agents from project API
      try {
        const agentsResponse = await fetch(`/api/projects/${projectName}/team/agents`)
        if (agentsResponse.ok) {
          const agentsData = await agentsResponse.json()
          const agents = agentsData.agents || []
          
          // Convert API agents to TeamMember format
          agents.forEach((agent: any) => {
            team.push({
              id: agent.id,
              name: agent.name,
              type: 'agent',
              role: 'specialist',
              agentType: agent.agentType,
              specialization: agent.specialization,
              avatar: getAgentAvatar(agent.agentType),
              joinedAt: new Date(agent.createdAt || agent.joinedAt || Date.now()),
              lastActive: new Date(agent.lastActive || Date.now()),
              status: agent.status || 'idle',
              tasksCompleted: agent.tasksCompleted || 0,
              currentTask: agent.currentTask,
              efficiency: agent.efficiency || 100
            })
          })
        }
      } catch (error) {
        console.error('Failed to load agents:', error)
      }
      
      // Load real team members/invites from API
      try {
        const membersResponse = await fetch(`/api/projects/${projectName}/team/members`)
        if (membersResponse.ok) {
          const membersData = await membersResponse.json()
          const members = membersData.members || []
          
          members.forEach((member: any) => {
            // Skip current user (already added)
            if (member.email !== session?.user?.email) {
              team.push({
                id: member.id,
                name: member.name,
                type: 'human',
                email: member.email,
                role: member.role || 'contributor',
                avatar: member.avatar,
                joinedAt: new Date(member.joinedAt || Date.now()),
                lastActive: new Date(member.lastActive || Date.now()),
                status: member.status || 'invited'
              })
            }
          })
        }
      } catch (error) {
        console.error('Failed to load team members:', error)
      }
      
      setTeamMembers(team)
    } catch (error) {
      console.error('Error loading team members:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string, type: 'human' | 'agent') => {
    if (type === 'agent') {
      switch (role) {
        case 'specialist':
          return <Bot className="w-4 h-4 text-purple-500" />
        default:
          return <Bot className="w-4 h-4 text-gray-500" />
      }
    }
    
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />
      case 'contributor':
        return <Edit className="w-4 h-4 text-blue-500" />
      case 'viewer':
        return <Eye className="w-4 h-4 text-gray-500" />
      default:
        return <User className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleBadgeColor = (role: string, type: 'human' | 'agent') => {
    if (type === 'agent') {
      return 'bg-purple-100 text-purple-800'
    }
    
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

  const getStatusBadge = (status: string, type: 'human' | 'agent') => {
    if (type === 'agent') {
      switch (status) {
        case 'running':
          return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Activity className="w-3 h-3 mr-1" />
            Running
          </Badge>
        case 'idle':
          return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <Clock className="w-3 h-3 mr-1" />
            Idle
          </Badge>
        default:
          return null
      }
    }
    
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
        const newMember: TeamMember = {
          id: Date.now().toString(),
          name: inviteEmail.split('@')[0],
          email: inviteEmail,
          type: 'human',
          role: inviteRole,
          joinedAt: new Date(),
          lastActive: new Date(),
          status: 'invited'
        }
        setTeamMembers(prev => [...prev, newMember])
        setInviteEmail('')
        setInviteRole('contributor')
      }
    } catch (error) {
      console.error('Failed to invite user:', error)
    } finally {
      setIsInviting(false)
    }
  }

  const handleAddAgent = async (template: any) => {
    if (!canManageTeam) return

    try {
      // API call to add agent
      const response = await fetch(`/api/projects/${projectName}/team/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: template.id,
          name: template.name,
          specialization: template.specialization
        })
      })

      if (response.ok) {
        // Add agent to team list
        const newAgent: TeamMember = {
          id: `agent-${Date.now()}`,
          name: template.name,
          type: 'agent',
          role: 'specialist',
          agentType: template.id,
          specialization: template.specialization,
          avatar: template.avatar,
          joinedAt: new Date(),
          lastActive: new Date(),
          status: 'idle',
          tasksCompleted: 0,
          efficiency: 100
        }
        setTeamMembers(prev => [...prev, newAgent])
      }
    } catch (error) {
      console.error('Failed to add agent:', error)
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
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-4 h-4" />
                Team ({teamMembers.length})
              </CardTitle>
              <CardDescription className="text-sm">
                {teamMembers.filter(m => m.type === 'human').length} people • {teamMembers.filter(m => m.type === 'agent').length} AI agents
              </CardDescription>
            </div>
            {canManageTeam && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setAddMemberType('human')} className="gap-1 text-xs">
                  <User className="w-3 h-3" />
                  Invite
                </Button>
                <Button size="sm" onClick={() => setAddMemberType('agent')} className="gap-1 text-xs">
                  <Bot className="w-3 h-3" />
                  Add Agent
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">

          {/* Compact Add Section - only show when actively adding */}
          {canManageTeam && addMemberType === 'human' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                  autoFocus
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
                  className="gap-1"
                >
                  <Send className="w-3 h-3" />
                  {isInviting ? 'Sending...' : 'Send'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setAddMemberType(null)
                    setInviteEmail('')
                  }}
                  className="p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {canManageTeam && addMemberType === 'agent' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
              <div className="grid grid-cols-1 gap-2">
                {agentTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleAddAgent(template)}
                    className="flex items-center justify-between p-2 border rounded-md hover:bg-white transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{template.avatar}</span>
                      <div>
                        <span className="font-medium text-sm">{template.name}</span>
                        <div className="text-xs text-gray-600">{template.specialization}</div>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-purple-600" />
                  </button>
                ))}
              </div>
              <div className="flex justify-end mt-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setAddMemberType(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Compact Team Members List */}
          <div className="space-y-1">
            {teamMembers.map((member) => (
              <div key={member.id} className={`flex items-center justify-between p-2 rounded-lg hover:bg-gray-25 border-l-3 ${
                member.type === 'agent' ? 'border-l-purple-400 bg-purple-50/30' : 'border-l-blue-400 bg-blue-50/30'
              }`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Compact Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    member.type === 'agent' 
                      ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {member.type === 'agent' ? member.avatar || '🤖' : member.name.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{member.name}</span>
                      {member.type === 'agent' && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">
                          AI
                        </span>
                      )}
                      {member.role === 'admin' && (
                        <Crown className="w-3 h-3 text-yellow-500" />
                      )}
                      {getStatusBadge(member.status, member.type)}
                    </div>
                    
                    <div className="text-xs text-gray-600 truncate">
                      {member.type === 'human' ? member.email : member.specialization}
                      {member.type === 'agent' && member.tasksCompleted !== undefined && (
                        <span className="ml-2 text-green-600">
                          {member.tasksCompleted} tasks • {member.efficiency}% eff.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Minimal Action Menu */}
                {canManageTeam && member.role !== 'admin' && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      // TODO: More actions menu (remove, deactivate, etc.)
                    }}
                  >
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                )}
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