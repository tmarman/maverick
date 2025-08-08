'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import ProjectShell from '@/components/ProjectShell'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CreditCard,
  DollarSign,
  Download,
  Calendar,
  Zap,
  Check,
  AlertCircle,
  Bot,
  Plug,
  ArrowLeft
} from 'lucide-react'

export default function BillingPage() {
  const pathname = usePathname()
  
  const currentPlan = {
    name: 'Developer',
    price: '$0',
    period: 'Free during beta',
    features: [
      'Unlimited AI provider connections',
      'All development tools included', 
      'Community support',
      'Basic integrations'
    ]
  }

  const upcomingPlans = [
    {
      name: 'Pro',
      price: '$29',
      period: 'per month',
      features: [
        'Everything in Developer',
        'Priority AI processing',
        'Advanced integrations', 
        'Priority support',
        'Custom domains'
      ],
      popular: false
    },
    {
      name: 'Business',
      price: '$99', 
      period: 'per month',
      features: [
        'Everything in Pro',
        'Team collaboration',
        'SSO integration',
        'Custom AI models',
        'Dedicated support'
      ],
      popular: true
    }
  ]

  const billingHistory = [
    { date: '2025-01-01', amount: '$0.00', status: 'Free Plan', description: 'Beta Access' },
    { date: '2024-12-01', amount: '$0.00', status: 'Free Plan', description: 'Beta Access' },
    { date: '2024-11-01', amount: '$0.00', status: 'Free Plan', description: 'Beta Access' }
  ]

  const settingsNavigation = [
    {
      name: 'AI Providers',
      href: '/app/settings/ai-providers',
      icon: Bot,
      description: 'Manage your AI models and API keys'
    },
    {
      name: 'Integrations',
      href: '/app/settings/integrations',
      icon: Plug,
      description: 'Connect external services and APIs'
    },
    {
      name: 'Billing',
      href: '/app/settings/billing',
      icon: CreditCard,
      description: 'Manage subscription and billing'
    }
  ]

  const sidebarContent = (
    <div className="flex-1 px-4">
      <div className="space-y-1">
        {/* Back to Projects Link */}
        <Link
          href="/app"
          className="w-full text-left px-3 py-2.5 rounded-lg transition-colors group hover:bg-background-secondary text-text-primary mb-4 flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-3" />
          <span className="font-medium text-sm">Back to Projects</span>
        </Link>

        <div className="text-xs font-semibold text-text-muted uppercase tracking-wide px-2 mb-3">
          Settings
        </div>

        {settingsNavigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-lg transition-colors group',
                isActive 
                  ? 'bg-accent-primary text-text-inverse' 
                  : 'hover:bg-background-secondary text-text-primary'
              )}
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-text-secondary">{item.description}</div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )

  return (
    <ProjectShell title="Billing" sidebarContent={sidebarContent}>
    <div className="h-full p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Usage</h1>
          <p className="text-gray-600">Manage your subscription and view usage details</p>
        </div>
      </div>

      {/* Beta Notice */}
      <Alert className="mb-6 border-blue-200 bg-blue-50">
        <Zap className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="font-medium mb-1">Free Beta Access</div>
          <div className="text-sm">
            You're currently using Maverick during our beta period. All features are free while we refine the platform.
            Paid plans will be available when we launch publicly.
          </div>
        </AlertDescription>
      </Alert>

      {/* Current Plan */}
      <Card className="mb-6 border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Current Plan: {currentPlan.name}
              </CardTitle>
              <p className="text-gray-600 mt-1">{currentPlan.period}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{currentPlan.price}</div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Features Included</h4>
              <ul className="space-y-2">
                {currentPlan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Usage This Month</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">AI API Calls</span>
                  <span className="font-mono">Unlimited</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Projects</span>
                  <span className="font-mono">Unlimited</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Integrations</span>
                  <span className="font-mono">All Available</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Plans */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Planned Pricing (Post-Beta)</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {upcomingPlans.map((plan) => (
            <Card key={plan.name} className={`shadow-sm ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {plan.name}
                      {plan.popular && <Badge className="bg-blue-600 text-white">Popular</Badge>}
                    </CardTitle>
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600 ml-1">{plan.period}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Billing History
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {billingHistory.map((invoice, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{invoice.description}</div>
                    <div className="text-sm text-gray-600">{invoice.date}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{invoice.amount}</div>
                    <div className="text-sm text-gray-600">{invoice.status}</div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-3 h-3 mr-1" />
                    Receipt
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {billingHistory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No billing history available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </ProjectShell>
  )
}