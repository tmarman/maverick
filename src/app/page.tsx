import { Hero } from '@/components/Hero'
import { Navigation } from '@/components/Navigation'

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <Hero />
        
        {/* Four Pillars Section */}
        <section className="py-24 bg-background-primary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-text-primary mb-6">
                How Maverick Works
              </h2>
              <p className="text-xl text-text-secondary max-w-4xl mx-auto">
                We handle the four hardest parts of starting a business so you can focus on what you do best.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16">
              {/* Legal Formation Pillar */}
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3v-8a1 1 0 011-1h4a1 1 0 011 1v8h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-4">Legal Formation</h3>
                <p className="text-text-secondary mb-4">
                  Real business entity with proper equity structure, compliance framework, and all legal documents.
                </p>
                <ul className="text-sm text-text-secondary space-y-2 text-left">
                  <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>LLC, S-Corp, C-Corp formation</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>Operating agreements & bylaws</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>EIN & tax registration</li>
                </ul>
              </div>

              {/* Square Integration Pillar */}
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-4">Square Integration</h3>
                <p className="text-text-secondary mb-4">
                  Complete payment processing, banking, and business tools powered by Square's ecosystem.
                </p>
                <ul className="text-sm text-text-secondary space-y-2 text-left">
                  <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Business banking account</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Payment processing setup</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Customer management tools</li>
                </ul>
              </div>

              {/* AI Business Partner Pillar */}
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-4">AI Business Partner</h3>
                <p className="text-text-secondary mb-4">
                  Get expert guidance on product decisions, market strategy, and growth—available 24/7.
                </p>
                <ul className="text-sm text-text-secondary space-y-2 text-left">
                  <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>Strategic planning assistance</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>Market analysis & insights</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>Growth recommendations</li>
                </ul>
              </div>

              {/* Autonomous AI Agents Pillar */}
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-4">Autonomous AI Agents</h3>
                <p className="text-text-secondary mb-4">
                  Watch AI agents build features in real-time, create pull requests with working code, tests, and screenshots.
                </p>
                <ul className="text-sm text-text-secondary space-y-2 text-left">
                  <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>Parallel feature development</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>Automated testing & screenshots</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>Complete PR delivery</li>
                </ul>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <a 
                href="/app" 
                className="inline-flex items-center px-8 py-4 bg-accent-primary text-white rounded-lg hover:bg-accent-hover font-bold text-lg shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                🚀 Start Your AI-Powered Business
                <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </path>
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* How It Works Demo Section */}
        <section className="py-24 bg-background-secondary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-text-primary mb-6">
                Watch AI Agents Build Your Software
              </h2>
              <p className="text-xl text-text-secondary max-w-4xl mx-auto">
                See how autonomous AI agents work in parallel to implement features, run tests, and deliver complete pull requests.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-background-primary rounded-2xl p-8 border border-border-subtle">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">Describe Your Feature</h3>
                  <p className="text-text-secondary text-sm">Tell Maverick what you want to build in natural language</p>
                </div>
                <div className="bg-background-secondary rounded-lg p-4 text-sm font-mono text-text-secondary">
                  "Add user authentication with password reset functionality"
                </div>
              </div>

              <div className="bg-background-primary rounded-2xl p-8 border border-border-subtle">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">AI Agents Get to Work</h3>
                  <p className="text-text-secondary text-sm">Watch agents create branches, write code, and run tests in real-time</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-text-primary">Creating feature branch...</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3 animate-pulse"></div>
                    <span className="text-text-primary">Writing authentication logic...</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                    <span className="text-text-muted">Running tests...</span>
                  </div>
                </div>
              </div>

              <div className="bg-background-primary rounded-2xl p-8 border border-border-subtle">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">Get Complete PR</h3>
                  <p className="text-text-secondary text-sm">Receive working code, tests, screenshots, and demo videos</p>
                </div>
                <div className="bg-background-secondary rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm font-semibold text-text-primary">PR #42: Add user authentication</span>
                  </div>
                  <div className="text-xs text-text-secondary space-y-1">
                    <div>✅ All tests passing</div>
                    <div>📸 Screenshots captured</div>
                    <div>🎥 Demo video recorded</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-accent-primary">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Build Your AI-Powered Business?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Let AI agents handle the development while you focus on customers and growth.
            </p>
            <a 
              href="/app" 
              className="inline-flex items-center px-8 py-4 bg-white text-accent-primary rounded-lg hover:bg-gray-50 font-bold text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              🚀 Get Your First AI Agent
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}