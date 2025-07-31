import Link from 'next/link'

export function Hero() {
  return (
    <div className="relative overflow-hidden bg-background-primary">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background-primary via-background-secondary to-background-tertiary opacity-50"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Full-width headline section */}
        <div className="text-center pt-6 sm:pt-8 md:pt-12 lg:pt-16 xl:pt-20 px-4 sm:px-6 lg:px-8">
          {/* Tagline */}
          <div className="mb-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent-primary text-text-inverse">
              🤖 AI-Powered Business Creation
            </span>
          </div>
          
          <h1 className="text-4xl tracking-tight font-extrabold text-text-primary sm:text-5xl md:text-6xl lg:text-7xl max-w-6xl mx-auto">
            <span className="block">Turn your idea into a</span>
            <span className="block text-accent-primary">complete business</span>
            <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal text-text-secondary mt-4">Legal formation, banking, and custom software. All automated.</span>
          </h1>
        </div>

        {/* Content section below headline */}
        <div className="mt-12 lg:mt-16 px-4 sm:px-6 lg:px-8 pb-8 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left column - Description and features */}
            <div>
              <p className="text-lg text-text-secondary sm:text-xl leading-relaxed mb-8">
                We handle the <strong>legal formation</strong>, provide <strong>AI mentorship</strong> to guide your decisions, 
                and <strong>generate your apps</strong> so you can focus on what matters: building your business.
              </p>

              {/* Three core pillars */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3v-8a1 1 0 011-1h4a1 1 0 011 1v8h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary">Complete Legal Formation</div>
                    <div className="text-sm text-text-secondary">Stock grants, vesting schedules, Delaware C-Corps—everything YC startups need</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary">AI-Driven Mentorship</div>
                    <div className="text-sm text-text-secondary">Goose guides you through every decision, from market strategy to technical choices</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary">No-Code App Generation</div>
                    <div className="text-sm text-text-secondary">Generate production-ready apps and websites without writing a single line of code</div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="rounded-md shadow-lg">
                  <Link
                    href="/chat-wizard"
                    className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-lg font-semibold rounded-md text-text-inverse bg-accent-primary hover:bg-accent-hover transition-all duration-200 transform hover:scale-105"
                  >
                    💬 Chat with Goose AI
                  </Link>
                </div>
                <div>
                  <Link
                    href="/examples"
                    className="w-full flex items-center justify-center px-8 py-4 border-2 border-border-standard text-lg font-semibold rounded-md text-text-primary bg-background-primary hover:bg-background-secondary transition-all duration-200"
                  >
                    💼 See Success Stories
                  </Link>
                </div>
              </div>
              
              {/* What you get */}
              <div>
                <p className="text-sm text-text-muted mb-4">Everything you need in one platform</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3v-8a1 1 0 011-1h4a1 1 0 011 1v8h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-sm font-medium text-text-primary">Legal Formation</div>
                    <div className="text-xs text-text-muted">Investor-ready</div>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div className="text-sm font-medium text-text-primary">AI Mentorship</div>
                    <div className="text-xs text-text-muted">24/7 guidance</div>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-sm font-medium text-text-primary">Custom Software</div>
                    <div className="text-xs text-text-muted">Built for you</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - Demo visualization */}
            <div className="flex items-center justify-center">
              <div className="max-w-md w-full">
                {/* Mock business formation flow */}
                <div className="bg-background-secondary rounded-2xl shadow-2xl p-6 border border-border-subtle">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Business Formation Demo</h3>
                    <p className="text-sm text-text-secondary">Watch a coffee shop get fully established</p>
                  </div>
                  
                  {/* Progress steps */}
                  <div className="space-y-4">
                    {[
                      { step: '💡 Business Idea', status: 'complete', time: '30 sec' },
                      { step: '🏢 LLC Formation', status: 'complete', time: '2 min' },
                      { step: '🏦 Square Banking', status: 'complete', time: '5 min' },
                      { step: '💻 App Generation', status: 'in-progress', time: '15 min' },
                      { step: '🚀 Ready to Launch', status: 'pending', time: '30 min' },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          item.status === 'complete' 
                            ? 'bg-green-500 text-white' 
                            : item.status === 'in-progress'
                            ? 'bg-yellow-500 text-white animate-pulse'
                            : 'bg-border-standard text-text-muted'
                        }`}>
                          {item.status === 'complete' ? '✓' : index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-text-primary">{item.step}</span>
                            <span className="text-xs text-text-muted">{item.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Launch preview */}
                  <div className="mt-6 p-4 bg-background-tertiary rounded-lg border border-border-subtle">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-text-primary">100%</div>
                      <div className="text-sm text-text-secondary">Business formation complete</div>
                      <div className="text-xs text-text-muted mt-1">Ready to accept payments</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}