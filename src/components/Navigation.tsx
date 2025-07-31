'use client'

import { useState } from 'react'
import Link from 'next/link'

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="border-b border-border-subtle bg-background-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-text-primary">Maverick</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link 
                href="/app" 
                className="text-text-secondary hover:text-text-primary px-3 py-2 text-sm font-medium transition-colors"
              >
                App
              </Link>
              <Link 
                href="/chat-wizard" 
                className="text-text-secondary hover:text-text-primary px-3 py-2 text-sm font-medium transition-colors"
              >
                Business Setup
              </Link>
              <Link 
                href="/ai-config" 
                className="text-text-secondary hover:text-text-primary px-3 py-2 text-sm font-medium transition-colors"
              >
                AI Config
              </Link>
              <Link 
                href="/dashboard" 
                className="text-text-secondary hover:text-text-primary px-3 py-2 text-sm font-medium transition-colors"
              >
                Analytics
              </Link>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              href="/login"
              className="text-text-secondary hover:text-text-primary px-4 py-2 text-sm font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/app"
              className="bg-accent-primary hover:bg-accent-hover text-text-inverse px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              🚀 Launch App
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-text-secondary hover:text-text-primary focus:outline-none focus:text-text-primary p-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-border-subtle mt-4">
              <Link 
                href="/app" 
                className="text-text-secondary hover:text-text-primary block px-3 py-2 text-base font-medium transition-colors"
              >
                App
              </Link>
              <Link 
                href="/chat-wizard" 
                className="text-text-secondary hover:text-text-primary block px-3 py-2 text-base font-medium transition-colors"
              >
                Business Setup
              </Link>
              <Link 
                href="/ai-config" 
                className="text-text-secondary hover:text-text-primary block px-3 py-2 text-base font-medium transition-colors"
              >
                AI Config
              </Link>
              <Link 
                href="/dashboard" 
                className="text-text-secondary hover:text-text-primary block px-3 py-2 text-base font-medium transition-colors"
              >
                Analytics
              </Link>
              <div className="pt-4 border-t border-border-subtle mt-4">
                <Link 
                  href="/login"
                  className="text-text-secondary hover:text-text-primary block px-3 py-2 text-base font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/app"
                  className="bg-accent-primary hover:bg-accent-hover text-text-inverse block px-3 py-2 rounded-lg text-base font-medium transition-colors mt-2"
                >
                  🚀 Launch App
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}