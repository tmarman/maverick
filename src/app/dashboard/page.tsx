'use client'

import { useState } from 'react'
import { Navigation } from '@/components/Navigation'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-background-primary">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Business Dashboard</h1>
          <p className="text-text-secondary mt-2">Manage your Square-powered business from formation to operation</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border-subtle mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'formation', name: 'Formation', icon: '🏢' },
              { id: 'square', name: 'Square Integration', icon: '💳' },
              { id: 'apps', name: 'Generated Apps', icon: '🚀' },
              { id: 'goose', name: 'AI Assistant', icon: '🤖' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-accent-primary text-accent-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-standard'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'formation' && <FormationTab />}
          {activeTab === 'square' && <SquareTab />}
          {activeTab === 'apps' && <AppsTab />}
          {activeTab === 'goose' && <GooseTab />}
        </div>
      </div>
    </div>
  )
}

function OverviewTab() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  
  const revenueData = {
    '7d': { total: 4850, transactions: 127, avgOrder: 38.19, growth: '+18.3%' },
    '30d': { total: 18900, transactions: 487, avgOrder: 38.81, growth: '+24.7%' },
    '90d': { total: 52750, transactions: 1342, avgOrder: 39.31, growth: '+31.2%' }
  }
  
  const currentData = revenueData[selectedPeriod as keyof typeof revenueData]

  return (
    <div className="space-y-8">
      {/* Period Selector */}
      <div className="flex justify-end">
        <div className="flex space-x-2">
          {[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' }
          ].map(period => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period.value
                  ? 'bg-accent-primary text-text-inverse'
                  : 'bg-background-tertiary text-text-secondary hover:bg-border-subtle'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Total Revenue</h3>
            <div className="text-green-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-text-primary mb-2">
            ${currentData.total.toLocaleString()}
          </div>
          <div className="text-sm text-green-500">{currentData.growth} from previous period</div>
        </div>

        <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Transactions</h3>
            <div className="text-blue-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-text-primary mb-2">
            {currentData.transactions.toLocaleString()}
          </div>
          <div className="text-sm text-blue-500">+15.8% from previous period</div>
        </div>

        <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Average Order</h3>
            <div className="text-purple-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-text-primary mb-2">
            ${currentData.avgOrder.toFixed(2)}
          </div>
          <div className="text-sm text-purple-500">+4.2% from previous period</div>
        </div>

        <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Business Health</h3>
            <div className="text-green-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-text-primary mb-2">97.2%</div>
          <div className="text-sm text-green-500">Excellent performance</div>
        </div>
      </div>

      {/* Square Services Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Square Services Status</h3>
          <div className="space-y-4">
            {[
              { service: 'Payment Processing', volume: '$18.9K', transactions: '487 txns', status: 'active', uptime: '99.8%' },
              { service: 'Business Banking', volume: '$52.1K', transactions: 'Account balance', status: 'active', uptime: '100%' },
              { service: 'Point of Sale', volume: '487 sales', transactions: 'In-person', status: 'active', uptime: '99.2%' },
              { service: 'Customer Directory', volume: '234 customers', transactions: 'Active users', status: 'active', uptime: '99.9%' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg border border-border-subtle">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="font-medium text-text-primary">{item.service}</div>
                    <div className="text-sm text-text-secondary">{item.transactions}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-text-primary">{item.volume}</div>
                  <div className="text-sm text-text-muted">{item.uptime} uptime</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Payment Methods Breakdown</h3>
          <div className="space-y-4">
            {[
              { method: 'Credit Cards', amount: '$12,893', percentage: 68, color: 'bg-blue-500' },
              { method: 'Debit Cards', amount: '$4,158', percentage: 22, color: 'bg-green-500' },
              { method: 'Digital Wallets', amount: '$1,512', percentage: 8, color: 'bg-purple-500' },
              { method: 'Cash', amount: '$378', percentage: 2, color: 'bg-yellow-500' }
            ].map((payment, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">{payment.method}</span>
                  <div className="text-right">
                    <div className="text-sm font-bold text-text-primary">{payment.amount}</div>
                    <div className="text-xs text-text-muted">{payment.percentage}%</div>
                  </div>
                </div>
                <div className="w-full bg-background-tertiary rounded-full h-2">
                  <div 
                    className={`${payment.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${payment.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {[
              { customer: 'Sarah Johnson', amount: 45.50, item: 'Monthly subscription + add-ons', time: '3 min ago', method: 'Visa' },
              { customer: 'Mike Chen', amount: 89.99, item: 'Annual premium plan', time: '8 min ago', method: 'Apple Pay' },
              { customer: 'Jennifer Walsh', amount: 23.00, item: 'Basic plan upgrade', time: '12 min ago', method: 'Mastercard' },
              { customer: 'David Rodriguez', amount: 67.50, item: 'Team collaboration tools', time: '18 min ago', method: 'Google Pay' },
              { customer: 'Lisa Anderson', amount: 34.99, item: 'Professional features', time: '25 min ago', method: 'Square Card' }
            ].map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-text-primary">{transaction.customer}</span>
                    <span className="text-sm font-bold text-green-500">+${transaction.amount.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-text-secondary">{transaction.item}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-text-muted">{transaction.time}</span>
                    <span className="text-xs text-text-muted">{transaction.method}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Business Insights</h3>
          <div className="space-y-4">
            <div className="p-4 bg-background-tertiary rounded-lg border border-border-subtle">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary">Customer Satisfaction</span>
                <span className="text-lg font-bold text-green-500">4.9★</span>
              </div>
              <div className="text-xs text-text-secondary">Based on 127 Square reviews</div>
            </div>

            <div className="p-4 bg-background-tertiary rounded-lg border border-border-subtle">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary">Repeat Customer Rate</span>
                <span className="text-lg font-bold text-blue-500">78%</span>
              </div>
              <div className="text-xs text-text-secondary">+12% increase this month</div>
            </div>

            <div className="p-4 bg-background-tertiary rounded-lg border border-border-subtle">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary">Peak Revenue Hours</span>
                <span className="text-lg font-bold text-purple-500">2-4 PM</span>
              </div>
              <div className="text-xs text-text-secondary">35% of daily transactions</div>
            </div>

            <div className="p-4 bg-background-tertiary rounded-lg border border-border-subtle">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary">Square Processing Fees</span>
                <span className="text-lg font-bold text-text-primary">$549</span>
              </div>
              <div className="text-xs text-text-secondary">2.9% effective rate this month</div>
            </div>
          </div>
        </div>
      </div>

      {/* Formation Status Summary */}
      <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Business Formation Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h4 className="font-semibold text-text-primary">TaskFlow, Inc.</h4>
            <p className="text-sm text-text-secondary">Delaware C-Corporation</p>
            <p className="text-xs text-green-500 mt-2">Formation Complete</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
              </svg>
            </div>
            <h4 className="font-semibold text-text-primary">Square Integration</h4>
            <p className="text-sm text-text-secondary">All APIs Connected</p>
            <p className="text-xs text-green-500 mt-2">Fully Operational</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h4 className="font-semibold text-text-primary">Generated Apps</h4>
            <p className="text-sm text-text-secondary">3 Applications</p> 
            <p className="text-xs text-blue-500 mt-2">2 Live, 1 Development</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FormationTab() {
  return (
    <div className="space-y-6">
      <div className="bg-background-secondary rounded-lg p-6 border border-border-subtle">
        <h3 className="text-xl font-semibold text-text-primary mb-4">Company Formation Progress</h3>
        
        <div className="space-y-4">
          {[
            { step: 'Document Generation', status: 'complete', description: 'Articles of Incorporation, Bylaws, Board Resolutions' },
            { step: 'Legal Review', status: 'complete', description: 'Documents reviewed and approved' },
            { step: 'State Filing', status: 'complete', description: 'Filed with Delaware Division of Corporations' },
            { step: 'EIN Registration', status: 'complete', description: 'Federal tax ID obtained from IRS' },
            { step: 'Banking Setup', status: 'complete', description: 'Square business banking account opened' },
            { step: 'Compliance Setup', status: 'in-progress', description: 'Annual compliance monitoring activated' },
          ].map((item, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                item.status === 'complete' ? 'bg-green-500' : 
                item.status === 'in-progress' ? 'bg-yellow-500' : 'bg-border-standard'
              }`}>
                {item.status === 'complete' ? '✓' : index + 1}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-text-primary">{item.step}</h4>
                <p className="text-sm text-text-secondary">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SquareTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-background-secondary rounded-lg p-6 border border-border-subtle">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Square Banking</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-secondary">Account Balance</span>
              <span className="font-semibold text-text-primary">$8,234.50</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Pending Deposits</span>
              <span className="font-semibold text-text-primary">$1,250.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Monthly Volume</span>
              <span className="font-semibold text-text-primary">$12,450.00</span>
            </div>
          </div>
        </div>

        <div className="bg-background-secondary rounded-lg p-6 border border-border-subtle">
          <h3 className="text-lg font-semibold text-text-primary mb-4">API Integration Status</h3>
          <div className="space-y-3">
            {[
              { api: 'Payments API', status: 'active', transactions: '450' },
              { api: 'Catalog API', status: 'active', transactions: '12' },
              { api: 'Customers API', status: 'active', transactions: '89' },
              { api: 'Orders API', status: 'active', transactions: '445' },
            ].map((api, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-text-primary">{api.api}</span>
                </div>
                <span className="text-sm text-text-secondary">{api.transactions} calls</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AppsTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        {
          name: 'TaskFlow Web App',
          type: 'SaaS Platform',
          status: 'deployed',
          url: 'https://taskflow.com',
          revenue: '$8,450',
          apis: ['Payments', 'Customers', 'Subscriptions']
        },
        {
          name: 'TaskFlow Mobile',
          type: 'Mobile App',
          status: 'deployed', 
          url: 'App Store',
          revenue: '$3,200',
          apis: ['In-App Payments', 'Orders']
        },
        {
          name: 'Admin Dashboard',
          type: 'Internal Tool',
          status: 'development',
          url: 'In development',
          revenue: '$0',
          apis: ['Analytics', 'Reporting']
        },
      ].map((app, index) => (
        <div key={index} className="bg-background-secondary rounded-lg p-6 border border-border-subtle">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">{app.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              app.status === 'deployed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {app.status}
            </span>
          </div>
          
          <p className="text-text-secondary text-sm mb-3">{app.type}</p>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Revenue</span>
              <span className="font-medium text-text-primary">{app.revenue}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">URL</span>
              <span className="font-medium text-text-primary truncate">{app.url}</span>
            </div>
          </div>

          <div>
            <p className="text-xs text-text-muted mb-2">Square APIs:</p>
            <div className="flex flex-wrap gap-1">
              {app.apis.map((api, apiIndex) => (
                <span key={apiIndex} className="px-2 py-1 bg-background-tertiary rounded text-xs text-text-secondary">
                  {api}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function GooseTab() {
  return (
    <div className="space-y-6">
      <div className="bg-background-secondary rounded-lg p-6 border border-border-subtle">
        <h3 className="text-xl font-semibold text-text-primary mb-4">AI Assistant Integration</h3>
        <p className="text-text-secondary mb-6">
          Your business is fully integrated with Goose AI. You can manage formation, Square operations, 
          and app generation through natural language commands.
        </p>

        <div className="space-y-4">
          <div className="bg-background-tertiary rounded-lg p-4">
            <h4 className="font-medium text-text-primary mb-2">Available Commands</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <span className="text-text-muted">•</span>
                <span className="text-text-secondary">"Check my company formation status"</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-text-muted">•</span>
                <span className="text-text-secondary">"Show Square revenue for last month"</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-text-muted">•</span>
                <span className="text-text-secondary">"Generate a new mobile app for my business"</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-text-muted">•</span>
                <span className="text-text-secondary">"Add inventory management to my existing app"</span>
              </div>
            </div>
          </div>

          <div className="bg-background-tertiary rounded-lg p-4">
            <h4 className="font-medium text-text-primary mb-2">Recent AI Actions</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Generated admin dashboard</span>
                <span className="text-text-muted">2 hours ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Updated payment processing</span>
                <span className="text-text-muted">1 day ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Added customer analytics</span>
                <span className="text-text-muted">3 days ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}