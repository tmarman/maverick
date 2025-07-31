'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn, getSession } from 'next-auth/react'
import { Navigation } from '@/components/Navigation'

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      })
      
      if (result?.error) {
        console.error('Login failed:', result.error)
        alert('Invalid email or password')
      } else if (result?.ok) {
        // Redirect to app on success
        window.location.href = '/app'
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: 'github' | 'square') => {
    setIsLoading(true)
    
    try {
      console.log(`${provider} OAuth login initiated`)
      
      if (provider === 'github') {
        // Use NextAuth signIn for GitHub
        await signIn('github', { 
          callbackUrl: '/app',
          redirect: true 
        })
      } else if (provider === 'square') {
        // Use NextAuth signIn for Square
        await signIn('square', { 
          callbackUrl: '/app',
          redirect: true 
        })
      }
    } catch (error) {
      console.error(`${provider} OAuth error:`, error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <Navigation />
      
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-text-secondary">
              Or{' '}
              <Link href="/register" className="font-medium text-accent-primary hover:text-accent-hover">
                create a new account
              </Link>
            </p>
          </div>
          
          <div className="bg-background-secondary rounded-2xl p-8 border border-border-subtle">
            {/* OAuth Login Buttons */}
            <div className="space-y-3 mb-6">
              {/* GitHub Login Button */}
              <button
                onClick={() => handleOAuthLogin('github')}
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Continue with GitHub
                </div>
              </button>

              {/* Square Login Button */}
              <button
                onClick={() => handleOAuthLogin('square')}
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4.01 0h15.98C22.21 0 24 1.79 24 4.01v15.98C24 22.21 22.21 24 19.99 24H4.01C1.79 24 0 22.21 0 19.99V4.01C0 1.79 1.79 0 4.01 0z"/>
                    <path d="M8.5 8.5h7v7h-7z" fill="white"/>
                  </svg>
                  Continue with Square
                </div>
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-standard" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background-secondary text-text-muted">Or continue with email</span>
              </div>
            </div>

            <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-primary">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 appearance-none relative block w-full px-3 py-3 border border-border-standard placeholder-text-muted text-text-primary rounded-lg focus:outline-none focus:ring-accent-primary focus:border-accent-primary focus:z-10 bg-background-primary"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-primary">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 appearance-none relative block w-full px-3 py-3 border border-border-standard placeholder-text-muted text-text-primary rounded-lg focus:outline-none focus:ring-accent-primary focus:border-accent-primary focus:z-10 bg-background-primary"
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-standard rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-text-secondary">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/forgot-password" className="font-medium text-accent-primary hover:text-accent-hover">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-text-inverse bg-accent-primary hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="text-center text-sm text-text-muted">
                New to Maverick?{' '}
                <Link href="/register" className="font-medium text-accent-primary hover:text-accent-hover">
                  Create your account
                </Link>
              </div>
            </div>
          </div>

          {/* Benefits section */}
          <div className="bg-background-secondary rounded-lg p-6 border border-border-subtle">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Why sign up for Maverick?</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3v-8a1 1 0 011-1h4a1 1 0 011 1v8h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">Complete Legal Formation</div>
                  <div className="text-xs text-text-secondary">LLC/C-Corp with all required documents</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">AI Business Mentorship</div>
                  <div className="text-xs text-text-secondary">24/7 guidance from Goose AI</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">Custom App Generation</div>
                  <div className="text-xs text-text-secondary">Production-ready software built for you</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}