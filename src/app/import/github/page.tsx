'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { ArrowRight, Check, Code, Zap, Shield, Rocket, Users, Settings } from 'lucide-react'

export default function GitHubImportPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [connecting, setConnecting] = useState(false)

  const connectGitHub = async () => {
    try {
      setConnecting(true)
      
      // Prepare the GitHub linking
      const preparationResponse = await fetch('/api/auth/link-github', {
        method: 'POST'
      })
      
      if (preparationResponse.ok) {
        // Use NextAuth signIn to handle GitHub OAuth with proper callback
        const { signIn } = await import('next-auth/react')
        await signIn('github', { 
          callbackUrl: '/accounts?tab=integrations&connected=github'
        })
      } else {
        console.error('Failed to prepare GitHub linking')
        setConnecting(false)
      }
    } catch (error) {
      console.error('GitHub connection error:', error)
      setConnecting(false)
    }
  }

  const goToSettings = () => {
    router.push('/accounts?tab=integrations')
  }

  const benefits = [
    {
      icon: <Code className="w-6 h-6 text-blue-600" />,
      title: "Import Existing Projects",
      description: "Seamlessly import your existing repositories and continue development with AI assistance"
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-600" />,
      title: "Automated CI/CD",
      description: "Set up automated deployment pipelines from GitHub to production environments"
    },
    {
      icon: <Shield className="w-6 h-6 text-green-600" />,
      title: "Secure Integration",
      description: "OAuth-based secure connection with granular permissions and enterprise-grade security"
    },
    {
      icon: <Rocket className="w-6 h-6 text-purple-600" />,
      title: "AI-Powered Development",
      description: "Leverage Claude Code and Gemini AI to write, review, and optimize your code"
    },
    {
      icon: <Users className="w-6 h-6 text-indigo-600" />,
      title: "Team Collaboration",
      description: "Manage team access, review processes, and collaborative development workflows"
    },
    {
      icon: <Settings className="w-6 h-6 text-gray-600" />,
      title: "Project Management",
      description: "Organize repositories, track issues, and manage releases through Maverick's interface"
    }
  ]

  const features = [
    "Repository browsing and selection",
    "Code analysis and documentation generation", 
    "Automated deployment setup",
    "Issue tracking integration",
    "Branch management and PR workflows",
    "Code quality monitoring"
  ]

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <div className="border-b border-border-subtle bg-background-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src="/design/icon.png" alt="Maverick" className="h-8 w-8" />
              <img src="/design/textmark.png" alt="Maverick" className="h-6" />
            </div>
            <Button variant="outline" onClick={goToSettings}>
              <Settings className="w-4 h-4 mr-2" />
              Account Settings
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-6">
            <GitHubLogoIcon className="w-16 h-16 text-gray-900 mr-4" />
            <ArrowRight className="w-8 h-8 text-gray-400 mr-4" />
            <img src="/design/icon.png" alt="Maverick" className="h-16 w-16" />
          </div>
          
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Connect GitHub to Maverick
          </h1>
          
          <p className="text-xl text-text-secondary max-w-3xl mx-auto mb-8">
            Supercharge your development workflow by connecting your GitHub repositories to Maverick's AI-powered business platform. Import existing projects, automate deployments, and build faster with intelligent assistance.
          </p>

          {session?.user?.githubConnected ? (
            <div className="flex items-center justify-center gap-4">
              <Badge className="bg-green-100 text-green-800 px-4 py-2">
                <Check className="w-4 h-4 mr-2" />
                GitHub Connected
              </Badge>
              <Button onClick={() => router.push('/cockpit')}>
                <Rocket className="w-4 h-4 mr-2" />
                Go to Cockpit
              </Button>
            </div>
          ) : (
            <Button 
              size="lg" 
              onClick={connectGitHub} 
              disabled={connecting}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              <GitHubLogoIcon className="w-5 h-5 mr-2" />
              {connecting ? 'Connecting...' : 'Connect with GitHub'}
            </Button>
          )}
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <Card key={index} className="border border-border-subtle">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  {benefit.icon}
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-text-secondary">
                  {benefit.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* What You Get Section */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">What You Get with GitHub Integration</CardTitle>
            <CardDescription>
              Unlock powerful development features when you connect your GitHub account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-text-primary mb-3">Core Features</h3>
                <ul className="space-y-2">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center text-text-secondary">
                      <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">🎯 Special Benefits</h3>
                <div className="text-sm text-blue-800 space-y-2">
                  <div>🚀 <strong>GitHub Partner Benefits:</strong> Access to GitHub's partner program resources and tools</div>
                  <div>💰 <strong>Earn Referrals:</strong> Potential to earn through GitHub's partnership ecosystem</div>
                  <div>⚡ <strong>AI Enhancement:</strong> Claude Code and Gemini CLI integration for intelligent development</div>
                  <div>🔄 <strong>Automated Workflows:</strong> Set up CI/CD pipelines with zero configuration</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Privacy */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Security & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-text-primary mb-2">What We Access</h4>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Repository metadata and structure</li>
                  <li>• Code content for analysis (read-only)</li>
                  <li>• Issues and pull request information</li>
                  <li>• Commit history and branch data</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-text-primary mb-2">Your Control</h4>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Revoke access anytime from GitHub settings</li>
                  <li>• Choose which repositories to share</li>
                  <li>• Granular permission management</li>
                  <li>• Full audit log of all activities</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        {!session?.user?.githubConnected && (
          <div className="text-center">
            <Button 
              size="lg" 
              onClick={connectGitHub} 
              disabled={connecting}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              <GitHubLogoIcon className="w-5 h-5 mr-2" />
              {connecting ? 'Connecting to GitHub...' : 'Get Started - Connect GitHub'}
            </Button>
            <p className="text-sm text-text-muted mt-4">
              Free to connect • Takes less than 30 seconds • Revoke anytime
            </p>
          </div>
        )}
      </div>
    </div>
  )
}