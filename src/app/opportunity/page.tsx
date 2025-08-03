import Link from 'next/link'
import { Navigation } from '@/components/Navigation'

export default function OpportunityPage() {
  return (
    <div className="min-h-screen bg-background-primary">
      <Navigation />
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            The AI-Native Business Formation
            <span className="text-accent-primary"> Opportunity</span>
          </h1>
          <p className="text-xl text-text-secondary mb-8 max-w-3xl mx-auto">
            Maverick represents a unique opportunity to transform how businesses are formed and operated, 
            combining AI automation with Square's proven business infrastructure to capture a $50B+ market.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-primary">$50B+</div>
              <div className="text-text-secondary">Total Addressable Market</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-primary">2M+</div>
              <div className="text-text-secondary">New Businesses Annually</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-primary">90%</div>
              <div className="text-text-secondary">Cost Reduction Potential</div>
            </div>
          </div>
        </div>
      </section>

      {/* Market Opportunity */}
      <section id="market-opportunity" className="py-16 px-4 sm:px-6 lg:px-8 bg-background-secondary">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-12">
            Massive Market Opportunity
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background-primary p-8 rounded-xl border border-border-subtle">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">🏢</span>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-4">Business Formation</h3>
              <div className="text-2xl font-bold text-green-600 mb-2">$5B Market</div>
              <p className="text-text-secondary">
                Traditional providers charge $500-$2000+ for basic formation. 
                Maverick delivers superior results for $99 with AI automation.
              </p>
            </div>
            <div className="bg-background-primary p-8 rounded-xl border border-border-subtle">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">⚖️</span>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-4">Legal Services</h3>
              <div className="text-2xl font-bold text-blue-600 mb-2">$20B+ Market</div>
              <p className="text-text-secondary">
                Small businesses spend $20K+ annually on legal services. 
                AI delivers most services at 10% of traditional cost.
              </p>
            </div>
            <div className="bg-background-primary p-8 rounded-xl border border-border-subtle">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">💻</span>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-4">Custom Software</h3>
              <div className="text-2xl font-bold text-purple-600 mb-2">$25B+ Market</div>
              <p className="text-text-secondary">
                Enterprise development costs $100K-$1M+. 
                Maverick delivers production-ready apps for $5K-$50K.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Square Partnership Advantage */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12">
            <div className="flex items-center justify-center mb-6">
              <img 
                src="/design/square-logo.png" 
                alt="Square" 
                className="h-8 mr-4"
              />
              <span className="text-2xl">✕</span>
              <img 
                src="/design/textmark.png" 
                alt="Maverick" 
                className="h-6 ml-4"
              />
            </div>
            <h2 className="text-3xl font-bold text-text-primary text-center mb-4">
              Strategic Square Partnership
            </h2>
            <p className="text-lg text-text-secondary text-center mb-8">
              Exclusive access to Square's 4M+ merchant ecosystem creates immediate distribution 
              and recurring revenue opportunities through integrated business services.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-text-primary mb-2">🎯 Direct Market Access</h4>
                <p className="text-text-secondary">4M+ Square merchants need business formation and custom software</p>
              </div>
              <div>
                <h4 className="font-semibold text-text-primary mb-2">💰 Recurring Revenue</h4>
                <p className="text-text-secondary">Payment processing, banking, and business services integration</p>
              </div>
              <div>
                <h4 className="font-semibold text-text-primary mb-2">🚀 Customer Acquisition</h4>
                <p className="text-text-secondary">Free Square app development creates trust and upsell opportunities</p>
              </div>
              <div>
                <h4 className="font-semibold text-text-primary mb-2">🏗️ Infrastructure</h4>
                <p className="text-text-secondary">Proven payment, banking, and commerce infrastructure at scale</p>
              </div>
            </div>
            <div className="text-center mt-8">
              <Link 
                href="/square-partnership"
                className="inline-flex items-center text-accent-primary hover:text-accent-hover font-medium"
              >
                Explore Square Partnership Details
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Competitive Advantages */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background-secondary">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-12">
            Unfair Competitive Advantages
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-background-primary p-6 rounded-xl border border-border-subtle text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">AI-First Architecture</h3>
              <p className="text-text-secondary text-sm">Proprietary LLM optimization reduces costs by 90% while maintaining enterprise quality</p>
            </div>
            <div className="bg-background-primary p-6 rounded-xl border border-border-subtle text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Learning Network</h3>
              <p className="text-text-secondary text-sm">Each application built strengthens our template library, creating compounding value</p>
            </div>
            <div className="bg-background-primary p-6 rounded-xl border border-border-subtle text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏛️</span>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Square Ecosystem</h3>
              <p className="text-text-secondary text-sm">Exclusive access to 4M+ merchants plus integrated business infrastructure</p>
            </div>
            <div className="bg-background-primary p-6 rounded-xl border border-border-subtle text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔄</span>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Network Effects</h3>
              <p className="text-text-secondary text-sm">Each customer improves our AI models, creating compound advantages over competitors</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Now */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-12">
            Why Now?
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold text-text-primary mb-6">Perfect Market Timing</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">AI Maturity</h4>
                    <p className="text-text-secondary text-sm">LLMs finally reliable enough for production legal/business applications</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">Remote Work Surge</h4>
                    <p className="text-text-secondary text-sm">Entrepreneurship boom as people start location-independent businesses</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">Digital-First Era</h4>
                    <p className="text-text-secondary text-sm">Every business needs software; traditional development too expensive/slow</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">Regulatory Acceptance</h4>
                    <p className="text-text-secondary text-sm">Legal industry embracing technology solutions for efficiency</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl p-8 text-white">
              <h4 className="text-2xl font-bold mb-6">Business Model</h4>
              <div className="space-y-4">
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-lg font-bold">Multi-Revenue Streams</div>
                  <div className="text-blue-100 text-sm">Formation • SaaS • Custom Development</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold">$99-$50K</div>
                    <div className="text-blue-100 text-xs">Revenue per customer</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold">60-85%</div>
                    <div className="text-blue-100 text-xs">Gross margins</div>
                  </div>
                </div>
                <div className="border-t border-white/20 pt-4">
                  <div className="text-sm text-blue-100">
                    • Formation: $99-$499 (40% margins)<br/>
                    • SaaS Platform: $99-$299/mo (85% margins)<br/>
                    • Custom Software: $5K-$50K (60% margins)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Traction & Validation */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background-secondary">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-12">
            Early Validation & Traction
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background-primary p-6 rounded-xl border border-border-subtle text-center">
              <div className="text-3xl font-bold text-accent-primary mb-2">AI-Native Platform</div>
              <p className="text-text-secondary">
                Built from ground up with Claude Code integration, demonstrating 
                the future of AI-assisted business development
              </p>
            </div>
            <div className="bg-background-primary p-6 rounded-xl border border-border-subtle text-center">
              <div className="text-3xl font-bold text-accent-primary mb-2">Square Partnership</div>
              <p className="text-text-secondary">
                Strategic relationship with Square provides immediate market access 
                and proven business infrastructure integration
              </p>
            </div>
            <div className="bg-background-primary p-6 rounded-xl border border-border-subtle text-center">
              <div className="text-3xl font-bold text-accent-primary mb-2">Template Library</div>
              <p className="text-text-secondary">
                Growing repository of business formation templates and application 
                frameworks that improve with each deployment
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Opportunity */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-6">
            Partnership & Investment Opportunity
          </h2>
          <p className="text-xl text-text-secondary mb-8">
            Join us in democratizing entrepreneurship by making business formation and custom software 
            accessible to everyone through AI automation and proven business infrastructure.
          </p>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-background-secondary p-6 rounded-xl border border-border-subtle">
              <h3 className="text-lg font-semibold text-text-primary mb-3">Strategic Partnership</h3>
              <p className="text-text-secondary text-sm">
                Technology licensing, white-label solutions, or integration partnerships 
                to expand market reach and capabilities
              </p>
            </div>
            <div className="bg-background-secondary p-6 rounded-xl border border-border-subtle">
              <h3 className="text-lg font-semibold text-text-primary mb-3">Investment Opportunity</h3>
              <p className="text-text-secondary text-sm">
                Seed and growth funding to accelerate product development, market expansion, 
                and team building in this rapidly growing market
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="mailto:tim@marman.org?subject=Maverick Partnership Opportunity"
              className="bg-accent-primary hover:bg-accent-hover text-text-inverse px-8 py-4 rounded-lg text-lg font-medium transition-colors"
            >
              🤝 Discuss Partnership
            </Link>
            <Link 
              href="mailto:tim@marman.org?subject=Maverick Investment Opportunity"
              className="border border-border-subtle hover:bg-background-secondary text-text-primary px-8 py-4 rounded-lg text-lg font-medium transition-colors"
            >
              💰 Investment Inquiry
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}