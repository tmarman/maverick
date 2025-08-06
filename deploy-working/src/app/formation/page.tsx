'use client'

import { useState } from 'react'
import { Navigation } from '@/components/Navigation'
import { SquarePaymentForm } from '@/components/SquarePaymentForm'

export default function FormationPage() {
  const [step, setStep] = useState(1)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [formationResult, setFormationResult] = useState<any>(null)
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'LLC',
    state: 'DE',
    industry: '',
    description: '',
    founderName: '',
    founderEmail: '',
    subscriptionPlan: 'founder'
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handlePaymentSuccess = (result: any) => {
    console.log('Payment successful:', result)
    setPaymentSuccess(true)
    setFormationResult(result.formation)
    setPaymentError(null)
  }

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error)
    setPaymentError(error.message || 'Payment failed')
    setPaymentSuccess(false)
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Start Your Business
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Complete business formation with ongoing AI development support. 
            From legal structure to custom software, we handle everything.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  stepNumber <= step 
                    ? 'bg-accent-primary text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    stepNumber < step ? 'bg-accent-primary' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-background-secondary rounded-2xl p-8 border border-border-subtle">
          
          {paymentSuccess ? (
            /* Success State */
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              
              <h2 className="text-3xl font-bold text-text-primary mb-4">
                🎉 Welcome to Maverick!
              </h2>
              
              <p className="text-lg text-text-secondary mb-6">
                Your business formation for <strong>{formData.businessName}</strong> is now processing.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
                <h3 className="font-semibold text-blue-800 mb-4">What happens next?</h3>
                <ul className="text-sm text-blue-700 space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">✅</span>
                    <span>Payment confirmed and business formation initiated</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">📧</span>
                    <span>Welcome email sent with your account details</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-orange-500 mt-1">🏢</span>
                    <span>Legal paperwork and state filing will begin within 24 hours</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-500 mt-1">🏦</span>
                    <span>Square banking setup will be configured automatically</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">🚀</span>
                    <span>Start building your software in the Maverick cockpit immediately</span>
                  </li>
                </ul>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/cockpit"
                  className="bg-accent-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-accent-hover transition-colors"
                >
                  🚀 Enter Cockpit
                </a>
                <a
                  href="/"
                  className="border border-border-standard text-text-primary px-8 py-3 rounded-lg font-semibold hover:bg-background-tertiary transition-colors"
                >
                  📊 Back to Home
                </a>
              </div>
              
              {formationResult && (
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-text-muted">
                    Formation ID: {formationResult.id}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Step 1: Business Details */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text-primary mb-6">Business Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    className="w-full px-4 py-2 border border-border-standard rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    placeholder="Your Business Name LLC"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Business Type
                  </label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                    className="w-full px-4 py-2 border border-border-standard rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  >
                    <option value="LLC">LLC (Limited Liability Company)</option>
                    <option value="C-Corp">C-Corporation</option>
                    <option value="S-Corp">S-Corporation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    State of Formation
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-4 py-2 border border-border-standard rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  >
                    <option value="DE">Delaware (Recommended)</option>
                    <option value="CA">California</option>
                    <option value="NY">New York</option>
                    <option value="TX">Texas</option>
                    <option value="FL">Florida</option>
                    <option value="OTHER">Other State</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Industry
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    className="w-full px-4 py-2 border border-border-standard rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  >
                    <option value="">Select Industry</option>
                    <option value="Software">Software & Technology</option>
                    <option value="Consulting">Consulting Services</option>
                    <option value="Ecommerce">E-commerce & Retail</option>
                    <option value="Marketing">Marketing & Advertising</option>
                    <option value="Food">Food & Beverage</option>
                    <option value="Health">Health & Wellness</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Business Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-border-standard rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  placeholder="Briefly describe what your business does..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!formData.businessName || !formData.industry}
                  className="bg-accent-primary hover:bg-accent-hover disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-8 rounded-lg font-semibold transition-colors"
                >
                  Next: Personal Information
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Personal Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text-primary mb-6">Your Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.founderName}
                    onChange={(e) => handleInputChange('founderName', e.target.value)}
                    className="w-full px-4 py-2 border border-border-standard rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.founderEmail}
                    onChange={(e) => handleInputChange('founderEmail', e.target.value)}
                    className="w-full px-4 py-2 border border-border-standard rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    placeholder="john@yourbusiness.com"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-blue-600">ℹ️</div>
                  <div className="text-sm text-blue-800">
                    <strong>Privacy Note:</strong> Your information is used only for legal formation documents 
                    and business setup. We never share your data with third parties.
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="border border-border-standard text-text-primary py-3 px-8 rounded-lg font-semibold hover:bg-background-tertiary transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!formData.founderName || !formData.founderEmail}
                  className="bg-accent-primary hover:bg-accent-hover disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-8 rounded-lg font-semibold transition-colors"
                >
                  Next: Choose Plan
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Plan Selection */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text-primary mb-6">Choose Your Plan</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Founder Plan */}
                <div 
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    formData.subscriptionPlan === 'founder'
                      ? 'border-accent-primary bg-accent-primary/5'
                      : 'border-border-standard hover:border-accent-primary/50'
                  }`}
                  onClick={() => handleInputChange('subscriptionPlan', 'founder')}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-text-primary">Founder Plan</h3>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-text-primary">$99</div>
                      <div className="text-sm text-text-secondary">/month</div>
                    </div>
                  </div>
                  
                  <ul className="space-y-2 text-sm text-text-secondary mb-4">
                    <li>• 500 AI messages per month</li>
                    <li>• Unlimited personal projects</li>
                    <li>• AI business mentorship</li>
                    <li>• Claude Code integration</li>
                    <li>• Business document updates</li>
                    <li>• Square payments support</li>
                  </ul>

                  <div className="text-xs text-text-muted">
                    Perfect for solo founders building their first business
                  </div>
                </div>

                {/* Growth Plan - Preview */}
                <div className="border border-border-subtle rounded-lg p-6 opacity-60">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-text-primary">Growth Plan</h3>
                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                      COMING SOON
                    </div>
                  </div>
                  
                  <div className="text-sm text-text-secondary">
                    Advanced features for scaling businesses including multi-business management, 
                    team collaboration, and dedicated business advisor support.
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-green-600">✅</div>
                  <div className="text-sm text-green-800">
                    <strong>What's Included:</strong> $599 formation fee covers all legal paperwork, 
                    state filing, EIN registration, registered agent service, Square banking setup, 
                    and complete business incubator structure.
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="border border-border-standard text-text-primary py-3 px-8 rounded-lg font-semibold hover:bg-background-tertiary transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="bg-accent-primary hover:bg-accent-hover text-white py-3 px-8 rounded-lg font-semibold transition-colors"
                >
                  Next: Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text-primary mb-6">Complete Your Order</h2>
              
              {/* Order Summary */}
              <div className="bg-background-tertiary rounded-lg p-6">
                <h3 className="font-bold text-text-primary mb-4">Order Summary</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Business Formation ({formData.businessType})</span>
                    <span className="font-semibold">$599.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">First Month - {formData.subscriptionPlan === 'founder' ? 'Founder' : 'Growth'} Plan</span>
                    <span className="font-semibold">${formData.subscriptionPlan === 'founder' ? '99' : '199'}.00</span>
                  </div>
                  <div className="border-t border-border-subtle pt-3 flex justify-between font-bold">
                    <span>Total Today</span>
                    <span>${formData.subscriptionPlan === 'founder' ? '698' : '798'}.00</span>
                  </div>
                </div>

                <div className="mt-4 text-xs text-text-muted">
                  After today, you'll be charged ${formData.subscriptionPlan === 'founder' ? '$99' : '$199'} monthly. 
                  Cancel anytime with 30 days notice.
                </div>
              </div>

              {/* Business Details Review */}
              <div className="bg-background-tertiary rounded-lg p-6">
                <h3 className="font-bold text-text-primary mb-4">Business Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-text-secondary">Name:</span>
                    <div className="font-semibold">{formData.businessName}</div>
                  </div>
                  <div>
                    <span className="text-text-secondary">Type:</span>
                    <div className="font-semibold">{formData.businessType}</div>
                  </div>
                  <div>
                    <span className="text-text-secondary">State:</span>
                    <div className="font-semibold">{formData.state}</div>
                  </div>
                  <div>
                    <span className="text-text-secondary">Industry:</span>
                    <div className="font-semibold">{formData.industry}</div>
                  </div>
                </div>
              </div>

              {paymentError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="text-red-800 font-medium">Payment Error</div>
                  <div className="text-red-600 text-sm">{paymentError}</div>
                </div>
              )}

              {/* Square Payment Form */}
              <SquarePaymentForm 
                amount={formData.subscriptionPlan === 'founder' ? 69800 : 79800} // in cents
                description={`Business Formation + ${formData.subscriptionPlan === 'founder' ? 'Founder' : 'Growth'} Plan`}
                businessData={formData}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />

              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="border border-border-standard text-text-primary py-3 px-8 rounded-lg font-semibold hover:bg-background-tertiary transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}
            </>
          )}
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <div className="flex justify-center items-center space-x-8 text-sm text-text-muted">
            <div className="flex items-center space-x-2">
              <span>🔒</span>
              <span>Secure Square Payments</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>⚡</span>
              <span>2-Day Formation</span>  
            </div>
            <div className="flex items-center space-x-2">
              <span>📞</span>
              <span>Expert Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}