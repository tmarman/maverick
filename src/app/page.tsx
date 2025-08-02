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
                  
                  <div className="text-center mt-8">
                    <a 
                      href="/cockpit" 
                      className="inline-flex items-center px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-hover font-semibold"
                    >
                      🚀 Launch Cockpit
                      <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </div>
                </div>

                <div className="bg-background-secondary rounded-2xl p-8 border border-border-subtle">
                  <div className="text-center mb-6">
                    <h4 className="text-lg font-semibold text-text-primary mb-2">Build Your Company</h4>
                    <p className="text-sm text-text-secondary">
                      From idea to revenue-generating business with AI-powered guidance
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      <span className="text-text-primary">Company → Product → Feature hierarchy</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      <span className="text-text-primary">Chat-driven development workflow</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                      <span className="text-text-primary">GitHub integration & deployment</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                      <span className="text-text-primary">Square payments & business tools</span>
                    </div>
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
              Ready to Build Your Business?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Start with our AI-powered business cockpit and turn your ideas into reality.
            </p>
            <a 
              href="/cockpit" 
              className="inline-flex items-center px-8 py-4 bg-white text-accent-primary rounded-lg hover:bg-gray-50 font-bold text-lg shadow-lg"
            >
              🚀 Enter Cockpit
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}