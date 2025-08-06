import Link from 'next/link'
import { Navigation } from '@/components/Navigation'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background-primary">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Build software like Lovable, or go further and start a complete business. 
            One platform, two powerful ways to turn ideas into revenue.
          </p>
        </div>

        {/* Two-Product Strategy */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          
          {/* AI Development Platform */}
          <div className="relative">
            <div className="bg-background-secondary rounded-2xl p-8 border border-border-subtle h-full">
              <div className="text-center mb-8">
                <div className="text-4xl mb-4">🤖</div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">AI Development Platform</h2>
                <p className="text-text-secondary">
                  Build software with AI. No business formation required.
                </p>
              </div>

              {/* Pricing Tiers */}
              <div className="space-y-4 mb-8">
                {/* Free */}
                <div className="border border-border-subtle rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-text-primary">Free</h3>
                    <span className="text-2xl font-bold text-text-primary">$0</span>
                  </div>
                  <ul className="text-sm text-text-secondary space-y-1">
                    <li>• 5 AI messages per day</li>
                    <li>• 30 messages per month total</li>
                    <li>• 1 personal project</li>
                    <li>• Basic templates</li>
                  </ul>
                </div>

                {/* Developer */}
                <div className="border-2 border-accent-primary rounded-lg p-4 relative">
                  <div className="absolute -top-3 left-4 bg-accent-primary text-white px-3 py-1 rounded-full text-xs font-semibold">
                    POPULAR
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-text-primary">Developer</h3>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-text-primary">$29</span>
                      <span className="text-text-secondary">/month</span>
                    </div>
                  </div>
                  <ul className="text-sm text-text-secondary space-y-1">
                    <li>• <strong>500 AI messages/month</strong></li>
                    <li>• Unlimited personal projects</li>
                    <li>• 2 collaborators per project</li>
                    <li>• Claude Code integration</li>
                    <li>• GitHub auto-commit</li>
                    <li>• Custom domains</li>
                  </ul>
                </div>

                {/* Team & Scale - Preview */}
                <div className="border border-border-subtle rounded-lg p-4 opacity-75">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-text-primary">Team & Scale Plans</h3>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                      PREVIEW
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Advanced collaboration, unlimited team members, and enterprise features coming soon.
                  </p>
                </div>
              </div>

              <Link
                href="/app"
                className="w-full bg-accent-primary hover:bg-accent-hover text-white py-3 px-6 rounded-lg font-semibold text-center block transition-colors"
              >
                🚀 Start Building
              </Link>
            </div>
          </div>

          {/* Business Formation */}
          <div className="relative">
            <div className="bg-gradient-to-br from-accent-primary to-purple-600 rounded-2xl p-8 text-white h-full relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                PREMIUM
              </div>
              
              <div className="text-center mb-8">
                <div className="text-4xl mb-4">🏢</div>
                <h2 className="text-2xl font-bold mb-2">Complete Business Formation</h2>
                <p className="text-white/90">
                  AI development + legal formation + ongoing business support
                </p>
              </div>

              {/* Formation Package */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold mb-1">$599</div>
                  <div className="text-sm text-white/80">One-time formation fee</div>
                </div>
                
                <ul className="text-sm space-y-2 mb-6">
                  <li>• Business formation (LLC, S-Corp, C-Corp)</li>
                  <li>• EIN registration & state filing</li>
                  <li>• 1 year registered agent service</li>
                  <li>• Square banking account setup</li>
                  <li>• Complete business documentation</li>
                  <li>• Professional project structure</li>
                </ul>

                <div className="border-t border-white/20 pt-4">
                  <div className="font-semibold text-center mb-2">Plus Required Monthly Subscription:</div>
                  
                  {/* Founder Plan */}
                  <div className="bg-white/10 rounded p-3 mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold">Founder Plan</span>
                      <span className="font-bold">$99/month</span>
                    </div>
                    <div className="text-xs text-white/80">
                      Everything in Developer + AI business mentorship
                    </div>
                  </div>

                  {/* Growth Plan - Preview */}
                  <div className="bg-white/5 rounded p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold">Growth & Enterprise</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                        PREVIEW
                      </span>
                    </div>
                    <div className="text-xs text-white/60">
                      Multi-business management and enterprise features
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href="/formation"
                className="w-full bg-white text-accent-primary hover:bg-gray-100 py-3 px-6 rounded-lg font-semibold text-center block transition-colors"
              >
                🚀 Start Your Business
              </Link>
            </div>
          </div>
        </div>

        {/* Comparison Section */}
        <div className="bg-background-secondary rounded-2xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-8">
            Why Choose Maverick?
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left py-4 px-4">Feature</th>
                  <th className="text-center py-4 px-4">Lovable</th>
                  <th className="text-center py-4 px-4">Stripe Atlas</th>
                  <th className="text-center py-4 px-4 bg-accent-primary/10 rounded-t-lg">
                    <div className="font-bold text-accent-primary">Maverick</div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-border-subtle">
                  <td className="py-3 px-4 font-medium">AI Software Development</td>
                  <td className="text-center py-3 px-4">✅</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4 bg-accent-primary/5">✅</td>
                </tr>
                <tr className="border-b border-border-subtle">
                  <td className="py-3 px-4 font-medium">Business Formation</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                  <td className="text-center py-3 px-4 bg-accent-primary/5">✅</td>
                </tr>
                <tr className="border-b border-border-subtle">
                  <td className="py-3 px-4 font-medium">AI Business Mentorship</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4 bg-accent-primary/5">✅</td>
                </tr>
                <tr className="border-b border-border-subtle">
                  <td className="py-3 px-4 font-medium">Claude Code Integration</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4 bg-accent-primary/5">✅</td>
                </tr>
                <tr className="border-b border-border-subtle">
                  <td className="py-3 px-4 font-medium">Square Banking Integration</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">Limited</td>
                  <td className="text-center py-3 px-4 bg-accent-primary/5">✅</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Complete Business Incubator</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4 bg-accent-primary/5">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Processing Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-16">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">💳</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Powered by Square Payments</h3>
              <p className="text-blue-800 text-sm">
                All subscriptions are processed securely through Square Web Payments - the same system 
                we'll integrate into your business. Experience the payment flow firsthand!
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="border border-border-subtle rounded-lg p-6">
              <h3 className="font-semibold text-text-primary mb-2">
                Can I start with AI development and upgrade to business formation later?
              </h3>
              <p className="text-text-secondary text-sm">
                Absolutely! Many users start with our Developer plan to build their software, 
                then upgrade to complete business formation when they're ready to launch officially.
              </p>
            </div>

            <div className="border border-border-subtle rounded-lg p-6">
              <h3 className="font-semibold text-text-primary mb-2">
                What happens if I go over my monthly message limit?
              </h3>
              <p className="text-text-secondary text-sm">
                Additional messages are $0.10 each. However, we'll always notify you before any 
                overage charges and suggest upgrading to a higher plan for better value.
              </p>
            </div>

            <div className="border border-border-subtle rounded-lg p-6">
              <h3 className="font-semibold text-text-primary mb-2">
                How does the business formation process work?
              </h3>
              <p className="text-text-secondary text-sm">
                After payment, we handle all paperwork including state filing, EIN registration, 
                and registered agent setup. You'll also get Square banking integration and our 
                complete business incubator documentation suite.
              </p>
            </div>

            <div className="border border-border-subtle rounded-lg p-6">
              <h3 className="font-semibold text-text-primary mb-2">
                When will Team and Scale plans be available?
              </h3>
              <p className="text-text-secondary text-sm">
                We're launching with our core Developer and Founder plans first. Team collaboration 
                and enterprise features are coming in Q2 2025. Join our Developer plan to get 
                early access when they launch!
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-text-secondary mb-8 max-w-2xl mx-auto">
            Join developers and entrepreneurs who are building the future with AI-powered 
            development and complete business formation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/app"
              className="bg-accent-primary hover:bg-accent-hover text-white py-3 px-8 rounded-lg font-semibold transition-colors"
            >
              🚀 Start Building (Free)
            </Link>
            <Link
              href="/formation"
              className="border-2 border-accent-primary text-accent-primary hover:bg-accent-primary hover:text-white py-3 px-8 rounded-lg font-semibold transition-colors"
            >
              ✈️ Start Your Business
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}