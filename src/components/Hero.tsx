import Link from 'next/link'

export function Hero() {
  return (
    <div className="relative overflow-hidden bg-background-primary">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background-primary via-background-secondary to-background-tertiary opacity-50"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Full-width headline section */}
        <div className="text-center pt-6 sm:pt-8 md:pt-12 lg:pt-16 xl:pt-20 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex justify-center items-center mb-8">
            <img 
              src="/design/icon.png" 
              alt="Maverick" 
              className="h-16 w-16 mr-4"
            />
            <img 
              src="/design/textmark.png" 
              alt="Maverick" 
              className="h-12"
            />
          </div>
          
          {/* Tagline */}
          <div className="mb-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent-primary text-text-inverse">
              🚀  Fly with Maverick
            </span>
          </div>
          
          <h1 className="text-3xl tracking-tight font-extrabold text-text-primary sm:text-4xl md:text-5xl lg:text-6xl max-w-6xl mx-auto">
            <span className="inline">Bring your idea to market </span>
            <span className="text-accent-primary">in days</span>
            <span className="block text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal text-text-secondary mt-6">
              No code, no complexity—just describe what you want and watch it get built
            </span>
          </h1>
        </div>

        {/* Content section below headline */}
        <div className="mt-12 lg:mt-16 px-4 sm:px-6 lg:px-8 pb-8 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left column - Description and features */}
            <div>
              <p className="text-lg text-text-secondary sm:text-xl leading-relaxed mb-8">
                You bring the vision. Our <strong>AI team</strong> handles everything else: engineering, product management, 
                marketing analysis, business intelligence, and <strong>Square integration</strong>. It's like hiring an entire startup team.
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
                    <div className="font-semibold text-text-primary">Engineering Team</div>
                    <div className="text-sm text-text-secondary">AI developers write code, run tests, and deploy your applications</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary">Product & Marketing</div>
                    <div className="text-sm text-text-secondary">AI product managers and marketing analysts optimize your business strategy</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary">Business Intelligence</div>
                    <div className="text-sm text-text-secondary">AI analysts generate reports, track performance, and identify growth opportunities</div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center mb-8">
                <div className="rounded-md shadow-lg">
                  <Link
                    href="/waitlist"
                    className="flex items-center justify-center px-8 py-4 border border-transparent text-lg font-semibold rounded-md text-text-inverse bg-accent-primary hover:bg-accent-hover transition-all duration-200 transform hover:scale-105"
                  >
                    🚀  Join the Waitlist
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
                    <div className="text-sm font-medium text-text-primary">Engineering</div>
                    <div className="text-xs text-text-muted">AI developers</div>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div className="text-sm font-medium text-text-primary">Product</div>
                    <div className="text-xs text-text-muted">AI managers</div>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-sm font-medium text-text-primary">Analytics</div>
                    <div className="text-xs text-text-muted">AI analysts</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - Visual element */}
            <div className="flex items-center justify-center">
              <div className="max-w-md w-full">
                {/* AI Development Visual */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-2xl p-8 border border-blue-100">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">AI-Native Development</h3>
                    <p className="text-gray-600 mb-6">
                      From natural language descriptions to production-ready applications with Square payments built-in.
                    </p>
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="text-sm text-left font-mono text-gray-800">
                        "Build a customer loyalty app for my coffee shop with points, rewards, and Square payment integration"
                      </div>
                      <div className="text-xs text-blue-600 mt-2 flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                        AI is building your app...
                      </div>
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