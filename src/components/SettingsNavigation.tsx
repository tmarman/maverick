'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { 
  Bot, 
  Plug, 
  CreditCard, 
  ArrowLeft
} from 'lucide-react'

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

export function SettingsNavigation() {
  const pathname = usePathname()

  return (
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
                'w-full text-left px-3 py-3 rounded-lg transition-colors group block',
                isActive 
                  ? 'bg-accent-primary text-text-inverse' 
                  : 'hover:bg-background-secondary text-text-primary'
              )}
            >
              <div className="flex items-start space-x-3">
                <Icon className={cn(
                  'w-4 h-4 mt-0.5 flex-shrink-0',
                  isActive ? 'text-text-inverse' : 'text-text-primary'
                )} />
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    'font-medium text-sm truncate',
                    isActive ? 'text-text-inverse' : 'text-text-primary'
                  )}>
                    {item.name}
                  </div>
                  <div className={cn(
                    'text-xs mt-0.5 leading-tight',
                    isActive ? 'text-text-inverse/80' : 'text-text-muted'
                  )}>
                    {item.description}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}