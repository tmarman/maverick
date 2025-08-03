'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Folder, Code, Zap, Puzzle, Users } from 'lucide-react'

export default function MaverickStructurePage() {
  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <div className="border-b border-border-subtle bg-background-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/docs" className="flex items-center space-x-3">
              <img src="/design/icon.png" alt="Maverick" className="h-8 w-8" />
              <span className="text-lg font-semibold">Documentation</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">.maverick Structure</Badge>
              <Link href="/docs" className="text-sm text-text-secondary hover:text-text-primary">
                ← Back to Docs
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-6">
            <FileText className="w-12 h-12 text-accent-primary mr-4" />
            <h1 className="text-4xl font-bold text-text-primary">
              .maverick File Structure
            </h1>
          </div>
          
          <p className="text-xl text-text-secondary max-w-3xl mx-auto mb-8">
            The .maverick file is the heart of Maverick's plugin architecture. It defines workspaces, 
            AI instructions, team configuration, and custom themes. Learn how to create extensible, 
            self-documenting project structures.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schema">Schema</TabsTrigger>
            <TabsTrigger value="themes">Themes</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
            <TabsTrigger value="integration">Integration</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Folder className="w-5 h-5" />
                  Fractal Workspace Architecture
                </CardTitle>
                <CardDescription>
                  How .maverick files create nested, composable workspaces
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm">
                  <div className="text-gray-600 mb-2"># Example project structure</div>
                  <div>company-root/</div>
                  <div>├── .maverick                    <span className="text-green-600"># Root company workspace</span></div>
                  <div>├── instructions.md             <span className="text-green-600"># Company-wide AI context</span></div>
                  <div>├── status.md                   <span className="text-green-600"># Real-time project status</span></div>
                  <div>├── legal/</div>
                  <div>│   ├── .maverick              <span className="text-blue-600"># Legal workspace</span></div>
                  <div>│   ├── instructions.md       <span className="text-blue-600"># Legal AI instructions</span></div>
                  <div>│   └── incorporation/</div>
                  <div>├── products/</div>
                  <div>│   ├── mobile-app/</div>
                  <div>│   │   ├── .maverick          <span className="text-purple-600"># Product workspace</span></div>
                  <div>│   │   ├── instructions.md   <span className="text-purple-600"># Product AI context</span></div>
                  <div>│   │   ├── status.md         <span className="text-purple-600"># Product status</span></div>
                  <div>│   │   └── features/</div>
                  <div>│   │       ├── auth/</div>
                  <div>│   │       │   ├── .maverick <span className="text-orange-600"># Feature workspace</span></div>
                  <div>│   │       │   └── instructions.md</div>
                  <div>│   │       └── payments/</div>
                  <div>│   │           ├── .maverick <span className="text-orange-600"># Feature workspace</span></div>
                  <div>│   │           └── instructions.md</div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">🎯 Key Principles</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Physical structure = Logical architecture</li>
                      <li>• Each .maverick defines a bounded context</li>
                      <li>• AI instructions inherit from parent workspaces</li>
                      <li>• Moving folders = Refactoring system design</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">🌀 Plugin Architecture</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Custom themes and look-and-feel</li>
                      <li>• Extensible component systems</li>
                      <li>• Template-driven generation</li>
                      <li>• Community-driven improvements</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Essential Files in Each Workspace
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="font-medium text-gray-900 mb-2">.maverick</div>
                    <div className="text-sm text-gray-600">
                      JSON configuration defining workspace scope, team, AI preferences, and theme
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="font-medium text-gray-900 mb-2">instructions.md</div>
                    <div className="text-sm text-gray-600">
                      AI-specific instructions and context for this workspace
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="font-medium text-gray-900 mb-2">status.md</div>
                    <div className="text-sm text-gray-600">
                      Real-time status updates, always kept current by AI
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schema Tab */}
          <TabsContent value="schema" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Complete .maverick Schema</CardTitle>
                <CardDescription>
                  JSON schema with all available properties and their purposes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm">{`{
  "version": "1.0",
  "scope": {
    "type": "root" | "product" | "feature" | "legal" | "marketing",
    "name": "Human readable name",
    "description": "What this workspace encompasses",
    "owner": "team-identifier or email",
    "boundaries": {
      "includes": ["./src", "./docs"],
      "excludes": ["./node_modules", "./.git"]
    }
  },
  "instructions": {
    "file": "./instructions.md",
    "context": "AI instructions specific to this scope",
    "inheritance": "merge" | "override" | "ignore"
  },
  "theme": {
    "primary_color": "#006aff",
    "secondary_color": "#00d4ff",
    "accent_color": "#ff6900",
    "ui_style": "default" | "square" | "custom",
    "components": "default" | "branded" | "minimal",
    "layout": "dashboard" | "minimal" | "full_width"
  },
  "team": {
    "roles": {
      "lead": "person@company.com",
      "members": ["dev1@company.com"],
      "stakeholders": ["pm@company.com"]
    },
    "workflow": {
      "template": "agile" | "kanban" | "legal",
      "cadence": "sprint" | "continuous"
    }
  },
  "ai": {
    "claude": {
      "instructions": "./instructions.md",
      "preferences": {
        "framework": "nextjs",
        "language": "typescript"
      }
    },
    "goose": {
      "enabled": true,
      "context_files": ["./README.md"]
    }
  },
  "templates": {
    "workspace_type": "product-team",
    "generates": ["feature", "component"],
    "template_metadata": {
      "author": "team-name",
      "version": "1.0.0",
      "success_metrics": {}
    }
  },
  "automation": {
    "workflows": [],
    "integrations": {
      "square": { "auto_setup": true },
      "github": { "auto_setup": true }
    }
  },
  "status": {
    "current_phase": "development",
    "last_updated": "2025-01-03T10:00:00Z",
    "health": "green" | "yellow" | "red"
  }
}`}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Themes Tab */}
          <TabsContent value="themes" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Puzzle className="w-5 h-5" />
                  Custom Themes & Look-and-Feel
                </CardTitle>
                <CardDescription>
                  How .maverick files enable custom UI themes and branding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <h4 className="font-semibold text-indigo-900 mb-2">Default Theme</h4>
                    <div className="text-sm text-indigo-800 mb-3">
                      Clean, professional interface with Maverick branding
                    </div>
                    <div className="text-xs font-mono bg-white p-2 rounded">
                      "ui_style": "default"
                    </div>
                  </div>

                  <div className="border border-orange-200 rounded-lg p-4 bg-gradient-to-br from-orange-50 to-yellow-50">
                    <h4 className="font-semibold text-orange-900 mb-2">Square Theme</h4>
                    <div className="text-sm text-orange-800 mb-3">
                      Square-branded interface for payment apps
                    </div>
                    <div className="text-xs font-mono bg-white p-2 rounded">
                      "ui_style": "square"
                    </div>
                  </div>

                  <div className="border border-purple-200 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-pink-50">
                    <h4 className="font-semibold text-purple-900 mb-2">Custom Theme</h4>
                    <div className="text-sm text-purple-800 mb-3">
                      Fully customizable with your brand colors
                    </div>
                    <div className="text-xs font-mono bg-white p-2 rounded">
                      "ui_style": "custom"
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Example Theme Configuration</h4>
                  <div className="bg-gray-900 text-gray-100 rounded p-3 text-sm font-mono">
{`"theme": {
  "primary_color": "#006aff",
  "secondary_color": "#00d4ff", 
  "accent_color": "#ff6900",
  "ui_style": "square",
  "components": "branded",
  "layout": "dashboard_focused",
  "custom_css": "./styles/custom.css",
  "logo": "./assets/logo.svg"
}`}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Built-in Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 border border-gray-200 rounded-lg">
                      <div className="font-medium">startup-root</div>
                      <div className="text-sm text-gray-600">Complete company structure</div>
                    </div>
                    <div className="p-3 border border-gray-200 rounded-lg">
                      <div className="font-medium">saas-product</div>
                      <div className="text-sm text-gray-600">Modern SaaS with Next.js</div>
                    </div>
                    <div className="p-3 border border-gray-200 rounded-lg">
                      <div className="font-medium">square-app</div>
                      <div className="text-sm text-gray-600">Square API integration</div>
                    </div>
                    <div className="p-3 border border-gray-200 rounded-lg">
                      <div className="font-medium">legal-incorporation</div>
                      <div className="text-sm text-gray-600">Delaware C-Corp setup</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Creating Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600 space-y-3">
                    <p>Any successful .maverick workspace can become a template:</p>
                    <div className="bg-gray-100 p-3 rounded font-mono text-xs">
                      goose template extract --from=./my-project --name="my-template"
                    </div>
                    <p>Templates include:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Complete folder structure</li>
                      <li>AI instructions and context</li>
                      <li>Team configuration</li>
                      <li>Custom themes</li>
                      <li>Automation workflows</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Examples Tab */}
          <TabsContent value="examples" className="space-y-8">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Square App Example</CardTitle>
                  <CardDescription>
                    A complete Square payment application workspace
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
                    <pre>{`{
  "scope": {
    "type": "product",
    "name": "Square POS Integration",
    "owner": "payments-team"
  },
  "theme": {
    "primary_color": "#006aff",
    "ui_style": "square",
    "components": "branded"
  },
  "ai": {
    "claude": {
      "preferences": {
        "framework": "nextjs",
        "payments": "square",
        "compliance": "pci_dss"
      }
    }
  },
  "automation": {
    "integrations": {
      "square": {
        "auto_setup": true,
        "services": ["payments", "orders", "inventory"]
      }
    }
  }
}`}</pre>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Startup Root Example</CardTitle>
                  <CardDescription>
                    Root workspace for a complete startup infrastructure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
                    <pre>{`{
  "scope": {
    "type": "root",
    "name": "TechStartup Inc",
    "owner": "founders"
  },
  "templates": {
    "generates": ["legal", "product", "marketing"],
    "template_metadata": {
      "stage": "pre_seed",
      "industry": "fintech"
    }
  },
  "automation": {
    "workflows": [
      {
        "name": "incorporation",
        "steps": ["legal_setup", "square_account", "github_org"]
      }
    ]
  }
}`}</pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Integration Tab */}
          <TabsContent value="integration" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  AI and Tool Integration
                </CardTitle>
                <CardDescription>
                  How .maverick files integrate with AI assistants and development tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">🤖 Goose Integration</h4>
                    <div className="text-sm text-blue-800 space-y-2">
                      <p>When you run <code className="bg-white px-1 rounded">goose</code> in any directory:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Scans up directory tree for .maverick files</li>
                        <li>Loads contextual AI instructions</li>
                        <li>Understands workspace boundaries</li>
                        <li>Provides context-aware suggestions</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 mb-3">🧠 Claude Integration</h4>
                    <div className="text-sm text-purple-800 space-y-2">
                      <p>Maverick web platform reads .maverick files from git:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Applies custom themes automatically</li>
                        <li>Shows contextual AI assistance</li>
                        <li>Enables workspace-specific features</li>
                        <li>Maintains project status updates</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h4 className="font-semibold text-green-900 mb-3">🌀 The Spiral Effect</h4>
                  <div className="text-green-800">
                    <p className="mb-3">
                      Every .maverick workspace that proves successful becomes a template for others:
                    </p>
                    <div className="font-mono text-sm bg-white p-3 rounded">
                      User Need → AI Implementation → .maverick Template → Community Benefit → Platform Evolution
                    </div>
                    <p className="mt-3">
                      This creates a self-improving ecosystem where the platform literally builds itself 
                      through collective user intelligence.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-accent-primary to-purple-600 rounded-xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">
            Ready to Create Your First .maverick Workspace?
          </h3>
          <p className="text-xl mb-6 opacity-90">
            Start building with templates or create your own extensible workspace
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/cockpit"
              className="px-6 py-3 bg-white text-accent-primary rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Start Building
            </Link>
            <Link
              href="/docs/templates"
              className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors font-medium"
            >
              Browse Templates
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}