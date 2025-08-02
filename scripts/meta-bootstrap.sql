-- META Bootstrap Script
-- This represents the current Maverick development as if it was built through the cockpit
-- We're using our own system to build our own system! 🤯

-- Create the Maverick Company (our own company)
INSERT INTO businesses (
    id, 
    ownerId, 
    name, 
    description, 
    businessType, 
    status, 
    squareServices, 
    appFeatures,
    subscriptionPlan,
    createdAt, 
    updatedAt
) VALUES (
    'maverick-company-meta',
    'dev-user', -- Using our mock dev user for now
    'Maverick',
    'AI-native founder platform for service-based businesses - building itself!',
    'service',
    'ACTIVE',
    '["payments", "banking", "pos", "analytics"]',
    '["chat-interface", "ai-agents", "github-integration", "square-payments"]',
    'enterprise',
    GETDATE(),
    GETDATE()
);

-- Create the main App product (maps to our current repository)
INSERT INTO projects (
    id,
    name,
    description,
    type,
    status,
    businessId,
    githubConfig,
    aiAgentConfig,
    metadata,
    createdAt,
    updatedAt
) VALUES (
    'maverick-app-product',
    'App',
    'Main Maverick application - the platform itself',
    'SOFTWARE',
    'ACTIVE',
    'maverick-company-meta',
    '{"repositoryUrl": "https://github.com/user/maverick", "branch": "main", "deploymentUrl": "http://localhost:5001"}',
    '{"primaryAgent": "claude-code", "specializationAreas": ["SOFTWARE", "LEGAL", "OPERATIONS", "MARKETING"]}',
    '{"productPath": "/products/App/", "isMainProduct": true, "selfHosting": true}',
    GETDATE(),
    GETDATE()
);

-- Create a Marketing Website product
INSERT INTO projects (
    id,
    name,
    description,
    type,
    status,
    businessId,
    githubConfig,
    metadata,
    createdAt,
    updatedAt
) VALUES (
    'maverick-marketing-site',
    'MarketingSite',
    'Public marketing website and landing pages',
    'MARKETING',
    'ACTIVE',
    'maverick-company-meta',
    '{"repositoryUrl": "https://github.com/user/maverick-marketing", "branch": "main"}',
    '{"primaryAgent": "marketing-expert"}',
    '{"productPath": "/products/MarketingSite/", "domain": "maverick.com"}',
    GETDATE(),
    GETDATE()
);

-- SOFTWARE FEATURES (representing our actual development work)

-- Magic Link Authentication (DONE - we built this!)
INSERT INTO features (
    id,
    title,
    description,
    status,
    priority,
    functionalArea,
    projectId,
    githubBranch,
    acceptanceCriteria,
    chatHistory,
    estimatedEffort,
    createdAt,
    updatedAt
) VALUES (
    'feature-magic-link-auth',
    'Magic Link Authentication System',
    'Implement passwordless authentication using Azure Communication Services for email delivery',
    'DONE',
    'HIGH',
    'SOFTWARE',
    'maverick-app-product',
    'feature/magic-link-auth',
    '[{"criteria": "Users can sign in with email only", "completed": true}, {"criteria": "Azure Communication Services integration", "completed": true}, {"criteria": "Professional email templates", "completed": true}, {"criteria": "User onboarding flow", "completed": true}]',
    '[{"id": "msg-1", "role": "user", "content": "I need to implement magic link authentication", "timestamp": "2025-08-01T10:00:00Z"}, {"id": "msg-2", "role": "assistant", "content": "I can help you implement magic link authentication. We should use Azure Communication Services for reliable email delivery. Let me break this down into steps...", "timestamp": "2025-08-01T10:01:00Z"}]',
    '1w',
    GETDATE(),
    GETDATE()
);

-- Cockpit Interface (DONE - we just built this!)
INSERT INTO features (
    id,
    title,
    description,
    status,
    priority,
    functionalArea,
    projectId,
    acceptanceCriteria,
    chatHistory,
    estimatedEffort,
    createdAt,
    updatedAt
) VALUES (
    'feature-cockpit-interface',
    'Product Building Cockpit Interface',
    'Chat-centric interface for managing Company → Product → Feature hierarchy',
    'DONE',
    'HIGH',
    'SOFTWARE',
    'maverick-app-product',
    '[{"criteria": "Company/Product/Feature hierarchy", "completed": true}, {"criteria": "Functional area organization", "completed": true}, {"criteria": "Chat interface for each feature", "completed": true}, {"criteria": "Status tracking and visualization", "completed": true}]',
    '[{"id": "msg-3", "role": "user", "content": "We need a cockpit interface to manage product development", "timestamp": "2025-08-01T11:00:00Z"}, {"id": "msg-4", "role": "assistant", "content": "Perfect! Let me create a comprehensive cockpit interface with Company → Product → Feature hierarchy...", "timestamp": "2025-08-01T11:01:00Z"}]',
    '2w',
    GETDATE(),
    GETDATE()
);

-- Database Integration (IN_PROGRESS - what we're doing now!)  
INSERT INTO features (
    id,
    title,
    description,
    status,
    priority,
    functionalArea,
    projectId,
    acceptanceCriteria,
    chatHistory,
    estimatedEffort,
    createdAt,
    updatedAt
) VALUES (
    'feature-database-integration',
    'Database Integration for Cockpit',
    'Replace mock data with real database calls and create META bootstrap',
    'IN_PROGRESS',
    'HIGH',
    'SOFTWARE',
    'maverick-app-product',
    '[{"criteria": "API routes for companies/products/features", "completed": false}, {"criteria": "Database schema updates", "completed": true}, {"criteria": "META SQL bootstrap script", "completed": true}]',
    '[{"id": "msg-5", "role": "user", "content": "We need to store cockpit data in the database and create a META bootstrap", "timestamp": "2025-08-01T12:00:00Z"}, {"id": "msg-6", "role": "assistant", "content": "Brilliant idea! Using our own system to build itself. Let me create the database integration...", "timestamp": "2025-08-01T12:01:00Z"}]',
    '3d',
    GETDATE(),
    GETDATE()
);

-- Square Payment Integration
INSERT INTO features (
    id,
    title,
    description,
    status,
    priority,
    functionalArea,
    projectId,
    githubBranch,
    acceptanceCriteria,
    estimatedEffort,
    createdAt,
    updatedAt
) VALUES (
    'feature-square-payments',
    'Square Payment Integration',
    'Integrate Square Web Payments SDK for business formation payments',
    'IN_PROGRESS',
    'HIGH',
    'SOFTWARE',
    'maverick-app-product',
    'feature/square-integration',
    '[{"criteria": "Square Web Payments SDK integration", "completed": true}, {"criteria": "Business formation checkout flow", "completed": false}, {"criteria": "Subscription management", "completed": false}]',
    '2w',
    GETDATE(),
    GETDATE()
);

-- AI Agent System
INSERT INTO features (
    id,
    title,
    description,
    status,
    priority,
    functionalArea,
    projectId,
    acceptanceCriteria,
    estimatedEffort,
    createdAt,
    updatedAt
) VALUES (
    'feature-ai-agents',
    'AI Agent System with Claude Code',
    'Configurable AI agents for different functional areas with Claude Code integration',
    'PLANNED',
    'HIGH',
    'SOFTWARE',
    'maverick-app-product',
    '[{"criteria": "Claude Code integration", "completed": false}, {"criteria": "Specialized agents (Software, Legal, etc)", "completed": false}, {"criteria": "Context-aware conversations", "completed": false}]',
    '1w',
    GETDATE(),
    GETDATE()
);

-- LEGAL FEATURES

-- Privacy Policy & Terms
INSERT INTO features (
    id,
    title,
    description,
    status,
    priority,
    functionalArea,
    projectId,
    acceptanceCriteria,
    estimatedEffort,
    createdAt,
    updatedAt
) VALUES (
    'feature-legal-docs',
    'Privacy Policy & Terms of Service',
    'Generate compliant legal documents for the platform',
    'PLANNED',
    'MEDIUM',
    'LEGAL',
    'maverick-app-product',
    '[{"criteria": "GDPR compliant privacy policy", "completed": false}, {"criteria": "Terms of service for SaaS", "completed": false}, {"criteria": "Cookie policy", "completed": false}]',
    '1w',
    GETDATE(),
    GETDATE()
);

-- OPERATIONS FEATURES

-- GitHub Repository Management
INSERT INTO features (
    id,
    title,
    description,
    status,
    priority,
    functionalArea,
    projectId,
    acceptanceCriteria,
    estimatedEffort,
    createdAt,
    updatedAt
) VALUES (
    'feature-github-ops',
    'GitHub Repository Operations',
    'Automated repository management, deployments, and code synchronization',
    'PLANNED',
    'MEDIUM',
    'OPERATIONS',
    'maverick-app-product',
    '[{"criteria": "Automated deployments", "completed": false}, {"criteria": "Branch management", "completed": false}, {"criteria": "Code generation sync", "completed": false}]',
    '2w',
    GETDATE(),
    GETDATE()
);

-- MARKETING FEATURES

-- Landing Page Optimization
INSERT INTO features (
    id,
    title,
    description,
    status,
    priority,
    functionalArea,
    projectId,
    acceptanceCriteria,
    estimatedEffort,
    createdAt,
    updatedAt
) VALUES (
    'feature-landing-optimization',
    'Landing Page Conversion Optimization',
    'Improve conversion rates and messaging clarity on homepage',
    'PLANNED',
    'MEDIUM', 
    'MARKETING',
    'maverick-marketing-site',
    '[{"criteria": "A/B test different CTAs", "completed": false}, {"criteria": "Optimize messaging hierarchy", "completed": false}, {"criteria": "Add social proof elements", "completed": false}]',
    '1w',
    GETDATE(),
    GETDATE()
);

-- META: This script represents our current development state as if we had built it through our own cockpit!
-- Now we can use the cockpit to continue building itself 🎯