import { Navigation } from '@/components/Navigation'
import Link from 'next/link'
import { 
  Rocket, 
  Brain, 
  GitBranch, 
  Building, 
  Zap, 
  Users,
  Shield,
  Code,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Your Complete AI Development Team
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Maverick gives you an entire startup team of AI specialists who build your custom software. 
            From idea to deployed application - no coding required.
          </p>
        </div>

        {/* What We Do */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">What Maverick Does</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border border-blue-100">
              <Code className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI Engineering Team</h3>
              <p className="text-gray-600">
                AI developers write code, run tests, manage deployments, and handle GitHub repositories. 
                Get enterprise-quality development without hiring developers.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-xl border border-green-100">
              <Zap className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Product & Marketing</h3>
              <p className="text-gray-600">
                AI product managers organize features and roadmaps. AI marketing analysts 
                optimize conversion funnels and provide growth recommendations.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-8 rounded-xl border border-purple-100">
              <Brain className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Business Intelligence</h3>
              <p className="text-gray-600">
                AI business analysts generate automated reports, track KPIs, and identify 
                growth opportunities from your Square and application data.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">How Your AI Team Works</h2>
          
          <div className="space-y-12">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Describe Your App</h3>
                <p className="text-gray-600">
                  Tell us what you want to build in natural language. Your AI product manager 
                  creates specifications and breaks down the work into manageable features.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">AI Team Builds</h3>
                <p className="text-gray-600">
                  Your AI engineering team writes code, runs tests, handles deployments, and manages 
                  GitHub repositories. Watch your app come to life in real-time.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Square Integration</h3>
                <p className="text-gray-600">
                  Automatic Square payment processing integration, plus business formation 
                  if needed. Your app is ready to make money from day one.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ongoing Intelligence</h3>
                <p className="text-gray-600">
                  AI analysts generate reports, track performance, and suggest improvements. 
                  Your team keeps optimizing and growing your business.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Platform Features</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Code className="w-6 h-6" />,
                title: "AI Development Environment",
                description: "Built-in AI development environment with real-time coding assistance"
              },
              {
                icon: <GitBranch className="w-6 h-6" />,
                title: "GitHub Integration",
                description: "Automatic repository creation, issue management, and deployment pipelines"
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Team Collaboration",
                description: "Multi-user workspaces with role-based permissions and real-time collaboration"
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Legal Compliance",
                description: "Automated legal document generation and ongoing compliance monitoring"
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Payment Processing",
                description: "Square integration for payments, invoicing, and business banking"
              },
              {
                icon: <Brain className="w-6 h-6" />,
                title: "AI Project Management",
                description: "Intelligent task planning, estimation, and project orchestration"
              }
            ].map((feature, index) => (
              <div key={index} className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Who It's For */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Who Maverick Is For</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Entrepreneurs</h3>
              <p className="text-gray-600">
                Solo founders who want to focus on building their product, not navigating legal paperwork and business setup.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Small Teams</h3>
              <p className="text-gray-600">
                Growing teams that need professional business operations without the overhead of traditional corporate setup.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Code className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Developers</h3>
              <p className="text-gray-600">
                Technical founders who want AI-powered development tools integrated with business formation and operations.
              </p>
            </div>
          </div>
        </section>

        {/* Why Choose Maverick */}
        <section className="mb-20">
          <div className="bg-gray-50 rounded-2xl p-8 lg:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Choose Maverick?</h2>
            
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Traditional Way</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex-shrink-0 mt-0.5"></div>
                    <span>3-6 months to incorporate and set up operations</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex-shrink-0 mt-0.5"></div>
                    <span>$5,000-15,000 in legal and setup fees</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex-shrink-0 mt-0.5"></div>
                    <span>Separate tools for development, payments, and business management</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex-shrink-0 mt-0.5"></div>
                    <span>Manual compliance and ongoing legal maintenance</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">The Maverick Way</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>7-14 days from idea to operational business</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Starting at $199/month - all-inclusive platform</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Integrated AI development, payments, and business management</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Automated compliance monitoring and document updates</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 lg:p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Build Your App?</h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Stop paying $50K+ for custom development. Get your complete AI team working today 
              and bring your idea to market in days.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/app"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Rocket className="w-5 h-5" />
                Build Your App
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              <Link 
                href="/pricing"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center justify-center"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}