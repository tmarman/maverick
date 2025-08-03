'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

interface CockpitShellProps {
  children: React.ReactNode
  sidebarContent?: React.ReactNode
  title?: string
}

export default function CockpitShell({ children, sidebarContent, title }: CockpitShellProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const isActiveRoute = (route: string) => pathname === route

  const defaultSidebarContent = (
    <nav className="flex-1 px-4">
      <div className="space-y-1">
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wide px-2 mb-3">
          Navigation
        </div>

        <Link
          href="/app"
          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group ${
            isActiveRoute('/app') 
              ? 'bg-accent-primary text-text-inverse' 
              : 'hover:bg-background-secondary text-text-primary'
          }`}
        >
          <div className="flex items-center space-x-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
            </svg>
            <span className="font-medium text-sm">Dashboard</span>
          </div>
        </Link>

        <Link
          href="/app/repositories"
          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group ${
            isActiveRoute('/app/repositories') 
              ? 'bg-accent-primary text-text-inverse' 
              : 'hover:bg-background-secondary text-text-primary'
          }`}
        >
          <div className="flex items-center space-x-3">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.30 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span className="font-medium text-sm">Import</span>
          </div>
        </Link>

        <Link
          href="/app/users"
          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group ${
            isActiveRoute('/app/users') 
              ? 'bg-accent-primary text-text-inverse' 
              : 'hover:bg-background-secondary text-text-primary'
          }`}
        >
          <div className="flex items-center space-x-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <span className="font-medium text-sm">Team</span>
          </div>
        </Link>

        <Link
          href="/app/settings"
          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group ${
            isActiveRoute('/app/settings') 
              ? 'bg-accent-primary text-text-inverse' 
              : 'hover:bg-background-secondary text-text-primary'
          }`}
        >
          <div className="flex items-center space-x-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium text-sm">Settings</span>
          </div>
        </Link>
      </div>

      {/* User Profile Section */}
      <div className="mt-auto pt-4 border-t border-border-standard">
        <div className="px-2 py-3">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-accent-primary rounded-full flex items-center justify-center">
              <span className="text-text-inverse text-sm font-medium">
                {session?.user?.name?.[0] || session?.user?.email?.[0] || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">
                {session?.user?.name || 'User'}
              </div>
              <div className="text-xs text-text-secondary truncate">
                {session?.user?.email}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-secondary rounded-md transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )

  return (
    <div className="h-screen flex bg-background-primary">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-72'} transition-all duration-300 bg-background-primary border-r border-border-standard flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-border-standard">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between">
              <Link href="/app" className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <img 
                    src="/design/icon.png" 
                    alt="Maverick" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="font-semibold text-text-primary text-sm">Maverick</div>
                  <div className="text-xs text-text-secondary">Development Hub</div>
                </div>
              </Link>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1.5 hover:bg-background-secondary rounded-md transition-colors"
              >
                <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-2 hover:bg-background-secondary rounded-md transition-colors"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <img 
                    src="/design/icon.png" 
                    alt="Maverick" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Content */}
        {!sidebarCollapsed && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {sidebarContent ? (
              <>
                {sidebarContent}
                {/* Always include user profile section */}
                <div className="mt-auto pt-4 border-t border-border-standard">
                  <div className="px-2 py-3">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-accent-primary rounded-full flex items-center justify-center">
                        <span className="text-text-inverse text-sm font-medium">
                          {session?.user?.name?.[0] || session?.user?.email?.[0] || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text-primary truncate">
                          {session?.user?.name || 'User'}
                        </div>
                        <div className="text-xs text-text-secondary truncate">
                          {session?.user?.email}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Link
                        href="/app/settings"
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center space-x-2 ${
                          isActiveRoute('/app/settings') 
                            ? 'bg-accent-primary text-text-inverse' 
                            : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Account Settings</span>
                      </Link>
                      
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-secondary rounded-md transition-colors flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              defaultSidebarContent
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {title && (
          <div className="px-6 py-4 border-b border-border-standard bg-background-primary">
            <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
          </div>
        )}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-3 border-t border-border-standard bg-background-secondary">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <div className="flex items-center space-x-4">
              <span>© 2025 Maverick</span>
              <Link href="/docs" className="hover:text-text-primary underline">
                Documentation
              </Link>
              <Link href="/docs/maverick-structure" className="hover:text-text-primary underline">
                .maverick Guide
              </Link>
              <span>•</span>
              <span>Built with ❤️ and AI</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>🤖 AI-Powered Platform</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}