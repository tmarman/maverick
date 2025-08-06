'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Users,
  Plus,
  Edit3,
  Shield,
  ShieldCheck,
  Crown,
  Eye,
  Mail,
  Github,
  UserPlus
} from 'lucide-react'
import { UserMentionChip } from '@/components/MentionText'
import { defaultProjectUsers, UserProfile, isValidUsername } from '@/lib/username-mentions'
import { toast } from '@/hooks/use-toast'

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>(defaultProjectUsers)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUser, setNewUser] = useState({
    username: '',
    display: '',
    email: '',
    role: 'member' as UserProfile['role']
  })

  const handleAddUser = () => {
    if (!newUser.username || !newUser.display) {
      toast({
        title: 'Error',
        description: 'Username and display name are required',
        variant: 'destructive'
      })
      return
    }

    if (!isValidUsername(newUser.username)) {
      toast({
        title: 'Invalid Username',
        description: 'Username must be 1-39 characters, alphanumeric with hyphens, cannot start/end with hyphen',
        variant: 'destructive'
      })
      return
    }

    if (users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
      toast({
        title: 'Error',
        description: 'Username already exists',
        variant: 'destructive'
      })
      return
    }

    const userProfile: UserProfile = {
      username: newUser.username,
      display: newUser.display,
      email: newUser.email || undefined,
      role: newUser.role,
      isActive: true
    }

    setUsers(prev => [...prev, userProfile])
    setNewUser({ username: '', display: '', email: '', role: 'member' })
    setShowAddForm(false)
    
    toast({
      title: 'User Added',
      description: `@${newUser.username} has been added to the project`,
    })
  }

  const getRoleIcon = (role: UserProfile['role']) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />
      case 'admin':
        return <ShieldCheck className="w-4 h-4 text-red-500" />
      case 'member':
        return <Shield className="w-4 h-4 text-blue-500" />
      case 'viewer':
        return <Eye className="w-4 h-4 text-gray-500" />
      default:
        return <Users className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleColor = (role: UserProfile['role']) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'member':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-gray-600 mt-1">
            Manage GitHub-style usernames and collaboration permissions
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add New User
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Username *</label>
                <Input
                  value={newUser.username}
                  onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="tim, jack, etc."
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Will be used for @mentions (1-39 chars, alphanumeric + hyphens)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Display Name *</label>
                <Input
                  value={newUser.display}
                  onChange={(e) => setNewUser(prev => ({ ...prev, display: e.target.value }))}
                  placeholder="Tim Smith"
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="tim@example.com"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as UserProfile['role'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="viewer">Viewer</option>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddUser}>
                Add User
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddForm(false)
                  setNewUser({ username: '', display: '', email: '', role: 'member' })
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.username}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <UserMentionChip 
                    username={user.username}
                    availableUsers={[user]}
                    size="md"
                  />
                  <div>
                    <h3 className="font-semibold">{user.display}</h3>
                    {user.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge className={getRoleColor(user.role)}>
                    <div className="flex items-center gap-1">
                      {getRoleIcon(user.role)}
                      {user.role}
                    </div>
                  </Badge>
                  
                  <div className="flex items-center gap-1">
                    {user.isActive ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            Usage Examples
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">In Vibe Chat:</h4>
            <div className="bg-gray-50 p-3 rounded-md font-mono text-sm">
              "Hey @tim, can you review this feature? Also @jack might want to take a look at the API design."
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">In Work Items:</h4>
            <div className="bg-gray-50 p-3 rounded-md font-mono text-sm">
              "Bug: Login flow broken - @tim please investigate the authentication service"
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Features:</h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
              <li>Autocomplete suggestions when typing @username</li>
              <li>Click mentions to view user profiles</li>
              <li>Mentioned users are tracked in work items</li>
              <li>Role-based permissions and access control</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}