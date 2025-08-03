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
            AI-Native Business Formation Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Maverick transforms business formation from a months-long ordeal into a streamlined, 
            AI-powered experience. From idea to incorporation to your first product launch - all in one platform.
          </p>
        </div>

        {/* What We Do */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">What Maverick Does</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border border-blue-100">
              <Building className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Business Formation</h3>
              <p className="text-gray-600">
                Automated LLC and Corporation setup with legal documents, EIN registration, 
                and compliance management. Get legally incorporated in days, not weeks.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-xl border border-green-100">
              <Zap className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Square Integration</h3>
              <p className="text-gray-600">
                Full Square ecosystem integration for payments, banking, point-of-sale, 
                and business analytics. Start accepting payments immediately.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-8 rounded-xl border border-purple-100">
              <Brain className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI App Generation</h3>
              <p className="text-gray-600">
                Custom business applications generated using AI. From simple websites 
                to complex SaaS platforms - built and deployed automatically.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">How It Works</h2>
          
          <div className="space-y-12">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Business Formation Wizard</h3>
                <p className="text-gray-600">
                  Our AI guides you through business formation with intelligent questions. 
                  We handle LLC/Corp creation, EIN registration, operating agreements, and compliance setup.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Requirements Gathering</h3>
                <p className="text-gray-600">
                  AI-powered interviews understand your business needs and generate comprehensive 
                  product requirements documents (PRDs) and technical specifications.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">AI App Generation</h3>
                <p className="text-gray-600">
                  Custom applications generated using Claude Code and AI development tools. 
                  Automatic GitHub repository creation with deployment pipelines.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Launch & Scale</h3>
                <p className="text-gray-600">
                  Integrated Square payment processing, business banking setup, 
                  and ongoing development support. Your business is ready to operate.
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
                title: "Claude Code Integration",
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
            <h2 className="text-3xl font-bold mb-4">Ready to Launch Your Business?</h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Join the future of business formation. Get incorporated, build your product, 
              and start accepting payments - all in one platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/app"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Rocket className="w-5 h-5" />
                Start Your Business
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