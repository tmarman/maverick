'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Navigation } from '@/components/Navigation'

function SquareAuthContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleSquareAuth = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')
      const mode = searchParams.get('mode') // 'login' or 'register'

      if (error) {
        setStatus('error')
        setMessage(`Authentication failed: ${error}`)
        return
      }

      if (!code) {
        // Redirect to Square OAuth
        const clientId = process.env.NEXT_PUBLIC_SQUARE_CLIENT_ID || 'YOUR_SQUARE_CLIENT_ID'
        const redirectUri = `${window.location.origin}/auth/square`
        const scopes = [
          'MERCHANT_PROFILE_READ',
          'PAYMENTS_READ',
          'PAYMENTS_WRITE',
          'ORDERS_READ',
          'ORDERS_WRITE',
          'CUSTOMERS_READ',
          'CUSTOMERS_WRITE',
          'SETTLEMENTS_READ',
          'BANK_ACCOUNTS_READ'
        ].join('+')
        
        const squareAuthUrl = `https://connect.squareup.com/oauth2/authorize?client_id=${clientId}&scope=${scopes}&session=false&redirect_uri=${encodeURIComponent(redirectUri)}&state=${mode || 'login'}`
        
        window.location.href = squareAuthUrl
        return
      }

      // Handle the OAuth callback
      try {
        setMessage('Exchanging authorization code for access token...')
        
        // TODO: Implement actual OAuth token exchange
        const response = await fetch('/api/auth/square/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            state,
            mode
          }),
        })

        if (!response.ok) {
          throw new Error('Token exchange failed')
        }

        const data = await response.json()
        
        setStatus('success')
        setMessage('Successfully connected to Square!')
        
        // Redirect based on state
        setTimeout(() => {
          if (state === 'accounts-integration') {
            window.location.href = '/accounts?tab=integrations&connected=square'
          } else if (state === 'register' || mode === 'register') {
            window.location.href = '/wizard'
          } else {
            window.location.href = '/dashboard'
          }
        }, 2000)

      } catch (error) {
        setStatus('error')
        setMessage('Failed to complete Square authentication. Please try again.')
        console.error('Square auth error:', error)
      }
    }

    handleSquareAuth()
  }, [searchParams])

  return (
    <div className="min-h-screen bg-background-primary">
      <Navigation />
      
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-background-secondary rounded-full flex items-center justify-center mb-6">
              {status === 'loading' && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
              )}
              {status === 'success' && (
                <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {status === 'error' && (
                <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              {status === 'loading' && 'Connecting to Square...'}
              {status === 'success' && 'Connected Successfully!'}
              {status === 'error' && 'Connection Failed'}
            </h2>
            
            <p className="text-text-secondary">
              {message}
            </p>
          </div>

          {status === 'loading' && (
            <div className="bg-background-secondary rounded-lg p-6 border border-border-subtle">
              <h3 className="font-semibold text-text-primary mb-3">Connecting your Square account...</h3>
              <div className="space-y-2 text-sm text-text-secondary">
                <div className="flex items-center">
                  <div className="animate-pulse w-2 h-2 bg-accent-primary rounded-full mr-3"></div>
                  Setting up payment processing
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-border-standard rounded-full mr-3"></div>
                  Configuring merchant account
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-border-standard rounded-full mr-3"></div>
                  Importing business information
                </div>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-800 mb-3">Square Account Connected!</h3>
              <div className="space-y-2 text-sm text-green-700">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Payment processing enabled
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Business information imported
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Ready to process payments
                </div>
              </div>
              <p className="text-green-700 text-sm mt-3">
                Redirecting you to complete your business setup...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="font-semibold text-red-800 mb-3">Connection Failed</h3>
              <p className="text-red-700 text-sm mb-4">
                We couldn't complete the connection to your Square account. This might be due to:
              </p>
              <ul className="text-sm text-red-700 space-y-1 mb-4">
                <li>• Authorization was cancelled</li>
                <li>• Network connection issues</li>
                <li>• Square service temporarily unavailable</li>
              </ul>
              <div className="flex space-x-3">
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Try Again
                </button>
                <button 
                  onClick={() => window.location.href = '/register'}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm"
                >
                  Use Email Instead
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SquareAuth() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background-primary">
        <Navigation />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
        </div>
      </div>
    }>
      <SquareAuthContent />
    </Suspense>
  )
}