import { Navigation } from '@/components/Navigation'
import Link from 'next/link'

export default function InvestorsPage() {
  return (
    <div className="min-h-screen bg-background-primary">
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Streamlining Business Formation
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Maverick combines AI-assisted business formation, legal compliance, and custom software 
              development to reduce complexity and costs for entrepreneurs.
            </p>
            <div className="flex justify-center space-x-8 text-center">
              <div>
                <div className="text-3xl font-bold">$50B+</div>
                <div className="text-blue-100">Market Size</div>
              </div>
              <div>
                <div className="text-3xl font-bold">2M+</div>
                <div className="text-blue-100">New LLCs/Year</div>
              </div>
              <div>
                <div className="text-3xl font-bold">60%+</div>
                <div className="text-blue-100">Target Cost Savings</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Investment Thesis */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-text-primary mb-8 text-center">Investment Thesis</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background-secondary rounded-xl p-8 border border-border-subtle">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"/>
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-4">Massive TAM</h3>
              <p className="text-text-secondary">
                Large addressable market across business formation, legal services, 
                and custom software development. 2M+ new businesses formed annually seeking these services.
              </p>
            </div>

            <div className="bg-background-secondary rounded-xl p-8 border border-border-subtle">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-4">AI-Assisted Automation</h3>
              <p className="text-text-secondary">
                Claude-powered workflows automate document generation, legal compliance checks, 
                and code scaffolding to significantly reduce manual effort and processing time.
              </p>
            </div>

            <div className="bg-background-secondary rounded-xl p-8 border border-border-subtle">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-4">Integrated Workflow</h3>
              <p className="text-text-secondary">
                Connected services from business formation through custom software delivery. 
                Integration reduces friction and creates opportunities for recurring revenue.
              </p>
            </div>
          </div>
        </section>

        {/* Market Opportunity */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-text-primary mb-12 text-center">Market Opportunity</h2>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold text-text-primary mb-6">Fragmented Market Opportunity</h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">Business Formation ($5B)</h4>
                    <p className="text-text-secondary">Traditional providers charge $500-2000+ for basic LLC formation. We deliver superior results for $99.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">Legal Services ($20B+)</h4>
                    <p className="text-text-secondary">Small businesses spend $20K+ annually on legal services. Our AI delivers most services at 10% of traditional cost.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">Custom Software ($25B+)</h4>
                    <p className="text-text-secondary">Enterprise software development costs $100K-1M+. We deliver production-ready applications for $5K-50K.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-background-secondary rounded-xl p-8 border border-border-subtle">
              <h4 className="text-xl font-semibold text-text-primary mb-6">Key Market Drivers</h4>
              <ul className="space-y-4">
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-text-secondary">2M+ new businesses formed annually (growing 5% YoY)</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-text-secondary">Remote work driving entrepreneurship surge</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-text-secondary">AI adoption reaching mainstream business</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-text-secondary">Digital-first business models becoming standard</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Competitive Advantages */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-text-primary mb-12 text-center">Competitive Advantages</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">AI-First Architecture</h3>
              <p className="text-text-secondary text-sm">Proprietary LLM optimization reduces costs by 90% while maintaining enterprise quality</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Template Evolution</h3>
              <p className="text-text-secondary text-sm">Each application built strengthens our template library and frameworks, creating compounding value</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/>
                  <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Square Partnership</h3>
              <p className="text-text-secondary text-sm">Exclusive access to Square's 4M+ merchants plus free Square app development program</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Network Effects</h3>
              <p className="text-text-secondary text-sm">Each customer improves our AI models, creating compound advantages over competitors</p>
            </div>
          </div>
        </section>

        {/* Template Evolution Strategy */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-text-primary mb-12 text-center">Template Evolution & Learning Network</h2>
          
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-200 mb-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-semibold text-text-primary mb-4">The More We Build, The Smarter We Get</h3>
              <p className="text-text-secondary max-w-3xl mx-auto">
                Every application we develop feeds back into our template library and AI models, creating an exponentially improving system that delivers better results at lower cost over time.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-6 border border-indigo-100">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-text-primary mb-3">Pattern Recognition</h4>
                <p className="text-text-secondary text-sm">AI identifies common business patterns and automatically generates reusable components, reducing development time by 60-80%</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-indigo-100">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-text-primary mb-3">Quality Improvement</h4>
                <p className="text-text-secondary text-sm">Continuous feedback loop improves code quality, security practices, and performance optimization across all projects</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-indigo-100">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-text-primary mb-3">Scalable Economics</h4>
                <p className="text-text-secondary text-sm">Template reuse and automation create better unit economics over time, enabling competitive pricing while improving margins</p>
              </div>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold text-text-primary mb-6">Learning Network Flywheel</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <p className="text-text-secondary">Customer requests custom application</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <p className="text-text-secondary">AI builds solution using existing templates + new components</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <p className="text-text-secondary">New patterns extracted and added to template library</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <p className="text-text-secondary">Next similar projects build 60-80% faster</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-8 border border-gray-200">
              <h4 className="text-xl font-semibold text-text-primary mb-6 text-center">Template Library Growth</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">E-commerce Platforms</span>
                  <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">12 Templates</div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">SaaS Applications</span>
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">8 Templates</div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Service Marketplaces</span>
                  <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">6 Templates</div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Financial Apps</span>
                  <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">4 Templates</div>
                </div>
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-text-primary">Growing Monthly</span>
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs">+15-25%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Business Model */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-text-primary mb-12 text-center">Revenue Model</h2>
          
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-blue-600">$99-499</div>
                <div className="text-blue-800 font-medium text-sm">Formation Services</div>
              </div>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center space-x-2">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>LLC/Corporation formation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>EIN, banking setup</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Legal document generation</span>
                </li>
              </ul>
              <div className="mt-4 text-center text-xs text-blue-700">
                2M+ annual market • 40% gross margins
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-green-600">$99-299/mo</div>
                <div className="text-green-800 font-medium text-sm">SaaS Platform</div>
              </div>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center space-x-2">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>AI business mentorship</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Compliance monitoring</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Document management</span>
                </li>
              </ul>
              <div className="mt-4 text-center text-xs text-green-700">
                85% gross margins • High retention
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200">
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-purple-600">$5K-50K</div>
                <div className="text-purple-800 font-medium text-sm">Custom Software</div>
              </div>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center space-x-2">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Websites & web apps</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>E-commerce platforms</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Business automation</span>
                </li>
              </ul>
              <div className="mt-4 text-center text-xs text-purple-700">
                60% gross margins • Premium positioning
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-1">
                  FREE
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <div className="text-orange-800 font-medium text-sm">Square Apps</div>
              </div>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center space-x-2">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Point-of-sale integrations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Payment & inventory apps</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Business analytics tools</span>
                </li>
              </ul>
              <div className="mt-4 text-center text-xs text-orange-700">
                Partnership benefit • Market expansion
              </div>
            </div>
          </div>

          <div className="mt-12 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-8 border border-yellow-200">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-semibold text-text-primary mb-2">Square Apps Partnership Program</h3>
              <p className="text-text-secondary max-w-3xl mx-auto">
                Leveraging our Square partnership to offer free Square app development, creating a customer acquisition funnel while building valuable business relationships.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 border border-orange-100">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h4 className="font-semibold text-text-primary mb-2">Strategic Customer Acquisition</h4>
                <p className="text-text-secondary text-sm">Free Square apps demonstrate our capabilities and create trust, leading to higher-value custom software contracts</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 border border-orange-100">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                  </svg>
                </div>
                <h4 className="font-semibold text-text-primary mb-2">Market Access</h4>
                <p className="text-text-secondary text-sm">Direct access to Square's 4M+ merchant base through app marketplace and partnership channel referrals</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 border border-orange-100">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h4 className="font-semibold text-text-primary mb-2">Template Library Growth</h4>
                <p className="text-text-secondary text-sm">Each Square app builds our payment processing and POS integration templates, accelerating future development</p>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <div className="inline-flex items-center bg-white rounded-lg px-6 py-3 border border-orange-200">
                <svg className="w-5 h-5 text-orange-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                <span className="font-semibold text-text-primary">Partnership Exclusive: Square merchants get free app development to strengthen ecosystem</span>
              </div>
            </div>
          </div>
        </section>

        {/* Financial Projections */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-text-primary mb-12 text-center">Customer Acquisition Strategy</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background-secondary rounded-xl p-8 border border-border-subtle">
              <h3 className="text-xl font-semibold text-text-primary mb-4">Content Marketing</h3>
              <div className="space-y-3 text-text-secondary">
                <p>• SEO-optimized formation guides</p>
                <p>• Entrepreneur-focused blog content</p>
                <p>• Legal/business YouTube channel</p>
                <p>• Podcast sponsorships</p>
              </div>
            </div>
            
            <div className="bg-background-secondary rounded-xl p-8 border border-border-subtle">
              <h3 className="text-xl font-semibold text-text-primary mb-4">Strategic Partnerships</h3>
              <div className="space-y-3 text-text-secondary">
                <p>• Square merchant referrals</p>
                <p>• Accountant/lawyer partnerships</p>
                <p>• Accelerator integrations</p>
                <p>• Developer community outreach</p>
              </div>
            </div>
            
            <div className="bg-background-secondary rounded-xl p-8 border border-border-subtle">
              <h3 className="text-xl font-semibold text-text-primary mb-4">Product-Led Growth</h3>
              <div className="space-y-3 text-text-secondary">
                <p>• Free business formation tools</p>
                <p>• AI-powered business name generator</p>
                <p>• Compliance tracking freemium model</p>
                <p>• Open-source development tools</p>
              </div>
            </div>
          </div>
          
          <div className="mt-12 bg-blue-50 rounded-xl p-8 border border-blue-200">
            <h3 className="text-xl font-semibold text-text-primary mb-4 text-center">Customer Lifecycle & Funnel</h3>
            <div className="flex flex-wrap justify-center items-center gap-4">
              <div className="bg-white rounded-lg px-4 py-2 border">Formation Entry Point</div>
              <div className="text-blue-600">→</div>
              <div className="bg-white rounded-lg px-4 py-2 border">Compliance Conversion</div>
              <div className="text-blue-600">→</div>
              <div className="bg-white rounded-lg px-4 py-2 border">Software Upsell</div>
              <div className="text-blue-600">→</div>
              <div className="bg-white rounded-lg px-4 py-2 border">Long-term Partnership</div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-text-primary mb-12 text-center">Why Now?</h2>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold text-text-primary mb-6">Perfect Market Timing</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">AI Maturity</h4>
                    <p className="text-text-secondary text-sm">LLMs finally reliable enough for production legal/business applications</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">Remote Work Surge</h4>
                    <p className="text-text-secondary text-sm">Entrepreneurship boom as people start location-independent businesses</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">Digital-First Era</h4>
                    <p className="text-text-secondary text-sm">Every business needs software; traditional development too expensive/slow</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">Regulatory Acceptance</h4>
                    <p className="text-text-secondary text-sm">Legal industry embracing technology solutions for efficiency</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl p-8 text-white">
              <h4 className="text-2xl font-bold mb-6">Investment Opportunity</h4>
              <div className="space-y-4">
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-2xl font-bold">Seed Round Open</div>
                  <div className="text-blue-100">Building runway for product-market fit</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold">B2B SaaS</div>
                    <div className="text-blue-100 text-sm">Scalable Model</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">AI-First</div>
                    <div className="text-blue-100 text-sm">Competitive Moat</div>
                  </div>
                </div>
                
                <div className="border-t border-white/20 pt-4">
                  <h5 className="font-semibold mb-2">Use of Funds</h5>
                  <ul className="text-sm space-y-1 text-blue-100">
                    <li>• 40% - AI development & optimization</li>
                    <li>• 30% - Sales & marketing</li>
                    <li>• 20% - Team expansion</li>
                    <li>• 10% - Legal & compliance</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Business Formation?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join us in democratizing entrepreneurship with AI-powered business solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="mailto:tim@marman.org?subject=Maverick Investment Opportunity"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Request Investment Deck
            </Link>
            <Link 
              href="/demo"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Schedule Demo
            </Link>
          </div>
        </section>

      </div>
    </div>
  )
}