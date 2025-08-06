'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Navigation } from '@/components/Navigation'

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email address'
    if (!formData.password) newErrors.password = 'Password is required'
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        // Registration successful - now sign them in
        const signInResult = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })

        if (signInResult?.ok) {
          // Redirect to wizard after successful login
          window.location.href = '/wizard'
        } else {
          setErrors({ email: 'Registration successful but login failed. Please try logging in.' })
        }
      } else {
        // Registration failed
        setErrors({ email: result.error || 'Registration failed' })
      }
    } catch (error) {
      console.error('Registration error:', error)
      setErrors({ email: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignup = async (provider: 'github' | 'square') => {
    setIsLoading(true)
    
    try {
      console.log(`${provider} OAuth signup initiated`)
      
      if (provider === 'github') {
        // Use NextAuth signIn for GitHub - will create user if doesn't exist
        await signIn('github', { 
          callbackUrl: '/wizard',
          redirect: true 
        })
      } else if (provider === 'square') {
        // Use NextAuth signIn for Square (once integrated)
        // For now, redirect to custom Square OAuth flow
        window.location.href = '/auth/square?mode=register'
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
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-text-secondary">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-accent-primary hover:text-accent-hover">
                Sign in here
              </Link>
            </p>
          </div>
          
          <div className="bg-background-secondary rounded-2xl p-8 border border-border-subtle">
            {/* OAuth Signup Buttons */}
            <div className="space-y-3 mb-6">
              {/* GitHub Signup Button */}
              <button
                onClick={() => handleOAuthSignup('github')}
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Sign up with GitHub
                </div>
              </button>

              {/* Square Signup Button */}
              <button
                onClick={() => handleOAuthSignup('square')}
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4.01 0h15.98C22.21 0 24 1.79 24 4.01v15.98C24 22.21 22.21 24 19.99 24H4.01C1.79 24 0 22.21 0 19.99V4.01C0 1.79 1.79 0 4.01 0z"/>
                    <path d="M8.5 8.5h7v7h-7z" fill="white"/>
                  </svg>
                  Sign up with Square
                </div>
              </button>
              <p className="mt-2 text-xs text-center text-text-muted">
                Connect your developer tools and payment processing
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-standard" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background-secondary text-text-muted">Or sign up with email</span>
              </div>
            </div>

            <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-primary">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`mt-1 block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary bg-background-primary transition-colors ${
                    errors.email ? 'border-red-500' : 'border-border-standard'
                  }`}
                  placeholder="Enter your email address"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-primary">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`mt-1 block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary bg-background-primary transition-colors ${
                    errors.password ? 'border-red-500' : 'border-border-standard'
                  }`}
                  placeholder="Create a secure password"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                <p className="text-text-muted text-xs mt-1">Must be at least 8 characters long</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`mt-1 block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary bg-background-primary transition-colors ${
                    errors.confirmPassword ? 'border-red-500' : 'border-border-standard'
                  }`}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
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
                      Creating account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-text-muted">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-accent-primary hover:text-accent-hover">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-accent-primary hover:text-accent-hover">
                  Privacy Policy
                </Link>
              </p>
            </form>

            <div className="mt-6">
              <div className="text-center text-sm text-text-muted">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-accent-primary hover:text-accent-hover">
                  Sign in here
                </Link>
              </div>
            </div>
          </div>

          {/* Next Steps Preview */}
          <div className="bg-accent-primary bg-opacity-10 border border-accent-primary rounded-lg p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-3">What happens after you sign up?</h3>
            <div className="space-y-2 text-sm text-text-secondary">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-accent-primary rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">1</div>
                Complete our business formation wizard
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 bg-accent-primary rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">2</div>
                Connect or create your Square account
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 bg-accent-primary rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">3</div>
                Get your business legally formed and ready to operate
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}