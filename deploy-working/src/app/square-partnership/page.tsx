import { Navigation } from '@/components/Navigation'
import Link from 'next/link'

export default function SquarePartnershipPage() {
  return (
    <div className="min-h-screen bg-background-primary">
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-black to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Why We Chose Square
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Maverick's strategic partnership with Square creates the complete business formation 
              ecosystem, from legal entity to payment processing to custom software—all in one platform.
            </p>
            <div className="flex justify-center space-x-8 text-center">
              <div>
                <div className="text-3xl font-bold">2M+</div>
                <div className="text-gray-300">New Businesses/Year</div>
              </div>
              <div>
                <div className="text-3xl font-bold">$50B+</div>
                <div className="text-gray-300">Addressable Market</div>
              </div>
              <div>
                <div className="text-3xl font-bold">100%</div>
                <div className="text-gray-300">Square Integration</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Strategic Value for Square */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-text-primary mb-8 text-center">Strategic Value for Square</h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold text-text-primary mb-6">Upstream Customer Acquisition</h3>
              <p className="text-text-secondary mb-6">
                Traditional business formation services create businesses but don't ensure they become Square customers. 
                Maverick changes this by making Square integration the default choice for all new businesses we form.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <span className="font-semibold text-text-primary">Pre-qualified leads:</span>
                    <span className="text-text-secondary"> Every Maverick customer has revenue intent and legal business structure</span>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <span className="font-semibold text-text-primary">Higher conversion:</span>
                    <span className="text-text-secondary"> Integrated onboarding increases Square adoption by 10x vs. cold outreach</span>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <span className="font-semibold text-text-primary">Faster time-to-revenue:</span>
                    <span className="text-text-secondary"> Businesses start processing payments within days of formation</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-black rounded-xl p-8 text-white">
              <h4 className="text-xl font-semibold mb-6 flex items-center">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3">
                  <div className="w-4 h-4 bg-black rounded-sm"></div>
                </div>
                The Square Advantage
              </h4>
              <div className="space-y-4 text-sm">
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="font-semibold">Ecosystem Completeness</div>
                  <div className="text-gray-300">Only Square offers the full stack: payments, banking, POS, e-commerce, payroll, and capital</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="font-semibold">Developer Experience</div>
                  <div className="text-gray-300">Best-in-class APIs and documentation make integration seamless for our AI-generated applications</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="font-semibold">SMB Focus</div>
                  <div className="text-gray-300">Square's SMB-first approach perfectly aligns with our new business formation target market</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Business Formation Funnel */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-text-primary mb-12 text-center">The Complete Business Formation Funnel</h2>
          
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Legal Formation</h3>
              <p className="text-text-secondary text-sm">LLC/Corp creation, EIN, operating agreements</p>
              <div className="mt-3 text-blue-600 font-semibold">$99-499</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center">
                  <div className="w-4 h-4 bg-black rounded-sm"></div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Square Banking</h3>
              <p className="text-text-secondary text-sm">Business banking, debit cards, automatic setup</p>
              <div className="mt-3 text-green-600 font-semibold">Square Revenue</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center">
                  <div className="w-4 h-4 bg-black rounded-sm"></div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Payment Processing</h3>
              <p className="text-text-secondary text-sm">Square Payments integration, online & in-person</p>
              <div className="mt-3 text-green-600 font-semibold">Square Revenue</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Custom Software</h3>
              <p className="text-text-secondary text-sm">AI-generated apps with Square APIs built-in</p>
              <div className="mt-3 text-blue-600 font-semibold">$5K-50K</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center">
                  <div className="w-4 h-4 bg-black rounded-sm"></div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Business Growth</h3>
              <p className="text-text-secondary text-sm">Square ecosystem: POS, payroll, capital, marketing</p>
              <div className="mt-3 text-green-600 font-semibold">Square Revenue</div>
            </div>
          </div>
          
          <div className="mt-12 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 border border-green-200">
            <div className="text-center">
              <h4 className="text-2xl font-semibold text-text-primary mb-4">Customer Value to Square</h4>
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <div className="text-3xl font-bold text-green-600">100%</div>
                  <div className="text-text-secondary">Square Adoption Rate</div>
                  <div className="text-sm text-text-muted mt-1">All businesses start with Square by default</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">24-48hrs</div>
                  <div className="text-text-secondary">Time to First Payment</div>
                  <div className="text-sm text-text-muted mt-1">Fastest merchant onboarding in the industry</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">0%</div>
                  <div className="text-text-secondary">Customer Acquisition Cost</div>
                  <div className="text-sm text-text-muted mt-1">Pre-qualified business formation leads</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Competitive Moats */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-text-primary mb-12 text-center">Why Square + Maverick = Unbeatable</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-background-secondary rounded-xl p-8 border border-border-subtle">
              <h3 className="text-xl font-semibold text-text-primary mb-6 flex items-center">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                Competitive Moats
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-text-primary">Default Integration</h4>
                  <p className="text-text-secondary text-sm">Every business formed through Maverick starts with Square as the default payment processor</p>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">Technical Lock-in</h4>
                  <p className="text-text-secondary text-sm">Custom software built with Square APIs creates switching costs for customers</p>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">Data Flywheel</h4>
                  <p className="text-text-secondary text-sm">Transaction data improves our AI models, creating better business insights</p>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">Network Effects</h4>
                  <p className="text-text-secondary text-sm">More businesses = better templates = faster software generation = more businesses</p>
                </div>
              </div>
            </div>
            
            <div className="bg-background-secondary rounded-xl p-8 border border-border-subtle">
              <h3 className="text-xl font-semibold text-text-primary mb-6 flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"/>
                  </svg>
                </div>
                Competitive Advantages
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-text-primary">Speed to Market</h4>
                  <p className="text-text-secondary text-sm">Businesses can be formed and processing payments within 24-48 hours</p>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">Cost Structure</h4>
                  <p className="text-text-secondary text-sm">AI-powered operations allow 90% cost reduction vs. traditional providers</p>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">Quality Assurance</h4>
                  <p className="text-text-secondary text-sm">Square's enterprise-grade infrastructure ensures reliable service delivery</p>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">Scalability</h4>
                  <p className="text-text-secondary text-sm">Platform can handle 10,000+ formations/month with minimal human intervention</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Market Expansion */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-text-primary mb-12 text-center">Market Expansion Opportunity</h2>
          
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl p-8 text-white mb-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold mb-2">2M+</div>
                <div className="text-blue-100">New businesses formed annually</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">15%</div>
                <div className="text-blue-100">Current Square penetration</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">85%</div>
                <div className="text-blue-100">Addressable opportunity</div>
              </div>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold text-text-primary mb-6">Traditional Business Formation</h3>
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">Current Problems</h4>
                  <ul className="text-red-700 text-sm space-y-1">
                    <li>• Expensive ($500-2000+ for basic LLC)</li>
                    <li>• Slow (2-6 weeks completion time)</li>
                    <li>• Fragmented (multiple providers needed)</li>
                    <li>• No payment processing guidance</li>
                    <li>• No ongoing business support</li>
                  </ul>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-800 mb-2">Market Reality</h4>
                  <ul className="text-orange-700 text-sm space-y-1">
                    <li>• 85% of new businesses don't use Square initially</li>
                    <li>• High acquisition costs for payment processors</li>
                    <li>• Late-stage customer acquisition (after formation)</li>
                    <li>• Competing against incumbent processors</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-semibold text-text-primary mb-6">Maverick + Square Solution</h3>
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">Our Advantages</h4>
                  <ul className="text-green-700 text-sm space-y-1">
                    <li>• Affordable ($99-499 all-inclusive)</li>
                    <li>• Fast (24-48 hour completion)</li>
                    <li>• Integrated (formation + payments + software)</li>
                    <li>• Square-first approach by default</li>
                    <li>• Ongoing AI business mentorship</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Strategic Results</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• 100% of our customers start with Square</li>
                    <li>• Zero acquisition cost for payment processing</li>
                    <li>• Pre-formation customer capture</li>
                    <li>• Higher conversion rates (70%+ vs. 5-10%)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Goose + Maverick Integration */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-text-primary mb-12 text-center">Powered by Goose + Maverick AI</h2>
          
          <div className="bg-background-secondary rounded-xl p-8 border border-border-subtle mb-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-text-primary mb-6">The AI Development Platform</h3>
                <p className="text-text-secondary mb-6">
                  Maverick leverages Goose, an open-source AI developer agent, to create the world's first fully automated 
                  software development pipeline for new businesses. This powerful combination enables us to generate 
                  production-ready applications with Square payments built-in from day one.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div>
                      <span className="font-semibold text-text-primary">Goose AI Agent:</span>
                      <span className="text-text-secondary"> Autonomous code generation, testing, and deployment</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div>
                      <span className="font-semibold text-text-primary">Maverick Framework:</span>
                      <span className="text-text-secondary"> Business formation + Square integration templates</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div>
                      <span className="font-semibold text-text-primary">Square-First Architecture:</span>
                      <span className="text-text-secondary"> Every generated app includes Square payments by default</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-200">
                <h4 className="text-xl font-semibold text-text-primary mb-6">Technology Stack</h4>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <div className="font-semibold text-blue-900 mb-2">🦆 Goose AI Agent</div>
                    <div className="text-blue-700 text-sm">Open-source developer agent for autonomous software creation</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <div className="font-semibold text-purple-900 mb-2">🚀 Maverick Platform</div>
                    <div className="text-purple-700 text-sm">Business formation automation with AI-powered workflows</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-100">
                    <div className="font-semibold text-gray-900 mb-2">⬛ Square APIs</div>
                    <div className="text-gray-700 text-sm">Payments, banking, and merchant services integration</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <div className="text-3xl font-bold text-blue-600 mb-2">Minutes</div>
              <div className="font-medium text-blue-800">Code Generation Time</div>
              <div className="text-blue-600 text-sm mt-2">From business idea to working Square-integrated app</div>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-xl">
              <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
              <div className="font-medium text-green-800">Square Integration</div>
              <div className="text-green-600 text-sm mt-2">Every generated application includes Square payments</div>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
              <div className="font-medium text-purple-800">AI Development</div>
              <div className="text-purple-600 text-sm mt-2">Continuous improvement and feature development</div>
            </div>
          </div>
        </section>

        {/* Implementation Timeline */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-text-primary mb-12 text-center">Implementation Roadmap</h2>
          
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">M1</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-text-primary mb-2">Foundation & Integration</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-text-primary mb-2">Technical Integration</h4>
                    <ul className="text-text-secondary text-sm space-y-1">
                      <li>• Deep Square API integration</li>
                      <li>• Automated merchant onboarding</li>
                      <li>• Banking setup automation</li>
                      <li>• Payment processing defaults</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary mb-2">Legal Framework</h4>
                    <ul className="text-text-secondary text-sm space-y-1">
                      <li>• Regulatory compliance setup</li>
                      <li>• State filing automation</li>
                      <li>• Document generation systems</li>
                      <li>• Quality assurance processes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">M2</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-text-primary mb-2">Beta Launch & Optimization</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-text-primary mb-2">Beta Program</h4>
                    <ul className="text-text-secondary text-sm space-y-1">
                      <li>• 100 beta customers</li>
                      <li>• Square partner validation</li>
                      <li>• Process optimization</li>
                      <li>• Customer feedback integration</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary mb-2">Performance Metrics</h4>
                    <ul className="text-text-secondary text-sm space-y-1">
                      <li>• 95%+ Square adoption rate</li>
                      <li>• 24-48 hour formation time</li>
                      <li>• 90%+ customer satisfaction</li>
                      <li>• $2000+ average Square LTV</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">M3</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-text-primary mb-2">Market Launch & Scale</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-text-primary mb-2">Go-to-Market</h4>
                    <ul className="text-text-secondary text-sm space-y-1">
                      <li>• Public platform launch</li>
                      <li>• Digital marketing campaigns</li>
                      <li>• Square co-marketing</li>
                      <li>• Partner channel development</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary mb-2">Scale Operations</h4>
                    <ul className="text-text-secondary text-sm space-y-1">
                      <li>• 1000+ formations/month</li>
                      <li>• Multi-state expansion</li>
                      <li>• AI model optimization</li>
                      <li>• Customer success automation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">M4</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-text-primary mb-2">Advanced Features & Expansion</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-text-primary mb-2">Feature Enhancement</h4>
                    <ul className="text-text-secondary text-sm space-y-1">
                      <li>• Custom software generation</li>
                      <li>• Advanced Square integrations</li>
                      <li>• AI business mentorship</li>
                      <li>• Predictive analytics</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary mb-2">Market Expansion</h4>
                    <ul className="text-text-secondary text-sm space-y-1">
                      <li>• All 50 states coverage</li>
                      <li>• International expansion planning</li>
                      <li>• Enterprise partnerships</li>
                      <li>• 5000+ customers/month</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-gradient-to-r from-black to-gray-800 rounded-2xl p-12 text-white">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-black rounded-lg"></div>
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-4">Partner with Maverick</h2>
          <p className="text-xl mb-8 text-gray-300">
            Transform Square's customer acquisition with AI-powered business formation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="mailto:tim@marman.org?subject=Square Partnership Opportunity"
              className="bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Discuss Partnership
            </Link>
            <Link 
              href="/demo"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Request Demo
            </Link>
          </div>
          
          <div className="mt-12 grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-2xl font-bold">100%</div>
              <div className="text-gray-400 text-sm">Square Integration Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold">AI-Powered</div>
              <div className="text-gray-400 text-sm">Business Formation</div>
            </div>
            <div>
              <div className="text-2xl font-bold">$0</div>
              <div className="text-gray-400 text-sm">Customer Acquisition Cost</div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}