'use client'

import { useState } from 'react'
import { Navigation } from '@/components/Navigation'

type WizardStep = 'business-idea' | 'business-details' | 'legal-structure' | 'square-setup' | 'app-generation' | 'review-launch'

export default function FormationWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('business-idea')
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    industry: '',
    description: '',
    location: '',
    legalStructure: '',
    state: '',
    squareServices: [] as string[],
    appType: '',
    features: [] as string[]
  })

  const steps: { id: WizardStep; title: string; description: string }[] = [
    { id: 'business-idea', title: '💡 Business Idea', description: 'Tell us about your business concept' },
    { id: 'business-details', title: '📋 Business Details', description: 'Basic information about your business' },
    { id: 'legal-structure', title: '🏢 Legal Structure', description: 'Choose your business formation type' },
    { id: 'square-setup', title: '💳 Square Integration', description: 'Configure Square services' },
    { id: 'app-generation', title: '💻 App Generation', description: 'Define your custom application' },
    { id: 'review-launch', title: '🚀 Review & Launch', description: 'Final review and launch your business' }
  ]

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id)
    }
  }

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id)
    }
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Business Formation Wizard</h1>
          <p className="text-text-secondary">Create your complete business with Maverick's guided process</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-text-secondary">Progress</span>
            <span className="text-sm text-text-secondary">{currentStepIndex + 1} of {steps.length}</span>
          </div>
          <div className="w-full bg-background-secondary rounded-full h-3">
            <div 
              className="bg-accent-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Step Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                index === currentStepIndex
                  ? 'bg-accent-primary text-text-inverse'
                  : index < currentStepIndex
                  ? 'bg-green-500 text-white'
                  : 'bg-background-secondary text-text-secondary hover:bg-background-tertiary'
              }`}
            >
              {step.title}
            </button>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-background-secondary rounded-2xl p-8 border border-border-subtle mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              {steps[currentStepIndex].title}
            </h2>
            <p className="text-text-secondary">
              {steps[currentStepIndex].description}
            </p>
          </div>

          <div className="space-y-6">
            {currentStep === 'business-idea' && (
              <BusinessIdeaStep formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 'business-details' && (
              <BusinessDetailsStep formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 'legal-structure' && (
              <LegalStructureStep formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 'square-setup' && (
              <SquareSetupStep formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 'app-generation' && (
              <AppGenerationStep formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 'review-launch' && (
              <ReviewLaunchStep formData={formData} />
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStepIndex === 0}
            className="px-6 py-3 border border-border-standard rounded-lg text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-background-secondary transition-colors"
          >
            ← Previous
          </button>
          
          {currentStepIndex === steps.length - 1 ? (
            <button className="px-8 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors">
              🚀 Launch Business
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="px-6 py-3 bg-accent-primary text-text-inverse font-semibold rounded-lg hover:bg-accent-hover transition-colors"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function BusinessIdeaStep({ formData, updateFormData }: { formData: any; updateFormData: (updates: any) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          What's your business idea?
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="Describe your business concept, target customers, and what problem you're solving..."
          className="w-full px-4 py-3 bg-background-primary border border-border-standard rounded-lg text-text-primary placeholder-text-muted focus:ring-2 focus:ring-accent-primary focus:border-transparent"
          rows={4}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Industry Category
        </label>
        <select
          value={formData.industry}
          onChange={(e) => updateFormData({ industry: e.target.value })}
          className="w-full px-4 py-3 bg-background-primary border border-border-standard rounded-lg text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-transparent"
        >
          <option value="">Select an industry</option>
          <option value="food-beverage">Food & Beverage</option>
          <option value="retail">Retail & E-commerce</option>
          <option value="services">Professional Services</option>
          <option value="health-wellness">Health & Wellness</option>
          <option value="technology">Technology & Software</option>
          <option value="education">Education & Training</option>
          <option value="entertainment">Entertainment & Events</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="bg-background-tertiary rounded-lg p-4 border border-border-subtle">
        <h4 className="font-semibold text-text-primary mb-2">💡 AI Validation Preview</h4>
        <p className="text-sm text-text-secondary">
          Once you complete this step, our AI will analyze your business idea for:
        </p>
        <ul className="text-sm text-text-secondary mt-2 space-y-1">
          <li>• Market size and opportunity assessment</li>
          <li>• Competitive landscape analysis</li>
          <li>• Revenue model recommendations</li>
          <li>• Square integration opportunities</li>
        </ul>
      </div>
    </div>
  )
}

function BusinessDetailsStep({ formData, updateFormData }: { formData: any; updateFormData: (updates: any) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Business Name
        </label>
        <input
          type="text"
          value={formData.businessName}
          onChange={(e) => updateFormData({ businessName: e.target.value })}
          placeholder="Enter your business name"
          className="w-full px-4 py-3 bg-background-primary border border-border-standard rounded-lg text-text-primary placeholder-text-muted focus:ring-2 focus:ring-accent-primary focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Business Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { value: 'online', label: 'Online Business', desc: 'E-commerce, SaaS, digital services' },
            { value: 'physical', label: 'Physical Location', desc: 'Retail store, restaurant, office' },
            { value: 'hybrid', label: 'Hybrid', desc: 'Both online and physical presence' },
            { value: 'service', label: 'Service-Based', desc: 'Consulting, freelancing, professional services' }
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => updateFormData({ businessType: type.value })}
              className={`p-4 rounded-lg border text-left transition-colors ${
                formData.businessType === type.value
                  ? 'border-accent-primary bg-accent-primary bg-opacity-10'
                  : 'border-border-standard hover:border-border-subtle'
              }`}
            >
              <div className="font-medium text-text-primary">{type.label}</div>
              <div className="text-sm text-text-secondary">{type.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Business Location
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => updateFormData({ location: e.target.value })}
          placeholder="City, State (e.g., Austin, TX)"
          className="w-full px-4 py-3 bg-background-primary border border-border-standard rounded-lg text-text-primary placeholder-text-muted focus:ring-2 focus:ring-accent-primary focus:border-transparent"
        />
      </div>
    </div>
  )
}

function LegalStructureStep({ formData, updateFormData }: { formData: any; updateFormData: (updates: any) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-4">
          Choose Your Legal Structure
        </label>
        <div className="space-y-4">
          {[
            {
              value: 'llc',
              title: 'Limited Liability Company (LLC)',
              description: 'Most popular for small businesses. Flexible structure with personal liability protection.',
              pros: ['Personal asset protection', 'Tax flexibility', 'Simple management'],
              cost: '$299'
            },
            {
              value: 'corp',
              title: 'C-Corporation',
              description: 'Best for businesses seeking investment or planning to go public.',
              pros: ['Unlimited growth potential', 'Easy to raise capital', 'Corporate tax benefits'],
              cost: '$499'
            },
            {
              value: 's-corp',
              title: 'S-Corporation',
              description: 'Good for small businesses wanting to avoid double taxation.',
              pros: ['Pass-through taxation', 'Personal liability protection', 'Easy ownership transfer'],
              cost: '$399'
            }
          ].map((structure) => (
            <button
              key={structure.value}
              onClick={() => updateFormData({ legalStructure: structure.value })}
              className={`w-full p-6 rounded-lg border text-left transition-colors ${
                formData.legalStructure === structure.value
                  ? 'border-accent-primary bg-accent-primary bg-opacity-10'
                  : 'border-border-standard hover:border-border-subtle'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-text-primary">{structure.title}</h4>
                <span className="px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-full">
                  {structure.cost}
                </span>
              </div>
              <p className="text-text-secondary text-sm mb-3">{structure.description}</p>
              <div className="flex flex-wrap gap-2">
                {structure.pros.map((pro, index) => (
                  <span key={index} className="px-2 py-1 bg-background-tertiary text-text-secondary text-xs rounded">
                    ✓ {pro}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          State of Incorporation
        </label>
        <select
          value={formData.state}
          onChange={(e) => updateFormData({ state: e.target.value })}
          className="w-full px-4 py-3 bg-background-primary border border-border-standard rounded-lg text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-transparent"
        >
          <option value="">Select a state</option>
          <option value="DE">Delaware (Most Popular)</option>
          <option value="TX">Texas</option>
          <option value="CA">California</option>
          <option value="NY">New York</option>
          <option value="FL">Florida</option>
          <option value="other">Other State</option>
        </select>
      </div>
    </div>
  )
}

function SquareSetupStep({ formData, updateFormData }: { formData: any; updateFormData: (updates: any) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold text-text-primary mb-4">Select Square Services</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              id: 'payments',
              title: 'Payment Processing',
              description: 'Accept credit cards, debit cards, and digital wallets',
              fee: '2.9% + 30¢ per transaction',
              required: true
            },
            {
              id: 'banking',
              title: 'Business Banking',
              description: 'Free business checking account with instant deposits',
              fee: 'Free',
              required: false
            },
            {
              id: 'pos',
              title: 'Point of Sale',
              description: 'In-person sales, inventory management, staff tools',
              fee: 'Free software + hardware',
              required: false
            },
            {
              id: 'marketing',
              title: 'Marketing & Loyalty',
              description: 'Customer engagement, email campaigns, loyalty programs',
              fee: 'Starting at $25/month',
              required: false
            },
            {
              id: 'payroll',
              title: 'Payroll & Team',
              description: 'Employee management, scheduling, and payroll processing',
              fee: '$35/month + $5/employee',
              required: false
            },
            {
              id: 'analytics',
              title: 'Analytics & Reports',
              description: 'Business insights, sales reports, and performance tracking',
              fee: 'Free with payments',
              required: false
            }
          ].map((service) => (
            <div
              key={service.id}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                formData.squareServices.includes(service.id) || service.required
                  ? 'border-accent-primary bg-accent-primary bg-opacity-10'
                  : 'border-border-standard hover:border-border-subtle'
              }`}
              onClick={() => {
                if (!service.required) {
                  const services = formData.squareServices.includes(service.id)
                    ? formData.squareServices.filter((s: string) => s !== service.id)
                    : [...formData.squareServices, service.id]
                  updateFormData({ squareServices: services })
                }
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-medium text-text-primary">{service.title}</h5>
                {service.required ? (
                  <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded">Required</span>
                ) : (
                  <div className={`w-4 h-4 rounded border-2 ${
                    formData.squareServices.includes(service.id)
                      ? 'bg-accent-primary border-accent-primary'
                      : 'border-border-standard'
                  }`}>
                    {formData.squareServices.includes(service.id) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm text-text-secondary mb-2">{service.description}</p>
              <div className="text-sm font-medium text-accent-primary">{service.fee}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-background-tertiary rounded-lg p-4 border border-border-subtle">
        <h4 className="font-semibold text-text-primary mb-2">🏦 Square Banking Benefits</h4>
        <ul className="text-sm text-text-secondary space-y-1">
          <li>• No monthly fees or minimum balance requirements</li>
          <li>• Instant access to Square payment deposits</li>
          <li>• Free business debit card</li>
          <li>• Integrated financial reporting</li>
        </ul>
      </div>
    </div>
  )
}

function AppGenerationStep({ formData, updateFormData }: { formData: any; updateFormData: (updates: any) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-4">
          What type of application do you need?
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              value: 'website',
              title: '🌐 Business Website',
              description: 'Professional website with Square payment integration'
            },
            {
              value: 'ecommerce',
              title: '🛒 E-commerce Store',
              description: 'Online store with product catalog and checkout'
            },
            {
              value: 'booking',
              title: '📅 Booking System',
              description: 'Appointment scheduling with payment processing'
            },
            {
              value: 'saas',
              title: '💼 SaaS Platform',
              description: 'Subscription-based software application'
            },
            {
              value: 'marketplace',
              title: '🏪 Marketplace',
              description: 'Multi-vendor platform with commission handling'
            },
            {
              value: 'custom',
              title: '⚙️ Custom Application',
              description: 'Tailored solution for your specific needs'
            }
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => updateFormData({ appType: type.value })}
              className={`p-4 rounded-lg border text-left transition-colors ${
                formData.appType === type.value
                  ? 'border-accent-primary bg-accent-primary bg-opacity-10'
                  : 'border-border-standard hover:border-border-subtle'
              }`}
            >
              <h5 className="font-medium text-text-primary mb-1">{type.title}</h5>
              <p className="text-sm text-text-secondary">{type.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-4">
          Essential Features
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'User Authentication',
            'Payment Processing',
            'Admin Dashboard',
            'Customer Portal',
            'Mobile Responsive',
            'Email Notifications',
            'Analytics & Reports',
            'Inventory Management',
            'Order Management',
            'Customer Support Chat',
            'SEO Optimization',
            'API Integration'
          ].map((feature) => (
            <label key={feature} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.features.includes(feature)}
                onChange={(e) => {
                  const features = e.target.checked
                    ? [...formData.features, feature]
                    : formData.features.filter((f: string) => f !== feature)
                  updateFormData({ features })
                }}
                className="rounded border-border-standard text-accent-primary focus:ring-accent-primary"
              />
              <span className="text-text-primary">{feature}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-background-tertiary rounded-lg p-4 border border-border-subtle">
        <h4 className="font-semibold text-text-primary mb-2">🤖 Claude Code Generation</h4>
        <p className="text-sm text-text-secondary">
          Our AI will generate a complete, production-ready application based on your specifications:
        </p>
        <ul className="text-sm text-text-secondary mt-2 space-y-1">
          <li>• Next.js 14 with TypeScript and Tailwind CSS</li>
          <li>• Fully integrated Square payment processing</li>
          <li>• Responsive design optimized for all devices</li>
          <li>• Production deployment configuration</li>
          <li>• Complete documentation and setup guide</li>
        </ul>
      </div>
    </div>
  )
}

function ReviewLaunchStep({ formData }: { formData: any }) {
  const estimatedCost = () => {
    let cost = 0
    if (formData.legalStructure === 'llc') cost += 299
    if (formData.legalStructure === 'corp') cost += 499
    if (formData.legalStructure === 's-corp') cost += 399
    return cost
  }

  return (
    <div className="space-y-6">
      <div className="bg-background-tertiary rounded-lg p-6 border border-border-subtle">
        <h4 className="font-semibold text-text-primary mb-4">📋 Business Formation Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-text-primary mb-2">Business Information</h5>
            <ul className="text-sm text-text-secondary space-y-1">
              <li><strong>Name:</strong> {formData.businessName || 'Not specified'}</li>
              <li><strong>Type:</strong> {formData.businessType || 'Not specified'}</li>
              <li><strong>Industry:</strong> {formData.industry || 'Not specified'}</li>
              <li><strong>Location:</strong> {formData.location || 'Not specified'}</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-text-primary mb-2">Legal Structure</h5>
            <ul className="text-sm text-text-secondary space-y-1">
              <li><strong>Structure:</strong> {formData.legalStructure?.toUpperCase() || 'Not selected'}</li>
              <li><strong>State:</strong> {formData.state || 'Not selected'}</li>
              <li><strong>Formation Cost:</strong> ${estimatedCost()}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-background-tertiary rounded-lg p-6 border border-border-subtle">
        <h4 className="font-semibold text-text-primary mb-4">💳 Square Services</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-text-secondary">Payment Processing (Required)</span>
          </div>
          {formData.squareServices.map((service: string) => (
            <div key={service} className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-accent-primary rounded-full"></div>
              <span className="text-text-secondary capitalize">{service.replace('-', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-background-tertiary rounded-lg p-6 border border-border-subtle">
        <h4 className="font-semibold text-text-primary mb-4">💻 Application Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-text-primary mb-2">App Type</h5>
            <p className="text-text-secondary">{formData.appType || 'Not selected'}</p>
          </div>
          <div>
            <h5 className="font-medium text-text-primary mb-2">Features ({formData.features.length})</h5>
            <div className="flex flex-wrap gap-1">
              {formData.features.slice(0, 6).map((feature: string, index: number) => (
                <span key={index} className="px-2 py-1 bg-background-primary text-text-secondary text-xs rounded">
                  {feature}
                </span>
              ))}
              {formData.features.length > 6 && (
                <span className="px-2 py-1 bg-background-primary text-text-secondary text-xs rounded">
                  +{formData.features.length - 6} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h4 className="font-semibold text-green-800 mb-4">🚀 Ready to Create Your Business!</h4>
        <div className="text-sm text-green-700 space-y-2">
          <p><strong>What happens next:</strong></p>
          <ul className="ml-4 space-y-1">
            <li>• Legal documents generated and filed with your state</li>
            <li>• Square banking and payment processing setup</li>
            <li>• Custom application generated by Claude Code</li>
            <li>• Complete business deployed and ready to operate</li>
          </ul>
          <p><strong>Formation Cost:</strong> ${estimatedCost()} + Square processing fees (2.9% + 30¢ per transaction)</p>
          <p><strong>You'll receive:</strong> Complete legal business entity, banking, custom software, and all tools needed to start operations</p>
        </div>
      </div>
    </div>
  )
}