'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ArrowLeft, RefreshCw, Home } from 'lucide-react'

const ERROR_MESSAGES = {
  'Configuration': 'There was a problem with the authentication configuration.',
  'AccessDenied': 'You cancelled the login process or access was denied.',
  'Verification': 'The login verification failed. Please try again.',
  'Default': 'An unexpected error occurred during login.',
  'OAuthCallback': 'There was an issue with the OAuth callback. This usually means a configuration problem.',
  'OAuthSignin': 'Error occurred during OAuth signin process.',
  'OAuthCreateAccount': 'Could not create account with OAuth provider.',
  'EmailCreateAccount': 'Could not create account with email.',
  'Callback': 'Error in callback handler.',
  'OAuthAccountNotLinked': 'The OAuth account is not linked to an existing account. Try signing in with a different method first.',
  'EmailSignin': 'Check your email for the signin link.',
  'CredentialsSignin': 'Invalid credentials provided.',
  'SessionRequired': 'You must be signed in to access this page.'
}

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [details, setDetails] = useState<string | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    const callbackUrl = searchParams.get('callbackUrl')
    
    setError(errorParam)
    
    // Log the error details for debugging
    if (errorParam) {
      console.error('Authentication Error:', {
        error: errorParam,
        callbackUrl,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }

    // Set additional details based on error type
    if (errorParam === 'OAuthCallback') {
      setDetails('This usually indicates a redirect URI mismatch in your OAuth provider settings. Check that the callback URL is correctly configured.')
    } else if (errorParam === 'OAuthAccountNotLinked') {
      setDetails('Try signing in with your email first, then connect your OAuth account from your settings page.')
    }
  }, [searchParams])

  const getErrorMessage = (errorCode: string | null): string => {
    if (!errorCode) return ERROR_MESSAGES.Default
    return ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.Default
  }

  const handleRetry = () => {
    const callbackUrl = searchParams.get('callbackUrl') || '/app'
    router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  const handleGoHome = () => {
    router.push('/')
  }

  const handleGoBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Authentication Error</h1>
          <p className="mt-2 text-gray-600">We encountered an issue signing you in</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Sign-in Failed</CardTitle>
            <CardDescription>
              {getErrorMessage(error)}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {error && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error Code:</strong> {error}
                </AlertDescription>
              </Alert>
            )}

            {details && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Details:</strong> {details}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Button onClick={handleRetry} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button variant="outline" onClick={handleGoBack} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              
              <Button variant="ghost" onClick={handleGoHome} className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>Need help? Contact support with error code: <code className="bg-gray-100 px-1 rounded">{error}</code></p>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Loading...</h1>
          </div>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}