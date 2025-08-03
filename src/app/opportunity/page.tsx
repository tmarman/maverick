import Link from 'next/link'

export default function OpportunityPage() {
  return (
    <div className="min-h-screen bg-background-primary">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            Turn Your Idea Into 
            <span className="text-accent-primary"> Opportunity</span>
          </h1>
          <p className="text-xl text-text-secondary mb-8 max-w-3xl mx-auto">
            Whether you're exploring a concept, seeking collaborators, or ready to pitch investors, 
            Maverick helps you transform ideas into structured opportunities that attract the right people.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/app"
              className="bg-accent-primary hover:bg-accent-hover text-text-inverse px-8 py-3 rounded-lg text-lg font-medium transition-colors"
            >
              🚀 Start Exploring Your Idea
            </Link>
            <Link 
              href="#how-it-works"
              className="border border-border-subtle hover:bg-background-secondary text-text-primary px-8 py-3 rounded-lg text-lg font-medium transition-colors"
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 bg-background-secondary">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-12">
            From Idea to Opportunity
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-3">Explore & Refine</h3>
              <p className="text-text-secondary">
                Start with any idea - from a napkin sketch to a business concept. Our AI helps you explore possibilities, 
                identify opportunities, and refine your vision.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-3">Structure & Validate</h3>
              <p className="text-text-secondary">
                Transform loose ideas into structured opportunities with market validation, 
                competitive analysis, and clear value propositions.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-3">Connect & Pitch</h3>
              <p className="text-text-secondary">
                Present your opportunity to investors, partners, customers, or team members 
                with professional pitch materials and clear next steps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Square Partnership Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12">
            <div className="flex items-center mb-6">
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
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Powered by Square's Business Ecosystem
            </h2>
            <p className="text-lg text-text-secondary mb-6">
              When your opportunity is ready to become a business, Maverick seamlessly integrates 
              with Square's complete business infrastructure - from payments and banking to 
              point-of-sale and customer management.
            </p>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h4 className="font-semibold text-text-primary mb-2">🏦 Business Banking</h4>
                <p className="text-text-secondary">Automated business account setup with Square Banking</p>
              </div>
              <div>
                <h4 className="font-semibold text-text-primary mb-2">💳 Payment Processing</h4>
                <p className="text-text-secondary">Accept payments online, in-person, and on mobile</p>
              </div>
              <div>
                <h4 className="font-semibold text-text-primary mb-2">📊 Business Analytics</h4>
                <p className="text-text-secondary">Real-time insights and reporting for growth</p>
              </div>
              <div>
                <h4 className="font-semibold text-text-primary mb-2">🛍️ Complete Commerce</h4>
                <p className="text-text-secondary">Online stores, inventory, and customer management</p>
              </div>
            </div>
            <Link 
              href="/square-partnership"
              className="inline-flex items-center text-accent-primary hover:text-accent-hover font-medium"
            >
              Explore Square Partnership 
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background-secondary">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-12">
            Perfect For Every Stage
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-background-primary p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-text-primary mb-3">💭 Idea Explorers</h3>
              <p className="text-text-secondary">
                Have a concept but need help exploring its potential and market fit
              </p>
            </div>
            <div className="bg-background-primary p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-text-primary mb-3">🤝 Partnership Seekers</h3>
              <p className="text-text-secondary">
                Looking for co-founders, advisors, or strategic partners to join your vision
              </p>
            </div>
            <div className="bg-background-primary p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-text-primary mb-3">🎯 Early Customers</h3>
              <p className="text-text-secondary">
                Ready to validate your idea with potential customers and early adopters
              </p>
            </div>
            <div className="bg-background-primary p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-text-primary mb-3">💰 Investment Ready</h3>
              <p className="text-text-secondary">
                Prepared to pitch investors with structured opportunities and clear plans
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-6">
            Ready to Turn Your Idea Into Opportunity?
          </h2>
          <p className="text-xl text-text-secondary mb-8">
            Join founders who are using Maverick to explore, structure, and present their ideas 
            to the right people at the right time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/app"
              className="bg-accent-primary hover:bg-accent-hover text-text-inverse px-8 py-4 rounded-lg text-lg font-medium transition-colors"
            >
              🚀 Start Your Opportunity Journey
            </Link>
            <Link 
              href="/about"
              className="border border-border-subtle hover:bg-background-secondary text-text-primary px-8 py-4 rounded-lg text-lg font-medium transition-colors"
            >
              Learn More About Maverick
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}