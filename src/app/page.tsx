import { Hero } from '@/components/Hero'
import { Navigation } from '@/components/Navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Maverick • Bring your idea to market in days',
  description: 'No code, no complexity—just describe what you want and watch your AI team build it. Engineering, product management, marketing analysis, and business intelligence included.',
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <Hero />
        
        {/* Your AI Team Section */}
        <section className="py-24 bg-background-primary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-text-primary mb-6">
                Your Complete AI Team
              </h2>
              <p className="text-xl text-text-secondary max-w-4xl mx-auto">
                Like hiring an entire startup team, but they work 24/7 and never need coffee breaks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {/* Engineering Manager */}
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3">Engineering Manager</h3>
                <p className="text-text-secondary text-sm">
                  Writes code, runs tests, handles deployments, manages GitHub repositories and pull requests.
                </p>
              </div>

              {/* Product Manager */}
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3">Product Manager</h3>
                <p className="text-text-secondary text-sm">
                  Organizes features, prioritizes development, creates specifications, and manages project roadmaps.
                </p>
              </div>

              {/* Marketing Analyst */}
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3">Marketing Analyst</h3>
                <p className="text-text-secondary text-sm">
                  Analyzes customer behavior, optimizes conversion funnels, and provides growth strategy recommendations.
                </p>
              </div>

              {/* Business Intelligence */}
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3">Business Analyst</h3>
                <p className="text-text-secondary text-sm">
                  Generates automated reports, tracks KPIs, identifies growth opportunities from your business data.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Simple CTA Section */}
        <section className="py-24 bg-accent-primary">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Join the Revolution?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Be among the first to experience AI-native development. Join our waitlist for exclusive early access.
            </p>
            <a 
              href="/waitlist" 
              className="inline-flex items-center px-8 py-4 bg-white text-accent-primary rounded-lg hover:bg-gray-100 font-bold text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              🚀 Join the Waitlist →
            </a>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-background-secondary border-t border-border-subtle py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-lg font-bold text-text-primary mb-4">Maverick</h3>
              <p className="text-text-secondary text-sm mb-4">
                AI-native software development platform that generates production-ready applications 
                for businesses. No coding required.
              </p>
            </div>
            
            <div>
              <h4 className="text-md font-semibold text-text-primary mb-3">Documentation</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/docs" className="text-text-secondary hover:text-accent-primary transition-colors">
                    Getting Started
                  </a>
                </li>
                <li>
                  <a href="/docs/maverick-structure" className="text-text-secondary hover:text-accent-primary transition-colors">
                    .maverick Structure
                  </a>
                </li>
                <li>
                  <a href="https://github.com/your-org/maverick" className="text-text-secondary hover:text-accent-primary transition-colors" target="_blank" rel="noopener noreferrer">
                    GitHub Repository
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-md font-semibold text-text-primary mb-3">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/app" className="text-text-secondary hover:text-accent-primary transition-colors">
                    Build Your App
                  </a>
                </li>
                <li>
                  <a href="/examples" className="text-text-secondary hover:text-accent-primary transition-colors">
                    Examples
                  </a>
                </li>
                <li>
                  <a href="/pricing" className="text-text-secondary hover:text-accent-primary transition-colors">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border-subtle mt-8 pt-8 text-center">
            <p className="text-text-muted text-sm">
              © 2025 Maverick. Built with ❤️ and AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}