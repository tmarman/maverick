#!/usr/bin/env node

/**
 * Execute META Bootstrap SQL
 * Loads our current development state into the database
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')

async function executeMetaBootstrap() {
  console.log('🤯 Executing META Bootstrap SQL')
  console.log('===============================')
  
  try {
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    console.log('📡 Connected to database...')
    
    // Instead of raw SQL, let's use Prisma to create the records
    // This ensures proper data types and relationships
    
    // First create a dev user if it doesn't exist
    console.log('👤 Creating/finding dev user...')
    const devUser = await prisma.user.upsert({
      where: { email: 'developer@localhost' },
      update: {},
      create: {
        id: 'dev-user',
        email: 'developer@localhost',
        name: 'Developer',
        onboardingCompleted: true
      }
    })
    console.log('✅ Dev user ready')
    
    console.log('🏢 Creating Maverick Company...')
    const company = await prisma.business.create({
      data: {
        id: 'maverick-company-meta',
        ownerId: devUser.id,
        name: 'Maverick',
        description: 'AI-native founder platform for service-based businesses - building itself!',
        businessType: 'service',
        status: 'ACTIVE',
        squareServices: '["payments", "banking", "pos", "analytics"]',
        appFeatures: '["chat-interface", "ai-agents", "github-integration", "square-payments"]',
        subscriptionPlan: 'enterprise',
        subscriptionStatus: 'ACTIVE'
      }
    })
    console.log('✅ Company created:', company.name)
    
    console.log('📱 Creating App product...')
    const appProduct = await prisma.project.create({
      data: {
        id: 'maverick-app-product',
        name: 'App',
        description: 'Main Maverick application - the platform itself',
        type: 'SOFTWARE',
        status: 'ACTIVE',
        businessId: company.id,
        githubConfig: '{"repositoryUrl": "https://github.com/user/maverick", "branch": "main", "deploymentUrl": "http://localhost:5001"}',
        aiAgentConfig: '{"primaryAgent": "claude-code", "specializationAreas": ["SOFTWARE", "LEGAL", "OPERATIONS", "MARKETING"]}',
        metadata: '{"productPath": "/products/App/", "isMainProduct": true, "selfHosting": true}'
      }
    })
    console.log('✅ App product created')
    
    console.log('🌐 Creating MarketingSite product...')
    const marketingProduct = await prisma.project.create({
      data: {
        id: 'maverick-marketing-site',
        name: 'MarketingSite',
        description: 'Public marketing website and landing pages',
        type: 'MARKETING',
        status: 'ACTIVE',
        businessId: company.id,
        githubConfig: '{"repositoryUrl": "https://github.com/user/maverick-marketing", "branch": "main"}',
        aiAgentConfig: '{"primaryAgent": "marketing-expert"}',
        metadata: '{"productPath": "/products/MarketingSite/", "domain": "maverick.com"}'
      }
    })
    console.log('✅ MarketingSite product created')
    
    console.log('⚡ Creating SOFTWARE features...')
    
    // Magic Link Auth (DONE)
    await prisma.feature.create({
      data: {
        id: 'feature-magic-link-auth',
        title: 'Magic Link Authentication System',
        description: 'Implement passwordless authentication using Azure Communication Services for email delivery',
        status: 'DONE',
        priority: 'HIGH',
        functionalArea: 'SOFTWARE',
        projectId: appProduct.id,
        githubBranch: 'feature/magic-link-auth',
        acceptanceCriteria: '[{"criteria": "Users can sign in with email only", "completed": true}, {"criteria": "Azure Communication Services integration", "completed": true}, {"criteria": "Professional email templates", "completed": true}, {"criteria": "User onboarding flow", "completed": true}]',
        chatHistory: '[{"id": "msg-1", "role": "user", "content": "I need to implement magic link authentication", "timestamp": "2025-08-01T10:00:00Z"}, {"id": "msg-2", "role": "assistant", "content": "I can help you implement magic link authentication. We should use Azure Communication Services for reliable email delivery. Let me break this down into steps...", "timestamp": "2025-08-01T10:01:00Z"}]',
        estimatedEffort: '1w'
      }
    })
    
    // Cockpit Interface (DONE)
    await prisma.feature.create({
      data: {
        id: 'feature-cockpit-interface',
        title: 'Product Building Cockpit Interface',
        description: 'Chat-centric interface for managing Company → Product → Feature hierarchy',
        status: 'DONE',
        priority: 'HIGH',
        functionalArea: 'SOFTWARE',
        projectId: appProduct.id,
        acceptanceCriteria: '[{"criteria": "Company/Product/Feature hierarchy", "completed": true}, {"criteria": "Functional area organization", "completed": true}, {"criteria": "Chat interface for each feature", "completed": true}, {"criteria": "Status tracking and visualization", "completed": true}]',
        chatHistory: '[{"id": "msg-3", "role": "user", "content": "We need a cockpit interface to manage product development", "timestamp": "2025-08-01T11:00:00Z"}, {"id": "msg-4", "role": "assistant", "content": "Perfect! Let me create a comprehensive cockpit interface with Company → Product → Feature hierarchy...", "timestamp": "2025-08-01T11:01:00Z"}]',
        estimatedEffort: '2w'
      }
    })
    
    // Database Integration (IN_PROGRESS)
    await prisma.feature.create({
      data: {
        id: 'feature-database-integration',
        title: 'Database Integration for Cockpit',
        description: 'Replace mock data with real database calls and create META bootstrap',
        status: 'DONE', // We just completed this!
        priority: 'HIGH',
        functionalArea: 'SOFTWARE',
        projectId: appProduct.id,
        acceptanceCriteria: '[{"criteria": "API routes for companies/products/features", "completed": true}, {"criteria": "Database schema updates", "completed": true}, {"criteria": "META SQL bootstrap script", "completed": true}]',
        chatHistory: '[{"id": "msg-5", "role": "user", "content": "We need to store cockpit data in the database and create a META bootstrap", "timestamp": "2025-08-01T12:00:00Z"}, {"id": "msg-6", "role": "assistant", "content": "Brilliant idea! Using our own system to build itself. Let me create the database integration...", "timestamp": "2025-08-01T12:01:00Z"}]',
        estimatedEffort: '3d'
      }
    })
    
    // Square Payments (IN_PROGRESS)
    await prisma.feature.create({
      data: {
        id: 'feature-square-payments',
        title: 'Square Payment Integration',
        description: 'Integrate Square Web Payments SDK for business formation payments',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        functionalArea: 'SOFTWARE',
        projectId: appProduct.id,
        githubBranch: 'feature/square-integration',
        acceptanceCriteria: '[{"criteria": "Square Web Payments SDK integration", "completed": true}, {"criteria": "Business formation checkout flow", "completed": false}, {"criteria": "Subscription management", "completed": false}]',
        estimatedEffort: '2w'
      }
    })
    
    // AI Agents (PLANNED)
    await prisma.feature.create({
      data: {
        id: 'feature-ai-agents',
        title: 'AI Agent System with Claude Code',
        description: 'Configurable AI agents for different functional areas with Claude Code integration',
        status: 'PLANNED',
        priority: 'HIGH',
        functionalArea: 'SOFTWARE',
        projectId: appProduct.id,
        acceptanceCriteria: '[{"criteria": "Claude Code integration", "completed": false}, {"criteria": "Specialized agents (Software, Legal, etc)", "completed": false}, {"criteria": "Context-aware conversations", "completed": false}]',
        estimatedEffort: '1w'
      }
    })
    
    console.log('⚖️ Creating LEGAL features...')
    await prisma.feature.create({
      data: {
        id: 'feature-legal-docs',
        title: 'Privacy Policy & Terms of Service',
        description: 'Generate compliant legal documents for the platform',
        status: 'PLANNED',
        priority: 'MEDIUM',
        functionalArea: 'LEGAL',
        projectId: appProduct.id,
        acceptanceCriteria: '[{"criteria": "GDPR compliant privacy policy", "completed": false}, {"criteria": "Terms of service for SaaS", "completed": false}, {"criteria": "Cookie policy", "completed": false}]',
        estimatedEffort: '1w'
      }
    })
    
    console.log('🔧 Creating OPERATIONS features...')
    await prisma.feature.create({
      data: {
        id: 'feature-github-ops',
        title: 'GitHub Repository Operations',
        description: 'Automated repository management, deployments, and code synchronization',
        status: 'PLANNED',
        priority: 'MEDIUM',
        functionalArea: 'OPERATIONS',
        projectId: appProduct.id,
        acceptanceCriteria: '[{"criteria": "Automated deployments", "completed": false}, {"criteria": "Branch management", "completed": false}, {"criteria": "Code generation sync", "completed": false}]',
        estimatedEffort: '2w'
      }
    })
    
    console.log('📈 Creating MARKETING features...')
    await prisma.feature.create({
      data: {
        id: 'feature-landing-optimization',
        title: 'Landing Page Conversion Optimization',
        description: 'Improve conversion rates and messaging clarity on homepage',
        status: 'PLANNED',
        priority: 'MEDIUM',
        functionalArea: 'MARKETING',
        projectId: marketingProduct.id,
        acceptanceCriteria: '[{"criteria": "A/B test different CTAs", "completed": false}, {"criteria": "Optimize messaging hierarchy", "completed": false}, {"criteria": "Add social proof elements", "completed": false}]',
        estimatedEffort: '1w'
      }
    })
    
    console.log('')
    console.log('🎉 META Bootstrap Complete!')
    console.log('============================')
    console.log('✅ 1 Company: Maverick')
    console.log('✅ 2 Products: App + MarketingSite')
    console.log('✅ 8 Features across 4 functional areas')
    console.log('✅ Chat history with development conversations')
    console.log('')
    console.log('🚀 Now visit http://localhost:5001/cockpit to see the magic!')
    console.log('🤯 You\'re now using Maverick to build Maverick!')
    
    await prisma.$disconnect()
    
  } catch (error) {
    console.error('❌ Bootstrap failed:', error)
    
    if (error.code === 'P2002') {
      console.log('💡 Records may already exist. This is normal if running multiple times.')
    }
  }
}

executeMetaBootstrap()