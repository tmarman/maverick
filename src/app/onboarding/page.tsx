'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/Navigation'

export default function OnboardingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [userData, setUserData] = useState({
    name: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    businessGoal: '',
    experience: '',
    interests: [] as string[]
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    
    // Pre-fill name if available
    if (session.user.name && !userData.name) {
      setUserData(prev => ({ ...prev, name: session.user.name }))
    }
  }, [session, status, router, userData.name])

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    
    try {
      // Update user profile
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userData,
          onboardingCompleted: true
        })
      })

      if (response.ok) {
        router.push('/app')
      } else {
        console.error('Failed to update profile')
      }
    } catch (error) {
      console.error('Onboarding error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateUserData = (field: string, value: any) => {
    setUserData(prev => ({ ...prev, [field]: value }))
  }

  const toggleInterest = (interest: string) => {
    setUserData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-text-primary">Welcome to Maverick!</h1>
            <span className="text-sm text-text-muted">Step {step} of 3</span>
          </div>
          <div className="w-full bg-border-subtle rounded-full h-2">
            <div 
              className="bg-accent-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-background-secondary rounded-2xl p-8 border border-border-subtle">
          
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">👋</div>
                <h2 className="text-2xl font-bold text-text-primary">Let's get to know you</h2>
                <p className="text-text-secondary">
                  Help us personalize your Maverick experience
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    What should we call you?
                  </label>
                  <input
                    type="text"
                    value={userData.name}
                    onChange={(e) => updateUserData('name', e.target.value)}
                    className="w-full px-4 py-3 border border-border-standard rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Timezone
                  </label>
                  <select
                    value={userData.timezone}
                    onChange={(e) => updateUserData('timezone', e.target.value)}
                    className="w-full px-4 py-3 border border-border-standard rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={!userData.name}
                className="w-full bg-accent-primary hover:bg-accent-hover disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Business Goals */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🎯</div>
                <h2 className="text-2xl font-bold text-text-primary">What's your goal?</h2>
                <p className="text-text-secondary">
                  This helps us recommend the best path forward
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'start_business', title: 'Start a new business', desc: 'I have an idea and want to form a company' },
                  { id: 'build_software', title: 'Build software', desc: 'I need custom apps or websites built' },
                  { id: 'grow_existing', title: 'Grow my existing business', desc: 'I have a business and want to expand' },
                  { id: 'explore', title: 'Just exploring', desc: 'I\'m learning about business formation' }
                ].map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => updateUserData('businessGoal', goal.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      userData.businessGoal === goal.id
                        ? 'border-accent-primary bg-accent-primary/5'
                        : 'border-border-standard hover:border-accent-primary/50'
                    }`}
                  >
                    <div className="font-semibold text-text-primary">{goal.title}</div>
                    <div className="text-sm text-text-secondary">{goal.desc}</div>
                  </button>
                ))}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border border-border-standard text-text-primary py-3 px-6 rounded-lg font-semibold hover:bg-background-tertiary transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!userData.businessGoal}
                  className="flex-1 bg-accent-primary hover:bg-accent-hover disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Interests */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🚀</div>
                <h2 className="text-2xl font-bold text-text-primary">What interests you?</h2>
                <p className="text-text-secondary">
                  Select all that apply - we'll customize your experience
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  'Software Development', 'E-commerce', 'Consulting', 'Marketing',
                  'Legal Services', 'Healthcare', 'Finance', 'Food & Beverage',
                  'Real Estate', 'Education', 'Non-profit', 'Other'
                ].map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      userData.interests.includes(interest)
                        ? 'border-accent-primary bg-accent-primary text-white'
                        : 'border-border-standard text-text-primary hover:border-accent-primary/50'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 border border-border-standard text-text-primary py-3 px-6 rounded-lg font-semibold hover:bg-background-tertiary transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="flex-1 bg-accent-primary hover:bg-accent-hover disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Setting up...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Skip Option */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/app')}
            className="text-text-muted hover:text-text-primary transition-colors text-sm"
          >
            Skip for now →
          </button>
        </div>
      </div>
    </div>
  )
}