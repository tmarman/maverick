'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Navigation } from '@/components/Navigation'

function ResetPasswordContent() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const searchParams = useSearchParams()

  const token = searchParams.get('token')
  const email = searchParams.get('email')

  useEffect(() => {
    if (!token || !email) {
      setErrors({ general: 'Invalid or expired reset link. Please request a new password reset.' })
    }
  }, [token, email])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.password) newErrors.password = 'Password is required'
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !token || !email) return

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
          password: formData.password,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setIsSuccess(true)
      } else {
        setErrors({ general: result.error || 'Password reset failed. Please try again.' })
      }
    } catch (error) {
      console.error('Reset password error:', error)
      setErrors({ general: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background-primary">
        <Navigation />
        
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              
              <h2 className="text-3xl font-extrabold text-text-primary">
                Password reset successful!
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                Your password has been successfully updated.
              </p>
            </div>

            <div className="bg-background-secondary rounded-2xl p-8 border border-border-subtle text-center">
              <p className="text-sm text-text-secondary mb-6">
                You can now sign in with your new password.
              </p>
              
              <Link 
                href="/login"
                className="inline-flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-text-inverse bg-accent-primary hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary transition-colors"
              >
                Sign In
              </Link>
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
              Reset your password
            </h2>
            <p className="mt-2 text-center text-sm text-text-secondary">
              Enter your new password below
            </p>
          </div>
          
          <div className="bg-background-secondary rounded-2xl p-8 border border-border-subtle">
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{errors.general}</p>
                <div className="mt-3">
                  <Link 
                    href="/forgot-password"
                    className="text-sm text-red-600 hover:text-red-500 underline"
                  >
                    Request a new reset link
                  </Link>
                </div>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-primary">
                  New Password
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
                  placeholder="Enter your new password"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                <p className="text-text-muted text-xs mt-1">Must be at least 8 characters long</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary">
                  Confirm New Password
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
                  placeholder="Confirm your new password"
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading || !token || !email}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-text-inverse bg-accent-primary hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating password...
                    </div>
                  ) : (
                    'Update password'
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
        </div>
      </div>
    </div>
  )
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background-primary">
        <Navigation />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}