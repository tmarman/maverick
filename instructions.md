# Maverick Platform AI Instructions

## Project Context

You are working on **Maverick**, an AI-powered business development platform that revolutionizes how developers build and launch businesses. This is the core platform codebase that implements the `.maverick` workspace architecture.

## Key Concepts

### The .maverick System
- **Fractal Architecture**: `.maverick` files create nested workspaces (company → product → feature)
- **AI Context Inheritance**: Instructions flow down the hierarchy for contextual assistance
- **Physical = Logical**: Folder structure IS the system architecture
- **Plugin Model**: Custom themes, workflows, and extensions via .maverick configuration

### The Spiral Effect
- Every successful project becomes a template for others
- User needs become platform features automatically
- AI learns from collective usage patterns
- Platform literally builds itself through community intelligence

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 15.4 with React 18.3, TypeScript, Tailwind CSS
- **Backend**: Custom Node.js server with WebSocket support for Claude Code integration
- **Database**: SQL Server with Prisma ORM (cross-database compatibility)
- **Authentication**: NextAuth.js with GitHub and Square OAuth
- **AI Integration**: Claude Code WebSocket sessions, context-aware assistance

### Core Components
- **CockpitShell**: Main dashboard layout with sidebar navigation
- **Workspace Management**: Git-native project organization
- **Template System**: Reusable .maverick patterns for different use cases
- **AI Context System**: Hierarchical instruction inheritance
- **GitHub Integration**: Repository import and project transformation

## Development Guidelines

### Code Standards
- **TypeScript strict mode** - No any types, full type safety
- **Component composition** - Reusable, testable components
- **Tailwind CSS** - Utility-first styling with design system
- **Git-native workflows** - Everything version controlled

### AI Integration Patterns
- **Context-aware suggestions** based on .maverick workspace hierarchy
- **Template-driven generation** using proven patterns
- **Workspace boundary respect** - AI understands project scope
- **Progressive enhancement** - AI improves existing workflows

### Business Logic
- **Square Integration**: Payment processing, business formation, developer tools
- **GitHub Native**: Repositories as first-class projects
- **Template Marketplace**: Community-driven pattern sharing
- **User Namespace**: Projects organized by owner/user structure

## Key Features Currently Implemented

### ✅ Core Platform
- CockpitShell with responsive sidebar navigation
- GitHub repository import and transformation
- Project workspace management
- Documentation system with .maverick guide

### ✅ .maverick System
- JSON schema for workspace configuration
- Template system with startup-root, saas-product, square-app templates
- AI instruction inheritance and context management
- Custom theme and branding support

### ✅ AI Integration
- Claude Code WebSocket integration (planned)
- Goose workspace awareness (designed)
- Context-aware development assistance
- Template extraction from successful projects

### 🚧 In Progress
- Project dashboard and management interface
- Real-time status.md updates
- Advanced template marketplace
- Business formation automation

## Working Principles

### 1. Dogfooding First
- We use Maverick to build Maverick
- This repository has its own .maverick structure
- Every feature we build should solve our own problems first

### 2. Developer Experience
- Local development should be delightful
- AI should enhance, not replace, developer thinking
- Workspace boundaries should be clear and logical

### 3. Community-Driven Evolution
- Templates come from successful real projects
- Features emerge from actual user needs
- Platform grows through collective intelligence

### 4. Business Focus
- Not just a dev tool - a business formation platform
- Square integration for payments and incorporation
- End-to-end from idea to deployed business

## Common Patterns

### Component Creation
- Use Radix UI primitives for accessibility
- Implement responsive design with Tailwind
- Include proper TypeScript interfaces
- Follow existing naming conventions (PascalCase for components)

### API Development
- Use Next.js App Router API routes
- Implement proper error handling and status codes
- Include authentication checks where needed
- Follow RESTful principles

### Database Operations
- Use Prisma for all database interactions
- Include proper error handling
- Use transactions for complex operations
- Maintain SQL Server compatibility

## Testing Strategy
- Component testing with Jest and React Testing Library
- API testing with integration tests
- End-to-end testing for critical workflows
- Performance testing for large workspace hierarchies

## Deployment
- Vercel for hosting and serverless functions
- Azure SQL Database for production data
- Environment-based configuration
- Automated deployments from main branch

## Getting Help
- Check existing patterns in the codebase first
- Refer to .maverick templates for examples
- Use the documentation system at `/docs`
- Follow the established architectural patterns

Remember: We're building a platform that builds itself. Every decision should consider how it contributes to the self-evolving ecosystem.