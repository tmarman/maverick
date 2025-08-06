'use client'

import { useState } from 'react'
import { Navigation } from '@/components/Navigation'

export default function Demo() {
  const [currentStep, setCurrentStep] = useState(0)
  const [businessName, setBusinessName] = useState("Brew & Bytes Coffee")
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  
  const demoSteps = [
    {
      title: "💡 Business Idea",
      description: "AI validates your business concept and market opportunity",
      content: "DemoBusinessIdea",
      duration: "30 seconds"
    },
    {
      title: "🏢 Formation",
      description: "Automated LLC filing and legal documentation",
      content: "DemoFormation", 
      duration: "2 minutes"
    },
    {
      title: "🏦 Square Banking",
      description: "Business banking and payment processing setup",
      content: "DemoSquareBanking",
      duration: "5 minutes"
    },
    {
      title: "💻 App Generation", 
      description: "Claude Code builds your custom business application",
      content: "DemoAppGeneration",
      duration: "15 minutes"
    },
    {
      title: "🚀 Go Live",
      description: "Launch and first customer transactions",
      content: "DemoGoLive",
      duration: "5 minutes"
    }
  ]

  const getAIAnalysis = async () => {
    setLoadingAnalysis(true)
    try {
      const response = await fetch('/api/local-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyze-business',
          data: {
            businessIdea: `${businessName}: A coffee shop business focusing on specialty coffee, comfortable workspace, and local community engagement. Target customers include remote workers, students, and coffee enthusiasts.`
          }
        })
      })

      const result = await response.json()
      if (result.success) {
        setAiAnalysis(result.data)
      }
    } catch (error) {
      console.warn('AI analysis failed:', error)
    } finally {
      setLoadingAnalysis(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Demo Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            🎯 Interactive Demo: Coffee Shop Formation
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto mb-6">
            Watch <strong>{businessName}</strong> go from business idea to fully established company. 
            This walkthrough shows exactly how Maverick creates your complete business.
          </p>
          
          {/* Demo Options */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/goose-demo"
              className="px-6 py-3 bg-accent-primary text-text-inverse font-semibold rounded-lg hover:bg-accent-hover transition-colors"
            >
              🤖 Try AI-Powered Demo
            </a>
            <button 
              onClick={() => {/* Keep current demo */}}
              className="px-6 py-3 border border-border-standard text-text-primary font-semibold rounded-lg hover:bg-background-tertiary transition-colors"
            >
              📋 Watch Step-by-Step Guide
            </button>
          </div>
          
          <p className="text-sm text-text-muted mt-4">
            💡 <strong>New:</strong> Chat with AI-powered Goose for real business formation conversations
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-text-secondary">Demo Progress</span>
            <span className="text-sm text-text-secondary">{currentStep + 1} of {demoSteps.length}</span>
          </div>
          <div className="w-full bg-background-secondary rounded-full h-2">
            <div 
              className="bg-accent-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / demoSteps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Demo Steps Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {demoSteps.map((step, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                index === currentStep
                  ? 'bg-accent-primary text-text-inverse'
                  : index < currentStep
                  ? 'bg-green-500 text-white'
                  : 'bg-background-secondary text-text-secondary hover:bg-background-tertiary'
              }`}
            >
              {step.title}
            </button>
          ))}
        </div>

        {/* Current Demo Step */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Step Information */}
          <div>
            <div className="bg-background-secondary rounded-2xl p-8 border border-border-subtle">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-text-primary">
                  {demoSteps[currentStep].title}
                </h2>
                <span className="px-3 py-1 bg-background-tertiary rounded-full text-sm text-text-muted">
                  {demoSteps[currentStep].duration}
                </span>
              </div>
              
              <p className="text-text-secondary mb-6">
                {demoSteps[currentStep].description}
              </p>

              {/* Step-specific content */}
              <div className="space-y-4">
                {currentStep === 0 && <DemoBusinessIdea businessName={businessName} aiAnalysis={aiAnalysis} onAnalyze={getAIAnalysis} loadingAnalysis={loadingAnalysis} />}
                {currentStep === 1 && <DemoFormation businessName={businessName} />}
                {currentStep === 2 && <DemoSquareBanking businessName={businessName} />}
                {currentStep === 3 && <DemoAppGeneration businessName={businessName} />}
                {currentStep === 4 && <DemoGoLive businessName={businessName} />}
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="px-6 py-2 border border-border-standard rounded-lg text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-background-tertiary transition-colors"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setCurrentStep(Math.min(demoSteps.length - 1, currentStep + 1))}
                  disabled={currentStep === demoSteps.length - 1}
                  className="px-6 py-2 bg-accent-primary text-text-inverse rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-hover transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Visualization */}
          <div className="sticky top-8">
            <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
              <div className="mb-4">
                <div className="text-lg font-semibold text-text-primary mb-2">Live Visualization</div>
                <div className="text-sm text-text-secondary">
                  Real-time demo of {demoSteps[currentStep].title.toLowerCase()}
                </div>
              </div>
              
              {/* Step-specific visualizations */}
              <div className="aspect-video bg-background-tertiary rounded-lg p-4 border border-border-subtle">
                {currentStep === 0 && <BusinessIdeaViz />}
                {currentStep === 1 && <FormationViz />}
                {currentStep === 2 && <SquareBankingViz />}
                {currentStep === 3 && <AppGenerationViz />}
                {currentStep === 4 && <GoLiveViz />}
              </div>
            </div>
          </div>
        </div>

        {/* Demo CTA */}
        <div className="mt-16 text-center bg-background-secondary rounded-2xl p-8 border border-border-subtle">
          <h3 className="text-2xl font-bold text-text-primary mb-4">
            Ready to Launch Your Business?
          </h3>
          <p className="text-text-secondary mb-6">
            This demo shows exactly what happens when you use Maverick. Your business will be 
            fully formed with all the tools you need to start operating and generating revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-accent-primary text-text-inverse font-semibold rounded-lg hover:bg-accent-hover transition-colors">
              🚀 Start My Business
            </button>
            <button className="px-8 py-4 border border-border-standard text-text-primary font-semibold rounded-lg hover:bg-background-tertiary transition-colors">
              📞 Schedule Call with Square Team
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Demo Step Components
function DemoBusinessIdea({ businessName, aiAnalysis, onAnalyze, loadingAnalysis }: { 
  businessName: string
  aiAnalysis: any
  onAnalyze: () => void
  loadingAnalysis: boolean
}) {
  return (
    <div className="space-y-4">
      {/* AI Analysis Toggle */}
      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div>
          <div className="text-sm font-semibold text-blue-800">🤖 AI-Powered Analysis</div>
          <div className="text-xs text-blue-600">Get real AI insights for this business idea</div>
        </div>
        <button
          onClick={onAnalyze}
          disabled={loadingAnalysis}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loadingAnalysis ? 'Analyzing...' : aiAnalysis ? 'Refresh' : 'Analyze'}
        </button>
      </div>

      {/* Market Analysis */}
      <div className="bg-background-tertiary rounded-lg p-4 border border-border-subtle">
        <h4 className="font-semibold text-text-primary mb-2">🎯 Market Analysis</h4>
        {aiAnalysis ? (
          <div className="space-y-2 text-sm text-text-secondary">
            <div><strong>Market Size:</strong> {aiAnalysis.marketSize}</div>
            <div><strong>Competition:</strong> {aiAnalysis.competition}</div>
            <div><strong>Target Customers:</strong> {aiAnalysis.targetDemographic}</div>
            <div><strong>Profit Margins:</strong> {aiAnalysis.profitMargins}</div>
          </div>
        ) : (
          <ul className="text-sm text-text-secondary space-y-1">
            <li>✓ Coffee shop market size: $45B annually</li>
            <li>✓ Local competition: 3 competitors within 2 miles</li>
            <li>✓ Target demographic: Tech workers, students</li>
            <li>✓ Recommended location: Near university/offices</li>
          </ul>
        )}
      </div>
      
      {/* Revenue Projection */}
      <div className="bg-background-tertiary rounded-lg p-4 border border-border-subtle">
        <h4 className="font-semibold text-text-primary mb-2">💰 Revenue Projection</h4>
        <div className="text-sm text-text-secondary">
          {aiAnalysis ? (
            <div className="space-y-1">
              <div><strong>First Year:</strong> {aiAnalysis.revenueProjection}</div>
              <div><strong>Break-even:</strong> {aiAnalysis.breakEvenTime}</div>
            </div>
          ) : (
            <div>
              <div>Year 1: $180,000 - $220,000</div>
              <div>Break-even: Month 8-10</div>
              <div>ROI: 25-35% by year 2</div>
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      {aiAnalysis?.recommendations && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">💡 AI Recommendations</h4>
          <ul className="text-sm text-green-700 space-y-1">
            {aiAnalysis.recommendations.map((rec: string, index: number) => (
              <li key={index}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function DemoFormation({ businessName }: { businessName: string }) {
  return (
    <div className="space-y-4">
      <div className="bg-background-tertiary rounded-lg p-4 border border-border-subtle">
        <h4 className="font-semibold text-text-primary mb-2">📋 Legal Documents Generated</h4>
        <ul className="text-sm text-text-secondary space-y-1">
          <li>✓ Articles of Organization (Texas LLC)</li>
          <li>✓ Operating Agreement</li>
          <li>✓ EIN Application (Federal Tax ID)</li>
          <li>✓ Business License Application</li>
          <li>✓ Food Service Permit Application</li>
        </ul>
      </div>
      <div className="bg-background-tertiary rounded-lg p-4 border border-border-subtle">
        <h4 className="font-semibold text-text-primary mb-2">⏱️ Filing Status</h4>
        <div className="text-sm text-text-secondary">
          <div>Texas Secretary of State: Filed ✓</div>
          <div>IRS EIN: Approved ✓</div>
          <div>Business License: Pending (2-3 days)</div>
        </div>
      </div>
    </div>
  )
}

function DemoSquareBanking({ businessName }: { businessName: string }) {
  return (
    <div className="space-y-4">
      <div className="bg-background-tertiary rounded-lg p-4 border border-border-subtle">
        <h4 className="font-semibold text-text-primary mb-2">🏦 Square Banking Setup</h4>
        <ul className="text-sm text-text-secondary space-y-1">
          <li>✓ Business checking account opened</li>
          <li>✓ Square debit card ordered</li>
          <li>✓ Payment processing approved</li>
          <li>✓ POS system configured</li>
          <li>✓ Online payments enabled</li>
        </ul>
      </div>
      <div className="bg-background-tertiary rounded-lg p-4 border border-border-subtle">
        <h4 className="font-semibold text-text-primary mb-2">💳 Payment Processing</h4>
        <div className="text-sm text-text-secondary">
          <div>Card processing: 2.6% + 10¢</div>
          <div>Online payments: 2.9% + 30¢</div>
          <div>ACH transfers: 1% (min $1)</div>
          <div>Next-day deposits included</div>
        </div>
      </div>
    </div>
  )
}

function DemoAppGeneration({ businessName }: { businessName: string }) {
  return (
    <div className="space-y-4">
      <div className="bg-background-tertiary rounded-lg p-4 border border-border-subtle">
        <h4 className="font-semibold text-text-primary mb-2">💻 Generated Applications</h4>
        <ul className="text-sm text-text-secondary space-y-1">
          <li>✓ Customer-facing website with online ordering</li>
          <li>✓ Point-of-sale system for in-store orders</li>
          <li>✓ Admin dashboard with analytics</li>
          <li>✓ Mobile app for order management</li>
          <li>✓ Loyalty program integration</li>
        </ul>
      </div>
      <div className="bg-background-tertiary rounded-lg p-4 border border-border-subtle">
        <h4 className="font-semibold text-text-primary mb-2">🛠️ Technical Stack</h4>
        <div className="text-sm text-text-secondary">
          <div>Frontend: Next.js + React</div>
          <div>Backend: Node.js + PostgreSQL</div>
          <div>Payments: Square Web SDK</div>
          <div>Hosting: Vercel + Supabase</div>
        </div>
      </div>
    </div>
  )
}

function DemoGoLive({ businessName }: { businessName: string }) {
  return (
    <div className="space-y-4">
      <div className="bg-background-tertiary rounded-lg p-4 border border-border-subtle">
        <h4 className="font-semibold text-text-primary mb-2">🚀 Launch Checklist</h4>
        <ul className="text-sm text-text-secondary space-y-1">
          <li>✓ Domain configured: brewbytescoffee.com</li>
          <li>✓ SSL certificate installed</li>
          <li>✓ Payment flow tested</li>
          <li>✓ Square POS system activated</li>
          <li>✓ Staff training completed</li>
        </ul>
      </div>
      <div className="bg-background-tertiary rounded-lg p-4 border border-border-subtle">
        <h4 className="font-semibold text-text-primary mb-2">💰 First 48 Hours</h4>
        <div className="text-sm text-text-secondary">
          <div>Online orders: 47 ($1,290)</div>
          <div>In-store sales: 89 ($1,160)</div>
          <div>Total revenue: <strong>$2,450</strong></div>
          <div>Square fees: $71.50</div>
        </div>
      </div>
    </div>
  )
}

// Interactive Visualization Components
function BusinessIdeaViz() {
  return (
    <div className="h-full flex flex-col justify-center">
      <div className="grid grid-cols-2 gap-4 h-full">
        {/* Market Analysis Chart */}
        <div className="bg-background-primary rounded-lg p-3 border border-border-subtle">
          <h4 className="text-sm font-semibold text-text-primary mb-2">📊 Market Analysis</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Market Size</span>
              <span className="text-xs font-bold text-green-500">$45B</span>
            </div>
            <div className="w-full bg-background-secondary rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full w-3/4"></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Competition</span>
              <span className="text-xs font-bold text-yellow-500">Low</span>
            </div>
            <div className="w-full bg-background-secondary rounded-full h-2">
              <div className="bg-yellow-500 h-2 rounded-full w-1/3"></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Demand</span>
              <span className="text-xs font-bold text-green-500">High</span>
            </div>
            <div className="w-full bg-background-secondary rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full w-5/6"></div>
            </div>
          </div>
        </div>
        
        {/* Revenue Projection */}
        <div className="bg-background-primary rounded-lg p-3 border border-border-subtle">
          <h4 className="text-sm font-semibold text-text-primary mb-2">💰 Revenue Forecast</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-text-secondary">Month 1</span>
              <span className="text-text-primary">$12K</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Month 6</span>
              <span className="text-text-primary">$18K</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Year 1</span>
              <span className="font-bold text-accent-primary">$200K</span>
            </div>
            <div className="mt-2 pt-2 border-t border-border-subtle">
              <div className="flex justify-between">
                <span className="text-text-secondary">Break-even</span>
                <span className="text-green-500 font-bold">Month 8</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FormationViz() {
  return (
    <div className="h-full flex flex-col justify-center">
      <div className="space-y-3">
        {/* Legal Document Progress */}
        <div className="bg-background-primary rounded-lg p-3 border border-border-subtle">
          <h4 className="text-sm font-semibold text-text-primary mb-3">📋 Document Generation</h4>
          <div className="space-y-2">
            {[
              { doc: 'Articles of Organization', status: 'complete', time: '2 min' },
              { doc: 'Operating Agreement', status: 'complete', time: '1 min' },
              { doc: 'EIN Application', status: 'in-progress', time: '30 sec' },
              { doc: 'Business License', status: 'pending', time: '45 sec' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    item.status === 'complete' ? 'bg-green-500' :
                    item.status === 'in-progress' ? 'bg-yellow-500 animate-pulse' :
                    'bg-border-standard'
                  }`}></div>
                  <span className="text-xs text-text-secondary">{item.doc}</span>
                </div>
                <span className="text-xs text-text-muted">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Filing Status */}
        <div className="bg-background-primary rounded-lg p-3 border border-border-subtle">
          <h4 className="text-sm font-semibold text-text-primary mb-2">⏱️ Filing Progress</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Texas Secretary of State</span>
              <span className="text-green-500">✓ Filed</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">IRS EIN Assignment</span>
              <span className="text-yellow-500">⟳ Processing</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Business License</span>
              <span className="text-text-muted">○ Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SquareBankingViz() {
  return (
    <div className="h-full flex flex-col justify-center">
      <div className="space-y-3">
        {/* Banking Setup Interface */}
        <div className="bg-background-primary rounded-lg p-3 border border-border-subtle">
          <h4 className="text-sm font-semibold text-text-primary mb-3">🏦 Square Banking Setup</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-background-secondary rounded text-xs">
              <span className="text-text-secondary">Business Checking</span>
              <span className="text-green-500 font-bold">$0.00</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-background-secondary rounded text-xs">
              <span className="text-text-secondary">Payment Processing</span>
              <span className="text-accent-primary">2.9% + 30¢</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-background-secondary rounded text-xs">
              <span className="text-text-secondary">Next-day Deposits</span>
              <span className="text-green-500">✓ Enabled</span>
            </div>
          </div>
        </div>
        
        {/* Payment Methods */}
        <div className="bg-background-primary rounded-lg p-3 border border-border-subtle">
          <h4 className="text-sm font-semibold text-text-primary mb-2">💳 Payment Methods</h4>
          <div className="grid grid-cols-3 gap-2">
            {['Visa', 'MC', 'AMEX'].map((card, index) => (
              <div key={index} className="bg-accent-primary text-white text-center py-1 rounded text-xs font-bold">
                {card}
              </div>
            ))}
            <div className="bg-background-secondary text-center py-1 rounded text-xs text-text-secondary">
              Apple Pay
            </div>
            <div className="bg-background-secondary text-center py-1 rounded text-xs text-text-secondary">
              Google Pay
            </div>
            <div className="bg-background-secondary text-center py-1 rounded text-xs text-text-secondary">
              ACH
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AppGenerationViz() {
  return (
    <div className="h-full flex flex-col justify-center">
      <div className="space-y-3">
        {/* Code Generation Terminal */}
        <div className="bg-gray-900 rounded-lg p-3 border border-border-subtle">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-400 ml-2">Claude Code IDE</span>
          </div>
          <div className="space-y-1 text-xs font-mono">
            <div className="text-green-400">✓ Generating Next.js app structure...</div>
            <div className="text-green-400">✓ Creating Square payment integration...</div>
            <div className="text-yellow-400 animate-pulse">⟳ Building responsive UI components...</div>
            <div className="text-gray-500">○ Setting up database schemas...</div>
            <div className="text-gray-500">○ Deploying to production...</div>
          </div>
        </div>
        
        {/* Generated Files */}
        <div className="bg-background-primary rounded-lg p-3 border border-border-subtle">
          <h4 className="text-sm font-semibold text-text-primary mb-2">📁 Generated Files</h4>
          <div className="space-y-1 text-xs">
            {[
              '📄 src/app/page.tsx',
              '💳 src/lib/square-payments.ts', 
              '🎨 src/components/OrderForm.tsx',
              '📱 src/app/admin/dashboard.tsx',
              '🔧 prisma/schema.prisma'
            ].map((file, index) => (
              <div key={index} className="flex items-center text-text-secondary">
                <div className="w-1 h-1 bg-accent-primary rounded-full mr-2"></div>
                {file}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function GoLiveViz() {
  return (
    <div className="h-full flex flex-col justify-center">
      <div className="space-y-3">
        {/* Live Revenue Dashboard */}
        <div className="bg-background-primary rounded-lg p-3 border border-border-subtle">
          <h4 className="text-sm font-semibold text-text-primary mb-3">📊 Live Revenue Dashboard</h4>
          <div className="text-center mb-3">
            <div className="text-2xl font-bold text-accent-primary">$2,450</div>
            <div className="text-xs text-text-secondary">Total Revenue (48 hours)</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-secondary">Online Orders</span>
              <span className="text-text-primary font-bold">47 ($1,290)</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-secondary">In-Store Sales</span>
              <span className="text-text-primary font-bold">89 ($1,160)</span>
            </div>
            <div className="w-full bg-background-secondary rounded-full h-2">
              <div className="bg-accent-primary h-2 rounded-full w-full animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Live Transactions */}
        <div className="bg-background-primary rounded-lg p-3 border border-border-subtle">
          <h4 className="text-sm font-semibold text-text-primary mb-2">💸 Recent Transactions</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Large Latte + Muffin</span>
              <span className="text-green-500 font-bold">+$8.50</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Cappuccino (Online)</span>
              <span className="text-green-500 font-bold">+$4.25</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Cold Brew x2</span>
              <span className="text-green-500 font-bold animate-pulse">+$12.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}