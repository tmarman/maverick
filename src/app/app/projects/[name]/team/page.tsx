'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import CockpitShell from '@/components/CockpitShell'
import { ProjectSidebar } from '@/components/ProjectSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  UserPlus,
  Settings,
  Mail,
  Calendar,
  Activity,
  Crown,
  Shield,
  Eye
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  type: string
  status: string
  repositoryUrl?: string
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'developer' | 'viewer'
  avatar?: string
  joinedAt: Date
  lastActive: Date
  contributions: {
    workItems: number
    commits: number
    reviews: number
  }
}

export default function TeamPage() {
  const params = useParams()
  const projectName = params?.name as string
  const [project, setProject] = useState<Project | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (projectName) {
      loadProject()
      loadTeamMembers()
    }
  }, [projectName])

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectName}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
      }
    } catch (error) {
      console.error('Error loading project:', error)
    }
  }

  const loadTeamMembers = async () => {
    try {
      setLoading(true)
      // For now, we'll use mock data since we don't have a team API yet
      // In a real implementation, this would fetch from /api/projects/${projectName}/team
      
      const mockTeamMembers: TeamMember[] = [
        {
          id: '1',
          name: 'Tim Harrison',
          email: 'tim@maverick.dev',
          role: 'owner',
          avatar: '/avatars/tim.jpg',
          joinedAt: new Date('2025-01-01'),
          lastActive: new Date(),
          contributions: {
            workItems: 45,
            commits: 128,
            reviews: 23
          }
        },
        {
          id: '2', 
          name: 'Claude AI',
          email: 'claude@anthropic.com',
          role: 'developer',
          joinedAt: new Date('2025-07-01'),
          lastActive: new Date(),
          contributions: {
            workItems: 67,
            commits: 234,
            reviews: 12
          }
        },
        {
          id: '3',
          name: 'Sarah Chen',
          email: 'sarah@example.com',
          role: 'admin',
          joinedAt: new Date('2025-02-15'),
          lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          contributions: {
            workItems: 12,
            commits: 34,
            reviews: 8
          }
        }
      ]
      
      setTeamMembers(mockTeamMembers)
    } catch (error) {
      console.error('Error loading team members:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />
      case 'developer':
        return <Settings className="w-4 h-4 text-green-500" />
      case 'viewer':
        return <Eye className="w-4 h-4 text-gray-500" />
      default:
        return <Users className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      case 'developer':
        return 'bg-green-100 text-green-800'
      case 'viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
      <CockpitShell sidebarContent={project ? <ProjectSidebar project={project} currentPage="team" /> : undefined}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </CockpitShell>
    )
  }

  if (!project) {
    return (
      <CockpitShell>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h2>
          <p className="text-gray-600">The project you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </CockpitShell>
    )
  }

  return (
    <CockpitShell sidebarContent={<ProjectSidebar project={project} currentPage="team" />}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Team Members
            </h1>
            <p className="text-gray-600 mt-1">
              Manage team access and collaboration for {project.name}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Team Settings
            </Button>
            <Button size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold">{teamMembers.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Today</p>
                  <p className="text-2xl font-bold">
                    {teamMembers.filter(m => formatLastActive(m.lastActive) === 'Active now').length}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Contributions</p>
                  <p className="text-2xl font-bold">
                    {teamMembers.reduce((sum, m) => sum + m.contributions.workItems + m.contributions.commits, 0)}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Admins</p>
                  <p className="text-2xl font-bold">
                    {teamMembers.filter(m => m.role === 'owner' || m.role === 'admin').length}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members List */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members ({teamMembers.length})</CardTitle>
            <CardDescription>
              Manage roles and permissions for project team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{member.name}</h3>
                        {getRoleIcon(member.role)}
                        <Badge className={getRoleBadgeColor(member.role)} variant="outline">
                          {member.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {member.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Joined {member.joinedAt.toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {formatLastActive(member.lastActive)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Contributions */}
                    <div className="text-right text-sm">
                      <div className="font-medium">{member.contributions.workItems} work items</div>
                      <div className="text-gray-600">{member.contributions.commits} commits</div>
                      <div className="text-gray-600">{member.contributions.reviews} reviews</div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        Edit Role
                      </Button>
                      {member.role !== 'owner' && (
                        <Button variant="outline" size="sm">
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              Team invitations that haven't been accepted yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Mail className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No pending invitations</p>
              <Button className="mt-2" size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Team Member
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </CockpitShell>
  )
}