'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Book, Code, Puzzle, Rocket, Zap, Users, Settings, FileText } from 'lucide-react'

export default function DocsPage() {
  const sections = [
    {
      title: "Getting Started",
      description: "Learn the basics of Maverick and .maverick files",
      icon: <Rocket className="w-5 h-5" />,
      links: [
        { href: "/docs/quickstart", title: "Quick Start Guide", description: "Get up and running in 5 minutes" },
        { href: "/docs/concepts", title: "Core Concepts", description: "Understand workspaces, templates, and AI integration" },
        { href: "/docs/first-project", title: "Your First Project", description: "Create your first Maverick project step-by-step" }
      ]
    },
    {
      title: ".maverick Structure",
      description: "Deep dive into the .maverick file system and plugin architecture",
      icon: <FileText className="w-5 h-5" />,
      links: [
        { href: "/docs/maverick-structure", title: ".maverick File Reference", description: "Complete specification and examples" },
        { href: "/docs/workspace-hierarchy", title: "Workspace Hierarchy", description: "How nested workspaces work" },
        { href: "/docs/templates", title: "Template System", description: "Creating and using templates" },
        { href: "/docs/plugin-model", title: "Plugin Architecture", description: "Extensibility and customization" }
      ]
    },
    {
      title: "AI Integration",
      description: "How Maverick works with Claude, Goose, and other AI assistants",
      icon: <Zap className="w-5 h-5" />,
      links: [
        { href: "/docs/ai-instructions", title: "AI Instructions", description: "Writing effective instructions.md files" },
        { href: "/docs/context-inheritance", title: "Context Inheritance", description: "How AI context flows through workspaces" },
        { href: "/docs/goose-integration", title: "Goose Integration", description: "Local development with Goose" },
        { href: "/docs/claude-integration", title: "Claude Integration", description: "Using Claude in Maverick projects" }
      ]
    },
    {
      title: "Square Integration",
      description: "Building Square applications and business formation",
      icon: <Settings className="w-5 h-5" />,
      links: [
        { href: "/docs/square-apps", title: "Square App Development", description: "Building with Square APIs" },
        { href: "/docs/business-formation", title: "Business Formation", description: "Automated incorporation and setup" },
        { href: "/docs/payment-processing", title: "Payment Processing", description: "Integrating Square payments" },
        { href: "/docs/square-templates", title: "Square Templates", description: "Pre-built Square app templates" }
      ]
    },
    {
      title: "Development",
      description: "Technical guides for developers and contributors",
      icon: <Code className="w-5 h-5" />,
      links: [
        { href: "/docs/api-reference", title: "API Reference", description: "Complete API documentation" },
        { href: "/docs/contributing", title: "Contributing", description: "How to contribute to Maverick" },
        { href: "/docs/architecture", title: "Platform Architecture", description: "Technical overview of Maverick" },
        { href: "/docs/deployment", title: "Deployment Guide", description: "Deploying Maverick projects" }
      ]
    },
    {
      title: "Community",
      description: "Templates, examples, and community resources",
      icon: <Users className="w-5 h-5" />,
      links: [
        { href: "/docs/template-marketplace", title: "Template Marketplace", description: "Browse and share templates" },
        { href: "/docs/examples", title: "Example Projects", description: "Real-world Maverick projects" },
        { href: "/docs/best-practices", title: "Best Practices", description: "Patterns and recommendations" },
        { href: "/docs/community", title: "Community Guidelines", description: "How to participate in the community" }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <div className="border-b border-border-subtle bg-background-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/app" className="flex items-center space-x-3">
              <img src="/design/icon.png" alt="Maverick" className="h-8 w-8" />
              <img src="/design/textmark.png" alt="Maverick" className="h-6" />
            </Link>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">Documentation</Badge>
              <Link href="/app" className="text-sm text-text-secondary hover:text-text-primary">
                ← Back to Cockpit
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-6">
            <Book className="w-12 h-12 text-accent-primary mr-4" />
            <h1 className="text-4xl font-bold text-text-primary">
              Maverick Documentation
            </h1>
          </div>
          
          <p className="text-xl text-text-secondary max-w-3xl mx-auto mb-8">
            Learn how to build AI-powered businesses with Maverick's extensible platform. 
            Master .maverick files, workspace hierarchies, and the self-evolving template system.
          </p>

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-purple-900 mb-3">
              🌀 The Platform That Builds Itself
            </h3>
            <p className="text-purple-800">
              Maverick is more than a development platform—it's a self-evolving ecosystem where 
              every user need becomes everyone's feature. Learn how .maverick files create 
              fractal business architectures and how your projects become templates for others.
            </p>
          </div>
        </div>

        {/* Documentation Sections */}
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {sections.map((section, index) => (
            <Card key={index} className="border border-border-subtle h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-accent-primary/10 rounded-lg text-accent-primary">
                    {section.icon}
                  </div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </div>
                <CardDescription className="text-text-secondary">
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <Link
                      key={linkIndex}
                      href={link.href}
                      className="block p-3 rounded-lg border border-border-subtle hover:border-accent-primary hover:bg-accent-primary/5 transition-all duration-200 group"
                    >
                      <div className="font-medium text-text-primary group-hover:text-accent-primary transition-colors">
                        {link.title}
                      </div>
                      <div className="text-sm text-text-secondary mt-1">
                        {link.description}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Access */}
        <div className="mt-16 bg-gray-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Quick Access
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/docs/maverick-structure"
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-accent-primary hover:shadow-md transition-all text-center group"
            >
              <FileText className="w-8 h-8 text-accent-primary mx-auto mb-2" />
              <div className="font-medium text-gray-900 group-hover:text-accent-primary">
                .maverick Reference
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Complete specification
              </div>
            </Link>

            <Link
              href="/docs/templates"
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-accent-primary hover:shadow-md transition-all text-center group"
            >
              <Puzzle className="w-8 h-8 text-accent-primary mx-auto mb-2" />
              <div className="font-medium text-gray-900 group-hover:text-accent-primary">
                Template Gallery
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Browse templates
              </div>
            </Link>

            <Link
              href="/docs/goose-integration"
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-accent-primary hover:shadow-md transition-all text-center group"
            >
              <Zap className="w-8 h-8 text-accent-primary mx-auto mb-2" />
              <div className="font-medium text-gray-900 group-hover:text-accent-primary">
                Goose Integration
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Local development
              </div>
            </Link>

            <Link
              href="/docs/square-apps"
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-accent-primary hover:shadow-md transition-all text-center group"
            >
              <Settings className="w-8 h-8 text-accent-primary mx-auto mb-2" />
              <div className="font-medium text-gray-900 group-hover:text-accent-primary">
                Square Apps
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Payment integration
              </div>
            </Link>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-accent-primary to-purple-600 rounded-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Build?
            </h3>
            <p className="text-xl mb-6 opacity-90">
              Start creating with Maverick's AI-powered development platform
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/app"
                className="px-6 py-3 bg-white text-accent-primary rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Open Cockpit
              </Link>
              <Link
                href="/docs/quickstart"
                className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors font-medium"
              >
                Quick Start Guide
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}