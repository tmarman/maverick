'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navigation } from '@/components/Navigation'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        setError(result.error || 'Something went wrong. Please try again.')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background-primary">
        <Navigation />
        
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              
              <h2 className="text-3xl font-extrabold text-text-primary">
                Check your email
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                We've sent a password reset link to
              </p>
              <p className="font-medium text-text-primary">
                {email}
              </p>
            </div>

            <div className="bg-background-secondary rounded-2xl p-8 border border-border-subtle">
              <div className="text-center space-y-4">
                <p className="text-sm text-text-secondary">
                  Click the link in your email to reset your password. If you don't see the email, check your spam folder.
                </p>
                
                <div className="pt-4">
                  <Link 
                    href="/login"
                    className="inline-flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-text-inverse bg-accent-primary hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary transition-colors"
                  >
                    Back to Sign In
                  </Link>
                </div>
                
                <div className="text-xs text-text-muted">
                  Didn't receive an email?{' '}
                  <button 
                    onClick={() => {setIsSubmitted(false); setEmail('')}} 
                    className="text-accent-primary hover:text-accent-hover"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <Navigation />
      
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
              Forgot your password?
            </h2>
            <p className="mt-2 text-center text-sm text-text-secondary">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
          
          <div className="bg-background-secondary rounded-2xl p-8 border border-border-subtle">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-primary">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`mt-1 block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary bg-background-primary transition-colors ${
                    error ? 'border-red-500' : 'border-border-standard'
                  }`}
                  placeholder="Enter your email address"
                />
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
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
                      Sending reset link...
                    </div>
                  ) : (
                    'Send reset link'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-text-secondary hover:text-text-primary">
                ← Back to sign in
              </Link>
            </div>
          </div>

          <div className="bg-background-secondary rounded-lg p-6 border border-border-subtle">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Need help?</h3>
            <div className="space-y-3 text-sm text-text-secondary">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-text-primary">Check your spam folder</div>
                  <div>Reset emails sometimes end up in spam or junk folders</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-text-primary">Try a magic link instead</div>
                  <div>Use our passwordless signin option from the login page</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}