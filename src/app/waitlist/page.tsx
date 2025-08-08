'use client'

import { useState } from 'react'
import { Navigation } from '@/components/Navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Mail, Users, Clock, Zap } from 'lucide-react'
import type { Metadata } from 'next'

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [useCase, setUseCase] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          company,
          useCase,
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        const error = await response.json()
        setError(error.message || 'Something went wrong. Please try again.')
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background-primary">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-4">
              You're on the waitlist! 🚀
            </h1>
            <p className="text-lg text-text-secondary mb-8">
              Thanks {name ? name.split(' ')[0] : 'for joining'}! We'll notify you as soon as Maverick is ready for you.
              You'll be among the first to experience AI-native software development.
            </p>
            
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                What happens next?
              </h3>
              <div className="space-y-2 text-blue-800 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  <span>We'll send you exclusive updates as we build</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  <span>You'll get early access when we launch</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  <span>Your input will help shape the platform</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
              >
                Back to Home
              </Button>
              <Button 
                onClick={() => {
                  setIsSubmitted(false)
                  setEmail('')
                  setName('')
                  setCompany('')
                  setUseCase('')
                }}
              >
                Invite Someone Else
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center items-center mb-8">
            <img 
              src="/design/icon.png" 
              alt="Maverick" 
              className="h-16 w-16 mr-4"
            />
            <img 
              src="/design/textmark.png" 
              alt="Maverick" 
              className="h-12"
            />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            Be one of the first to <span className="text-accent-primary">fly with Maverick</span>
          </h1>
          <p className="text-xl text-text-secondary mb-16 max-w-3xl mx-auto">
            Get exclusive early access to AI-native software development. 
            Watch your ideas become reality in days, not months.
          </p>
        </div>
      </section>

      {/* Waitlist Form */}
      <section className="py-16 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center space-x-2 text-2xl">
                <Mail className="w-6 h-6 text-accent-primary" />
                <span>Get Early Access</span>
              </CardTitle>
              <p className="text-text-secondary">
                Join our exclusive waitlist and be first to build with AI
              </p>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 text-lg"
                  />
                </div>
                
                <div>
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12"
                  />
                </div>
                
                <div>
                  <Input
                    type="text"
                    placeholder="Company (optional)"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="h-12"
                  />
                </div>
                
                <div>
                  <Textarea
                    placeholder="What would you build with Maverick? (optional)"
                    value={useCase}
                    onChange={(e) => setUseCase(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-semibold"
                  disabled={isLoading || !email.trim()}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      <span>Joining waitlist...</span>
                    </div>
                  ) : (
                    '🚀 Join the Waitlist'
                  )}
                </Button>
              </form>

              <div className="text-center mt-6 text-sm text-text-muted">
                <p>Already have an invite code? <a href="/register" className="text-accent-primary hover:underline">Register here</a></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 bg-background-secondary">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-12">
            Why join the waitlist?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex space-x-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-1 flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary mb-2">
                  Early Access Priority
                </h3>
                <p className="text-text-secondary text-sm">
                  Be among the first to use Maverick when we launch. No waiting, just building.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mt-1 flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary mb-2">
                  Exclusive Updates
                </h3>
                <p className="text-text-secondary text-sm">
                  Get behind-the-scenes updates and sneak peeks as we build the platform.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mt-1 flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary mb-2">
                  Shape the Product
                </h3>
                <p className="text-text-secondary text-sm">
                  Your feedback will directly influence features and capabilities we build.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mt-1 flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary mb-2">
                  Launch Pricing
                </h3>
                <p className="text-text-secondary text-sm">
                  Lock in early-adopter pricing when you join from the waitlist.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}