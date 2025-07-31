import { Hero } from '@/components/Hero'
import { Navigation } from '@/components/Navigation'

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <Hero />
        
        {/* Three Pillars Section */}
        <section className="py-24 bg-background-primary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-text-primary mb-6">
                How Maverick Works
              </h2>
              <p className="text-xl text-text-secondary max-w-4xl mx-auto">
                We handle the three hardest parts of starting a business so you can focus on what you do best.
              </p>
            </div>

            <div className="space-y-24">
              {/* Legal Formation Pillar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3v-8a1 1 0 011-1h4a1 1 0 011 1v8h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-3xl font-bold text-text-primary">Complete Legal Formation</h3>
                  </div>
                  <p className="text-lg text-text-secondary mb-6">
                    Get a real business entity with proper equity structure, compliance framework, and all the legal documents you need to operate and raise funding.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-background-secondary rounded-lg p-4">
                      <h4 className="font-semibold text-text-primary mb-2">🏢 Entity Formation</h4>
                      <ul className="text-sm text-text-secondary space-y-1">
                        <li>• Delaware C-Corp (YC standard)</li>
                        <li>• Series Seed-ready structure</li>
                        <li>• 10M authorized shares</li>
                        <li>• Founder-friendly bylaws</li>
                      </ul>
                    </div>
                    <div className="bg-background-secondary rounded-lg p-4">
                      <h4 className="font-semibold text-text-primary mb-2">📊 Equity & Cap Table</h4>
                      <ul className="text-sm text-text-secondary space-y-1">
                        <li>• Founder vesting (4yr/1yr cliff)</li>
                        <li>• Employee stock option pool</li>
                        <li>• 83(b) election handling</li>
                        <li>• Cap table management</li>
                      </ul>
                    </div>
                    <div className="bg-background-secondary rounded-lg p-4">
                      <h4 className="font-semibold text-text-primary mb-2">📋 Legal Docs</h4>
                      <ul className="text-sm text-text-secondary space-y-1">
                        <li>• Privacy policy & ToS</li>
                        <li>• Employee handbook</li>
                        <li>• IP assignment agreements</li>
                        <li>• Contractor agreements</li>
                      </ul>
                    </div>
                    <div className="bg-background-secondary rounded-lg p-4">
                      <h4 className="font-semibold text-text-primary mb-2">🔒 Compliance</h4>
                      <ul className="text-sm text-text-secondary space-y-1">
                        <li>• Annual state filings</li>
                        <li>• Board meeting minutes</li>
                        <li>• Federal & state tax setup</li>
                        <li>• Ongoing legal monitoring</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-blue-600 font-semibold">🆚 vs LegalZoom/Clerky:</span>
                    </div>
                    <p className="text-blue-700 text-sm">
                      They handle basic formation. We handle investor-ready startups with proper cap tables, 
                      vesting schedules, and all the legal infrastructure VCs expect to see.
                    </p>
                  </div>
                </div>

                <div className="bg-background-secondary rounded-2xl p-8 border border-border-subtle">
                  <div className="text-center mb-6">
                    <h4 className="text-lg font-semibold text-text-primary mb-2">Legal Formation Comparison</h4>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { feature: 'Delaware C-Corp', legalzoom: '❌', clerky: '✅', maverick: '✅' },
                      { feature: 'Stock Option Pool', legalzoom: '❌', clerky: '✅', maverick: '✅' },
                      { feature: 'Vesting Schedules', legalzoom: '❌', clerky: '✅', maverick: '✅' },
                      { feature: '83(b) Elections', legalzoom: '❌', clerky: '✅', maverick: '✅' },
                      { feature: 'AI Legal Guidance', legalzoom: '❌', clerky: '❌', maverick: '✅' },
                      { feature: 'Investor-Ready Docs', legalzoom: '❌', clerky: '✅', maverick: '✅' },
                      { feature: 'Ongoing Compliance', legalzoom: '💰', clerky: '💰', maverick: '✅' }
                    ].map((row, index) => (
                      <div key={index} className="grid grid-cols-4 gap-2 text-sm">
                        <div className="font-medium text-text-primary">{row.feature}</div>
                        <div className="text-center">{row.legalzoom}</div>
                        <div className="text-center">{row.clerky}</div>
                        <div className="text-center text-green-600 font-bold">{row.maverick}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 text-xs text-text-muted text-center">
                    LegalZoom | Clerky | <strong className="text-accent-primary">Maverick</strong>
                  </div>
                </div>
              </div>

              {/* AI Mentorship Pillar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="order-2 lg:order-1">
                  <div className="bg-background-secondary rounded-2xl p-8 border border-border-subtle">
                    <div className="text-center mb-6">
                      <h4 className="text-lg font-semibold text-text-primary mb-2">AI Mentorship vs Traditional Incubators</h4>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="bg-background-tertiary rounded-lg p-4">
                        <h5 className="font-semibold text-text-primary mb-2">🤖 Goose AI Mentor</h5>
                        <ul className="text-sm text-text-secondary space-y-1">
                          <li>• Available 24/7 for guidance</li>
                          <li>• Personalized to your industry</li>
                          <li>• No equity required</li>
                          <li>• Scales with your questions</li>
                          <li>• Access latest business intel</li>
                        </ul>
                      </div>
                      
                      <div className="bg-background-tertiary rounded-lg p-4 opacity-60">
                        <h5 className="font-semibold text-text-primary mb-2">🏢 Traditional Incubators</h5>
                        <ul className="text-sm text-text-secondary space-y-1">
                          <li>• 6% equity for 3 months</li>
                          <li>• Limited mentor availability</li>
                          <li>• Batch-based, not personalized</li>
                          <li>• Geographic limitations</li>
                          <li>• High competition for attention</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="order-1 lg:order-2">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-3xl font-bold text-text-primary">AI-Driven Mentorship</h3>
                  </div>
                  <p className="text-lg text-text-secondary mb-6">
                    Get expert guidance on every business decision from market strategy to technical choices, available 24/7 whenever you need it.
                  </p>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-green-600 text-xs">💡</span>
                      </div>
                      <div>
                        <div className="font-semibold text-text-primary">Strategic Guidance</div>
                        <div className="text-sm text-text-secondary">Market validation, competitive analysis, product-market fit strategies</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-green-600 text-xs">📈</span>
                      </div>
                      <div>
                        <div className="font-semibold text-text-primary">Business Operations</div>
                        <div className="text-sm text-text-secondary">Hiring plans, go-to-market strategy, pricing models, fundraising prep</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-green-600 text-xs">⚙️</span>
                      </div>
                      <div>
                        <div className="font-semibold text-text-primary">Technical Decisions</div>
                        <div className="text-sm text-text-secondary">Tech stack recommendations, architecture planning, scaling considerations</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-green-600 font-semibold">🆚 vs YC/Techstars:</span>
                    </div>
                    <p className="text-green-700 text-sm">
                      They give you access to mentors for 3-6 months in exchange for equity. 
                      We give you an AI mentor trained on all their knowledge, available 24/7, for free.
                    </p>
                  </div>
                </div>
              </div>

              {/* App Generation Pillar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-3xl font-bold text-text-primary">No-Code App Generation</h3>
                  </div>
                  <p className="text-lg text-text-secondary mb-6">
                    Get custom websites and apps built exactly for your business without writing code or managing developers.
                  </p>
                  
                  <div className="space-y-4 mb-6">
                    <div className="bg-background-secondary rounded-lg p-4">
                      <h4 className="font-semibold text-text-primary mb-2">🎨 Design-to-Code Generation</h4>
                      <p className="text-sm text-text-secondary">
                        Describe your app in plain English or upload mockups. Claude Code generates pixel-perfect, 
                        production-ready applications with modern design patterns.
                      </p>
                    </div>
                    
                    <div className="bg-background-secondary rounded-lg p-4">
                      <h4 className="font-semibold text-text-primary mb-2">🔧 Iterative Refinement</h4>
                      <p className="text-sm text-text-secondary">
                        Don't like something? Just tell the AI what to change. No technical knowledge required—
                        iterate until it's exactly what you envisioned.
                      </p>
                    </div>
                    
                    <div className="bg-background-secondary rounded-lg p-4">
                      <h4 className="font-semibold text-text-primary mb-2">🚀 Production-Ready Output</h4>
                      <p className="text-sm text-text-secondary">
                        Generated apps include authentication, payments, databases, responsive design, 
                        and deployment configs. No "toy" apps—real software you can scale.
                      </p>
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-purple-600 font-semibold">🆚 vs Hiring Developers:</span>
                    </div>
                    <p className="text-purple-700 text-sm">
                      Senior developers cost $150K+/year and take months to build your MVP. 
                      Our AI builds production-ready apps that you can iterate on instantly.
                    </p>
                  </div>
                </div>

                <div className="bg-background-secondary rounded-2xl p-8 border border-border-subtle">
                  <div className="text-center mb-6">
                    <h4 className="text-lg font-semibold text-text-primary mb-2">Development Cost Comparison</h4>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h5 className="font-semibold text-red-800 mb-2">👨‍💻 Hiring Developers</h5>
                      <div className="text-sm text-red-700 space-y-1">
                        <div>Senior Developer: $150,000/year</div>
                        <div>Designer: $100,000/year</div>
                        <div>DevOps: $120,000/year</div>
                        <div className="border-t border-red-300 pt-2 mt-2">
                          <strong>Total: $370,000/year</strong>
                        </div>
                        <div className="text-xs">+ 3-6 months to MVP</div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-text-primary">VS</div>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h5 className="font-semibold text-green-800 mb-2">🤖 Maverick AI</h5>
                      <div className="text-sm text-green-700 space-y-1">
                        <div>Business Formation: $499</div>
                        <div>App Generation: Included</div>
                        <div>Unlimited Iterations: Included</div>
                        <div className="border-t border-green-300 pt-2 mt-2">
                          <strong>Total: $499 one-time</strong>
                        </div>
                        <div className="text-xs">+ Production app ready immediately</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 text-center">
                    <div className="text-3xl font-bold text-green-600">740x</div>
                    <div className="text-sm text-text-muted">Cost savings vs hiring</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Legal Compliance Section */}
        <section className="py-16 bg-background-secondary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-background-primary rounded-2xl p-8 border border-border-subtle">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-bold text-text-primary mb-4">
                    ⚖️ Enterprise-Grade Legal Compliance
                  </h2>
                  <p className="text-lg text-text-secondary mb-6">
                    Every business formation includes complete legal infrastructure with automatic compliance monitoring.
                  </p>
                  <div className="space-y-3">
                    {[
                      "Delaware/Texas/California incorporation",
                      "Operating agreements & corporate bylaws", 
                      "Privacy policies & terms of service",
                      "GDPR & CCPA compliance frameworks",
                      "PCI DSS for payment processing",
                      "Ongoing compliance monitoring"
                    ].map((item, index) => (
                      <div key={index} className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-text-secondary">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-background-tertiary rounded-xl p-6 border border-border-subtle">
                  <div className="text-center">
                    <div className="text-2xl mb-4">📋</div>
                    <h3 className="font-semibold text-text-primary mb-2">Legal Document Generator</h3>
                    <p className="text-sm text-text-secondary mb-4">AI-powered legal document creation</p>
                    <div className="text-xs text-text-muted space-y-1">
                      <div>✓ Articles of Incorporation</div>
                      <div>✓ Operating Agreement</div>
                      <div>✓ Privacy Policy</div>
                      <div>✓ Terms of Service</div>
                      <div>✓ Employment Agreements</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Business Lifecycle Timeline */}
        <section className="py-24 bg-background-primary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-text-primary mb-6">
                Complete Business Formation Process
              </h2>
              <p className="text-xl text-text-secondary max-w-4xl mx-auto leading-relaxed">
                From idea to <strong>fully established business</strong>. Watch your concept transform 
                into a complete company with legal formation, banking, and custom software.
              </p>
            </div>
            
            {/* Interactive timeline */}
            <div className="relative max-w-4xl mx-auto">
              <div className="space-y-12">
                {[
                  {
                    day: "Step 1",
                    title: "🏢 Business Formation", 
                    description: "Complete legal entity creation with compliance framework",
                    deliverables: ["LLC/C-Corp filing", "EIN registration", "Operating agreements", "Compliance setup"],
                    demo: "formation-demo",
                    status: "Legal Foundation"
                  },
                  {
                    day: "Step 2",
                    title: "🏦 Square Integration",
                    description: "Banking, payments, and merchant services setup",
                    deliverables: ["Business banking", "Payment processing", "Square APIs", "Merchant account"],
                    demo: "square-demo", 
                    status: "Financial Infrastructure"
                  },
                  {
                    day: "Step 3", 
                    title: "💻 AI App Development",
                    description: "Claude Code generates your custom business software",
                    deliverables: ["Custom web app", "Mobile responsive", "Square integration", "Admin dashboard"],
                    demo: "app-demo",
                    status: "Technology Platform"
                  },
                  {
                    day: "Step 4",
                    title: "🚀 Launch Ready",
                    description: "Deployment and business launch preparation",
                    deliverables: ["Production deployment", "Domain setup", "Payment testing", "Documentation"],
                    demo: "launch-demo",
                    status: "Ready to Operate"
                  }
                ].map((phase, index) => (
                  <div key={index} className="relative">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                      {/* Timeline indicator */}
                      <div className="lg:col-span-2 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-primary rounded-full text-white font-bold text-lg">
                          {index + 1}
                        </div>
                        <div className="text-sm text-text-muted mt-2">{phase.day}</div>
                      </div>
                      
                      {/* Content */}
                      <div className="lg:col-span-6">
                        <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
                          <h3 className="text-xl font-bold text-text-primary mb-2">{phase.title}</h3>
                          <p className="text-text-secondary mb-4">{phase.description}</p>
                          
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            {phase.deliverables.map((deliverable, i) => (
                              <div key={i} className="flex items-center text-sm text-text-secondary">
                                <svg className="w-3 h-3 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {deliverable}
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex justify-center">
                            <span className="px-4 py-2 bg-accent-primary bg-opacity-10 text-accent-primary rounded-full text-sm font-medium">
                              {phase.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Demo preview */}
                      <div className="lg:col-span-4">
                        <div className="bg-background-tertiary rounded-xl p-4 border border-border-subtle aspect-video flex items-center justify-center">
                          <div className="text-center text-text-muted">
                            <div className="text-2xl mb-2">{phase.title.split(' ')[0]}</div>
                            <div className="text-sm">Interactive Demo</div>
                            <button className="mt-2 px-4 py-2 bg-accent-primary text-white text-xs rounded-lg hover:bg-accent-hover transition-colors">
                              ▶ Watch Demo
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Square Ecosystem Showcase */}
        <section className="py-24 bg-background-secondary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-text-primary mb-6">
                Deep Square Ecosystem Integration
              </h2>
              <p className="text-xl text-text-secondary max-w-4xl mx-auto">
                Every Maverick business is <strong>natively integrated</strong> with Square's complete 
                business platform from day one.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: "💳",
                  title: "Square Payments",
                  description: "Complete payment processing with 2.9% + 30¢ per transaction",
                  apis: ["Web Payments SDK", "Checkout API", "Terminal API", "In-App Payments"],
                  volume: "$2.4M"
                },
                {
                  icon: "🏦", 
                  title: "Square Banking",
                  description: "Free business checking with instant access to funds",
                  apis: ["Banking API", "Instant Deposits", "Business Debit", "Expense Tracking"],
                  volume: "$890K"
                },
                {
                  icon: "📱",
                  title: "Square POS", 
                  description: "Point-of-sale for physical locations and mobile businesses",
                  apis: ["POS API", "Inventory Management", "Staff Management", "Customer Directory"],
                  volume: "$1.2M"
                },
                {
                  icon: "📊",
                  title: "Square Analytics",
                  description: "Real-time business insights and performance dashboards", 
                  apis: ["Reporting API", "Analytics Dashboard", "Custom Reports", "Forecasting"],
                  volume: "All businesses"
                },
                {
                  icon: "👥",
                  title: "Square Team",
                  description: "Employee management, payroll, and scheduling",
                  apis: ["Team Management", "Payroll API", "Time Tracking", "Scheduling Tools"],
                  volume: "$320K"
                },
                {
                  icon: "🎯",
                  title: "Square Marketing",
                  description: "Customer engagement, loyalty programs, and campaigns",
                  apis: ["Customer API", "Loyalty API", "Email Marketing", "Promotions"],
                  volume: "85% retention"
                }
              ].map((integration, index) => (
                <div key={index} className="bg-background-primary rounded-2xl p-6 border border-border-subtle hover:shadow-lg transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-3xl">{integration.icon}</div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-text-primary">{integration.volume}</div>
                      <div className="text-xs text-text-muted">Monthly Volume</div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-text-primary mb-2">{integration.title}</h3>
                  <p className="text-text-secondary mb-4 text-sm">{integration.description}</p>
                  
                  <div className="space-y-1">
                    {integration.apis.map((api, i) => (
                      <div key={i} className="flex items-center text-xs text-text-muted">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                        {api}
                      </div>
                    ))}
                  </div>
                  
                  <button className="mt-4 w-full py-2 text-sm font-medium text-accent-primary border border-accent-primary rounded-lg hover:bg-accent-primary hover:text-white transition-colors group-hover:bg-accent-primary group-hover:text-white">
                    View Integration
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}