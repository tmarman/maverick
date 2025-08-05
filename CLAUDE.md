# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📁 File Organization Rules (TEMPLATE STANDARDS)

**CRITICAL**: This repository serves as a template - maintain strict organization standards.

### Project Structure Standards
- **Keep root directory clean** - only essential config files at root level
- **Use /project for all documentation** - organized by function/purpose
- **Scripts go in /scripts** - organized by purpose (testing, setup, deployment)
- **Follow consistent naming** - kebab-case for files, PascalCase for components

### Required Directory Structure
```
/project/
  /docs/           # Technical documentation, architecture
  /setup/          # Setup guides, installation instructions  
  /deployment/     # Deployment configs, environment setup
  /marketing.md    # Business/marketing content
  /pricing-strategy.md
  /specifications.md

/scripts/         # Utility scripts organized by purpose
  /test-*.js      # Testing utilities
  /debug-*.js     # Debugging tools
  /setup-*.js     # Setup automation

Root level: Only package.json, README.md, CLAUDE.md, and essential config files
```

### Documentation Organization Rules
- **Technical specs** → `/project/docs/`
- **Setup guides** → `/project/setup/`
- **Deployment** → `/project/deployment/`
- **Business docs** → `/project/` (root level of project folder)

**⚠️ NEVER create .md files in root** - always organize into proper /project subdirectories

## Commit Notes
- When committing, use "Created with Maverick" and no other co-authored notes
- **NEVER add "Co-authored-by: Claude" or any AI mentions to commit messages**
- **Do not mention Claude in any commit messages**
- All commits will show "Created with Maverick" and will not mention Claude or any other AI system. No mention of Claude, as we'll probably swap out and use multiple models here

## Development Commands

### Core Development
- `npm run dev` - Start development server on port 5001 (uses custom Node.js server)
- `npm run dev:next` - Start Next.js dev server directly
- `npm run build` - Build the application for production
- `npm run start` - Start production server

### Code Quality
- `npm run lint` - Run ESLint checks
- `npm run type-check` - Run TypeScript type checking

### **CRITICAL**: Always Test Production Builds
- **ALWAYS run `npm run build` before completing any feature** to catch TypeScript compilation errors
- Development mode is more lenient - production builds catch type mismatches, interface conflicts, and iteration issues
- Common issues to watch for:
  - Next.js 15 route parameter types (use `Promise<{ param: string }>`)
  - WorkItem interface consistency across components
  - Variable naming conflicts with Node.js globals
  - TypeScript iteration issues with Map/Set (use `Array.from()`)
- If build fails, fix ALL compilation errors before committing

### Database Operations
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:verify` - Verify database connection and health

## Architecture Overview

### Core Platform
Maverick is an AI-native business formation platform that combines:
- **Business Formation**: Automated LLC/Corp creation with legal docs
- **Square Integration**: Full Square API suite for payments and banking
- **AI App Generation**: Custom business applications using AI
- **Project Management**: Feature development with GitHub integration
- **Claude Code Integration**: Built-in terminal interface for AI development

### Technology Stack
- **Frontend**: Next.js 15.4 with React 18.3, Tailwind CSS
- **Backend**: Custom Node.js server with WebSocket support
- **Database**: SQL Server with Prisma ORM
- **Authentication**: NextAuth.js with custom auth providers
- **APIs**: Square, GitHub, Azure Email integration
- **AI Integration**: Claude Code WebSocket sessions, MCP protocol support

### Custom Server Architecture
The application uses a custom Node.js server (`server.js`) instead of standard Next.js:
- **WebSocket Support**: Real-time Claude Code integration
- **Session Management**: Manages persistent Claude Code sessions
- **Project Isolation**: Each project gets isolated working directory
- **Process Management**: Spawns and manages Claude Code processes

### Database Schema
Uses SQL Server with Prisma ORM for cross-database compatibility:
- **User Management**: NextAuth models + user profiles
- **Business Formation**: Business entities, formation workflows, team management
- **Project Management**: Projects, documents, features with GitHub integration
- **AI Integration**: AI agents, recommendations, chat sessions
- **External Integrations**: Square connections, GitHub connections

### Key Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components
- `src/lib/` - Core business logic and utilities
- `prisma/` - Database schema and migrations
- `scripts/` - Database and setup utilities
- `server.js` - Custom server with WebSocket support

### Authentication Flow
- NextAuth.js with custom auth provider configuration
- Magic link authentication via Azure Email
- Square OAuth integration for business accounts
- GitHub OAuth for repository access
- Session-based auth with database persistence

### AI and Automation
- **Claude Code Integration**: WebSocket-based terminal interface
- **MCP Server**: Exposes business formation capabilities to AI assistants
- **Temporal Workflows**: Long-running business processes
- **AI Agents**: Specialized agents for different business domains
- **Document Generation**: AI-powered business document creation

### Square Integration
Deep integration with Square's business ecosystem:
- **Payment Processing**: Square APIs for transactions
- **Business Banking**: Square banking setup automation
- **Point of Sale**: Terminal API integration
- **Customer Management**: Square Customer API
- **Analytics**: Square business intelligence

### GitHub Integration
Automated development workflow:
- **Repository Creation**: Auto-create repos for generated apps
- **Issue Management**: GitHub Issues API integration
- **Pull Requests**: Automated PR creation and management
- **Branch Management**: Feature branch workflows
- **Code Generation**: AI-generated code with GitHub deployment

### Development Workflow
1. **Business Formation**: User creates business through wizard
2. **Requirements Gathering**: AI assists with PRD and specs
3. **App Generation**: AI generates custom business application
4. **Repository Setup**: Automated GitHub repo with Claude Code integration
5. **Development**: Iterative development using Claude Code terminal
6. **Deployment**: Automated deployment pipeline

### Key Features
- **Cockpit Interface**: Business management dashboard
- **Formation Wizard**: Guided business creation process
- **Document Canvas**: Visual collaboration for requirements
- **Feature Management**: GitHub-integrated project tracking
- **AI Chat**: Context-aware business assistance
- **Square Setup**: Automated business account creation

### Environment Configuration
- Development server runs on port 5001
- WebSocket server for Claude Code at `/api/claude-code/ws`
- Database connection via `DATABASE_URL` environment variable
- Square API credentials for payment processing
- GitHub OAuth for repository access
- Azure Email for magic link authentication

### Testing and Quality
- TypeScript strict mode enabled
- ESLint configuration for code quality
- Database verification scripts
- Health check endpoints
- Prisma schema validation

### File Organization Patterns
- API routes follow Next.js App Router conventions
- Database models use Prisma schema with SQL Server compatibility
- Components organized by feature area
- Utilities in `/lib` with clear separation of concerns
- Scripts for database management and testing

### Special Considerations
- All JSON fields converted to `@db.Text` for SQL Server compatibility
- Custom server enables WebSocket support for real-time features
- Project isolation ensures clean Claude Code working environments
- Business process automation via Temporal workflows
- Cross-database compatibility maintained through Prisma abstractions

## Project Guidance
- Remember we're trying to build something that is not geared for developers!
- Do not add "Co-authored with Claude" or any other mention of Claude

## Project Development Workflow
- As we're building this out, we want to start to build out the templates for how we work here. I want to capture every feature we're working in /project/features/featurename.md and this will include tasks and so on. So this is how we're going to track the idea of projects/features/tasks.

## Partnership Principles
- No need to be sycophantic. We're partners here. I appreciate the enthusiasm but I know not every idea is brilliant. I want a true partner who can challenge me and help us build the best product possible!