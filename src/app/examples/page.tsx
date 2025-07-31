'use client'

import { useState } from 'react'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'

type AppCategory = 'all' | 'ecommerce' | 'saas' | 'services' | 'food' | 'booking'

export default function ExamplesPage() {
  const [selectedCategory, setSelectedCategory] = useState<AppCategory>('all')

  const categories = [
    { id: 'all' as AppCategory, label: 'All Apps', count: 12 },
    { id: 'ecommerce' as AppCategory, label: 'E-commerce', count: 3 },
    { id: 'saas' as AppCategory, label: 'SaaS', count: 2 },
    { id: 'services' as AppCategory, label: 'Services', count: 3 },
    { id: 'food' as AppCategory, label: 'Food & Beverage', count: 2 },
    { id: 'booking' as AppCategory, label: 'Booking', count: 2 }
  ]

  const apps = [
    {
      id: 1,
      name: 'Brew & Bytes Coffee',
      category: 'food' as AppCategory,
      description: 'Coffee shop with online ordering, mobile app, and loyalty program integration',
      image: '☕',
      revenue: '$47K',
      period: '3 months',
      features: ['Online Ordering', 'Mobile App', 'Loyalty Program', 'POS Integration', 'Analytics'],
      squareServices: ['Payments', 'POS', 'Customer Directory', 'Marketing'],
      url: 'brewbytescoffee.com',
      launchDate: '2024-01-15',
      businessType: 'Physical + Online',
      stats: {
        customers: '2,340',
        orders: '8,670',
        rating: '4.9'
      }
    },
    {
      id: 2,
      name: 'TaskFlow Pro',
      category: 'saas' as AppCategory,
      description: 'Project management SaaS with team collaboration and time tracking',
      image: '📋',
      revenue: '$89K',
      period: '4 months',
      features: ['Team Management', 'Time Tracking', 'Project Analytics', 'API Integration', 'Mobile App'],
      squareServices: ['Payments', 'Subscriptions', 'Customer API', 'Analytics'],
      url: 'taskflowpro.com',
      launchDate: '2023-11-20',
      businessType: 'SaaS Platform',
      stats: {
        customers: '1,250',
        orders: '1,250',
        rating: '4.7'
      }
    },
    {
      id: 3,
      name: 'Bella Boutique',
      category: 'ecommerce' as AppCategory,
      description: 'Fashion e-commerce with AR try-on, subscription boxes, and social shopping',
      image: '👗',
      revenue: '$156K',
      period: '6 months',
      features: ['AR Try-On', 'Subscription Boxes', 'Social Shopping', 'Inventory Management', 'Multi-channel'],
      squareServices: ['Payments', 'Catalog', 'Inventory', 'Marketing', 'Analytics'],
      url: 'bellaboutique.com',
      launchDate: '2023-08-10',
      businessType: 'E-commerce',
      stats: {
        customers: '4,890',
        orders: '12,340',
        rating: '4.8'
      }
    },
    {
      id: 4,
      name: 'QuickCuts Salon',
      category: 'services' as AppCategory,
      description: 'Hair salon with online booking, staff management, and customer profiles',
      image: '✂️',
      revenue: '$34K',
      period: '2 months',
      features: ['Online Booking', 'Staff Scheduling', 'Customer Profiles', 'Service Catalog', 'SMS Reminders'],
      squareServices: ['Payments', 'Team', 'Customer Directory', 'Appointments'],
      url: 'quickcutssalon.com',
      launchDate: '2024-02-01',
      businessType: 'Service Business',
      stats: {
        customers: '890',
        orders: '2,340',
        rating: '4.9'
      }
    },
    {
      id: 5,
      name: 'FitLife Coaching',
      category: 'services' as AppCategory,
      description: 'Personal training platform with workout plans, nutrition tracking, and video calls',
      image: '💪',
      revenue: '$67K',
      period: '5 months',
      features: ['Workout Plans', 'Nutrition Tracking', 'Video Calls', 'Progress Analytics', 'Community'],
      squareServices: ['Payments', 'Subscriptions', 'Customer API', 'Video'],
      url: 'fitlifecoaching.com',
      launchDate: '2023-10-15',
      businessType: 'Online Services',
      stats: {
        customers: '1,890',
        orders: '1,890',
        rating: '4.8'
      }
    },
    {
      id: 6,
      name: 'TechRepair Hub',
      category: 'services' as AppCategory,
      description: 'Device repair service with diagnostics, parts ordering, and pickup/delivery',
      image: '🔧',
      revenue: '$78K',
      period: '4 months',
      features: ['Repair Diagnostics', 'Parts Ordering', 'Pickup/Delivery', 'Status Tracking', 'Warranty'],
      squareServices: ['Payments', 'Catalog', 'Team', 'Customer Directory'],
      url: 'techrepairhub.com',
      launchDate: '2023-12-01',
      businessType: 'Service + E-commerce',
      stats: {
        customers: '2,340',
        orders: '4,560',
        rating: '4.7'
      }
    },
    {
      id: 7,
      name: 'Urban Eats',
      category: 'food' as AppCategory,
      description: 'Ghost kitchen with multiple brands, delivery optimization, and kitchen management',
      image: '🍔',
      revenue: '$234K',
      period: '8 months',
      features: ['Multi-brand Kitchen', 'Delivery Optimization', 'Kitchen Display', 'Menu Management', 'Analytics'],
      squareServices: ['Payments', 'POS', 'Catalog', 'Team', 'Analytics'],
      url: 'urbaneats.com',
      launchDate: '2023-06-15',
      businessType: 'Food Delivery',
      stats: {
        customers: '8,940',
        orders: '23,450',
        rating: '4.6'
      }
    },
    {
      id: 8,
      name: 'HomeStyle Marketplace',
      category: 'ecommerce' as AppCategory,
      description: 'Multi-vendor marketplace for handmade goods with seller tools and commission tracking',
      image: '🏠',
      revenue: '$189K',
      period: '7 months',
      features: ['Multi-vendor', 'Seller Dashboard', 'Commission Tracking', 'Quality Control', 'Shipping'],
      squareServices: ['Payments', 'Catalog', 'Customer API', 'Analytics', 'Payouts'],
      url: 'homestyle-marketplace.com',
      launchDate: '2023-07-20',
      businessType: 'Marketplace',
      stats: {
        customers: '12,340',
        orders: '18,670',
        rating: '4.5'
      }
    },
    {
      id: 9,
      name: 'DataSync Pro',
      category: 'saas' as AppCategory,
      description: 'Business intelligence SaaS with data integration, dashboards, and automated reporting',
      image: '📊',
      revenue: '$145K',
      period: '6 months',
      features: ['Data Integration', 'Custom Dashboards', 'Automated Reports', 'API Connectors', 'White-label'],
      squareServices: ['Payments', 'Subscriptions', 'Customer API', 'Analytics'],
      url: 'datasyncpro.com',
      launchDate: '2023-08-30',
      businessType: 'Enterprise SaaS',
      stats: {
        customers: '340',
        orders: '340',
        rating: '4.8'
      }
    },
    {
      id: 10,
      name: 'BookMed',
      category: 'booking' as AppCategory,
      description: 'Medical appointment booking with patient records, telemedicine, and billing integration',
      image: '🏥',
      revenue: '$98K',
      period: '5 months',
      features: ['Appointment Booking', 'Patient Records', 'Telemedicine', 'Insurance Billing', 'Reminders'],
      squareServices: ['Payments', 'Customer Directory', 'Team', 'Appointments'],
      url: 'bookmed.app',
      launchDate: '2023-10-01',
      businessType: 'Healthcare Platform',
      stats: {
        customers: '3,450',
        orders: '8,900',
        rating: '4.9'
      }
    },
    {
      id: 11,
      name: 'EventSpace',
      category: 'booking' as AppCategory,
      description: 'Event venue booking platform with virtual tours, catering, and event management',  
      image: '🎉',
      revenue: '$123K',
      period: '6 months',
      features: ['Venue Booking', 'Virtual Tours', 'Catering Management', 'Event Planning', 'Guest Lists'],
      squareServices: ['Payments', 'Customer Directory', 'Catalog', 'Analytics'],
      url: 'eventspace.co',
      launchDate: '2023-09-15',
      businessType: 'Event Platform',
      stats: {
        customers: '1,890',
        orders: '890',
        rating: '4.7'
      }
    },
    {
      id: 12,
      name: 'GreenThumb Garden Store',
      category: 'ecommerce' as AppCategory,
      description: 'Plant e-commerce with care guides, subscription boxes, and local delivery',
      image: '🌱',
      revenue: '$45K',
      period: '3 months',
      features: ['Plant Care Guides', 'Subscription Boxes', 'Local Delivery', 'Plant ID', 'Community'],
      squareServices: ['Payments', 'Catalog', 'Subscriptions', 'Customer Directory'],
      url: 'greenthumb-garden.com',
      launchDate: '2024-01-10',
      businessType: 'E-commerce + Subscription',
      stats: {
        customers: '2,340',
        orders: '4,670',
        rating: '4.8'
      }
    }
  ]

  const filteredApps = selectedCategory === 'all' 
    ? apps 
    : apps.filter(app => app.category === selectedCategory)

  return (
    <div className="min-h-screen bg-background-primary">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Generated Apps Portfolio
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Real businesses built with Maverick. From coffee shops to SaaS platforms, 
            see what's possible when AI meets Square integration.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-accent-primary text-text-inverse'
                  : 'bg-background-secondary text-text-secondary hover:bg-background-tertiary'
              }`}
            >
              {category.label} ({category.count})
            </button>
          ))}
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredApps.map((app) => (
            <div key={app.id} className="bg-background-secondary rounded-2xl p-6 border border-border-subtle hover:shadow-lg transition-all group">
              {/* App Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">{app.image}</div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-500">{app.revenue}</div>
                  <div className="text-xs text-text-muted">{app.period}</div>
                </div>
              </div>

              {/* App Info */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-text-primary mb-2">{app.name}</h3>
                <p className="text-text-secondary text-sm mb-3">{app.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">{app.businessType}</span>
                  <span className="text-text-muted">Launched {new Date(app.launchDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-background-tertiary rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-text-primary">{app.stats.customers}</div>
                  <div className="text-xs text-text-muted">Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-text-primary">{app.stats.orders}</div>
                  <div className="text-xs text-text-muted">Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-500">{app.stats.rating}★</div>
                  <div className="text-xs text-text-muted">Rating</div>
                </div>
              </div>

              {/* Features */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-text-primary mb-2">Key Features</h4>
                <div className="flex flex-wrap gap-1">
                  {app.features.slice(0, 3).map((feature, index) => (
                    <span key={index} className="px-2 py-1 bg-background-primary text-text-secondary text-xs rounded">
                      {feature}
                    </span>
                  ))}
                  {app.features.length > 3 && (
                    <span className="px-2 py-1 bg-background-primary text-text-secondary text-xs rounded">
                      +{app.features.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Square Services */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-text-primary mb-2">Square Integration</h4>
                <div className="flex flex-wrap gap-1">
                  {app.squareServices.map((service, index) => (
                    <span key={index} className="px-2 py-1 bg-accent-primary bg-opacity-10 text-accent-primary text-xs rounded">
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="flex space-x-2">
                <button className="flex-1 py-2 text-sm font-medium text-text-primary border border-border-standard rounded-lg hover:bg-background-tertiary transition-colors">
                  View Details
                </button>
                <button className="flex-1 py-2 text-sm font-medium bg-accent-primary text-text-inverse rounded-lg hover:bg-accent-hover transition-colors">
                  Visit Site
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center bg-background-secondary rounded-2xl p-12 border border-border-subtle">
          <h2 className="text-3xl font-bold text-text-primary mb-4">
            Ready to Build Your App?
          </h2>
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Join these successful businesses. Start with your idea, and we'll build 
            everything else - from legal formation to custom software.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/wizard"
              className="px-8 py-4 bg-accent-primary text-text-inverse font-semibold rounded-lg hover:bg-accent-hover transition-colors"
            >
              🚀 Start My Business
            </Link>
            <Link 
              href="/demo"
              className="px-8 py-4 border border-border-standard text-text-primary font-semibold rounded-lg hover:bg-background-tertiary transition-colors"
            >
              🎯 Watch Demo
            </Link>
          </div>
        </div>

        {/* Success Metrics */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-accent-primary mb-2">$1.2M+</div>
            <div className="text-text-secondary">Total Revenue Generated</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-accent-primary mb-2">12</div>
            <div className="text-text-secondary">Businesses Launched</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-accent-primary mb-2">38,000+</div>
            <div className="text-text-secondary">Happy Customers</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-accent-primary mb-2">4.8★</div>
            <div className="text-text-secondary">Average Rating</div>
          </div>
        </div>
      </div>
    </div>
  )
}