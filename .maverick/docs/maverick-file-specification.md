# .maverick Directory Specification
## Git-Folder Driven Agent System

## Overview

The `.maverick/` directory defines a **workspace scope** within a git repository that creates a **Git-folder driven agent system**. Each `.maverick/` directory creates a bounded context with its own AI instructions, system design, team configuration, workflow rules, work items, documentation, and project artifacts. These can be nested to create fractal organizational structures.

**Key Insight**: This isn't just for code projects - it's for ANY collaborative work that can benefit from Git version control and AI assistance: legal documents, marketing campaigns, research projects, business formation, product development, etc.

## Complete Directory Structure

As of August 2025, the .maverick specification has been updated to use a comprehensive directory structure:

```
.maverick/
├── project.json          # Main project configuration (previously .maverick file)
├── work-items/          # All work items and tasks
├── ai-logs/             # AI interaction logs and debugging
├── reports/             # Analysis reports and summaries
├── agents/              # Specialized AI agent prompts and instructions
├── docs/                # Technical documentation and architecture
├── setup/               # Setup guides and installation instructions
├── templates/           # Project templates and reusable patterns
├── deployment/          # Deployment configurations
├── config/              # Additional configuration files
├── marketing.md         # Business and marketing content
├── pricing-strategy.md  # Pricing and business model
└── specifications.md    # Project specifications
```

This makes any cloned repository completely self-describing and enables Git-folder driven agent collaboration.

## AI Agents System

The `agents/` directory contains specialized AI agent prompts that can be invoked for specific tasks:

```
.maverick/agents/
├── business-analyst.md      # Business requirements and strategy
├── technical-architect.md   # System design and architecture
├── legal-advisor.md        # Legal compliance and business formation
├── ux-designer.md          # User experience and design
├── security-specialist.md  # Security analysis and recommendations
├── devops-engineer.md      # Deployment and infrastructure
├── financial-advisor.md    # Financial modeling and analysis
└── marketing-strategist.md # Marketing and growth strategies
```

**Usage Examples:**
- `@business-analyst analyze user requirements for payment processing`
- `@technical-architect design API structure for multi-tenant system`  
- `@legal-advisor review terms of service for compliance`
- `@agents/security-specialist` (explicit path reference)

Agents can reference each other for collaborative analysis and maintain context across interactions.

## Git Worktree Integration

Maverick uses Git worktrees to manage parallel development contexts. Each worktree gets its own `.maverick/` directory with independent work items, AI logs, and agent contexts.

### Working Directory Structure

```
~/tmp/repos/  (or /project/tmp/repos/ in production)
├── maverick/                      # Main repo clone (.git/ metadata)
├── maverick-main/                 # Main branch worktree
│   ├── .maverick/                 # Main development context
│   ├── src/
│   └── ...
├── maverick-feature-vibe-chat/    # Feature worktree
│   ├── .maverick/                 # Feature-specific context
│   │   ├── work-items/            # Feature work items
│   │   ├── ai-logs/               # Feature AI sessions  
│   │   └── agents/                # Feature-specific agents
│   ├── src/
│   └── ...
├── wine/                          # Different project main repo
└── wine-feature-inventory/        # Wine project feature worktree
    ├── .maverick/                 # Independent wine context
    └── ...
```

### Benefits of Worktree Architecture
- **Parallel development** - work on multiple features simultaneously
- **Isolated AI contexts** - each worktree maintains separate AI sessions
- **Independent work items** - feature-specific tasks don't interfere
- **Resilient development** - constant commits to working branches prevent data loss

## Core Concept: Composable System Architecture

Moving folders with `.maverick/` directories literally refactors your system design. The physical file structure IS the system architecture.

```
repository/
├── .maverick/                   # Root: Company-wide scope
│   ├── project.json            # Main configuration
│   ├── work-items/             # Company-level work items
│   ├── ai-logs/                # AI interaction logs
│   └── reports/                # Analysis reports
├── legal/
│   ├── .maverick/              # Legal workspace scope
│   │   ├── project.json        # Legal-specific configuration
│   │   ├── work-items/         # Legal work items
│   │   └── ai-logs/            # Legal AI interactions
│   ├── instructions.md         # AI instructions for legal work
│   ├── incorporation/
│   └── contracts/
├── products/
│   ├── mobile-app/
│   │   ├── .maverick/          # Product team scope
│   │   │   ├── project.json    # Product configuration
│   │   │   ├── work-items/     # Product work items
│   │   │   └── ai-logs/        # Product AI logs
│   │   ├── instructions.md     # Product-specific AI instructions
│   │   ├── src/
│   │   ├── design/
│   │   └── features/
│   │       ├── auth/
│   │       │   ├── .maverick/  # Feature scope
│   │       │   │   ├── project.json
│   │       │   │   └── work-items/
│   │       │   └── instructions.md
│   │       └── payments/
│   │           ├── .maverick/  # Feature scope
│   │           │   ├── project.json
│   │           │   └── work-items/
│   │           └── instructions.md
│   └── web-app/
│       ├── .maverick/          # Another product scope
│       │   ├── project.json
│       │   └── work-items/
│       └── src/
└── marketing/
    ├── .maverick/              # Marketing scope
    │   ├── project.json
    │   ├── work-items/
    │   └── ai-logs/
    ├── instructions.md         # Marketing AI instructions
    └── campaigns/
```

## project.json Schema

The `project.json` file (previously `.maverick`) contains the main configuration:

```json
{
  "version": "1.0",
  "scope": {
    "type": "product" | "team" | "feature" | "legal" | "marketing" | "research" | "root",
    "name": "Human readable name",
    "description": "What this workspace encompasses",
    "owner": "team-identifier or person",
    "boundaries": {
      "includes": ["./src", "./design", "./docs"],
      "excludes": ["./node_modules", "./.git"]
    }
  },
  "instructions": {
    "file": "./instructions.md",
    "context": "AI instructions specific to this scope",
    "inheritance": "merge" | "override" | "ignore"
  },
  "architecture": {
    "type": "microservice" | "monolith" | "library" | "workflow" | "docs",
    "dependencies": [
      {
        "path": "../shared-lib",
        "type": "internal"
      },
      {
        "name": "external-api",
        "type": "external"
      }
    ],
    "interfaces": {
      "exports": ["./api", "./types"],
      "contracts": ["./contracts/*.json"]
    }
  },
  "team": {
    "roles": {
      "lead": "person@company.com",
      "members": ["person1@company.com", "person2@company.com"],
      "stakeholders": ["business@company.com"]
    },
    "workflow": {
      "template": "agile" | "kanban" | "legal" | "research",
      "cadence": "sprint" | "continuous" | "milestone"
    }
  },
  "ai": {
    "claude": {
      "instructions": "./instructions.md",
      "context_files": ["./README.md", "./architecture.md"],
      "preferences": {
        "code_style": "typescript",
        "framework": "nextjs"
      }
    },
    "gemini": {
      "instructions": "./.gemini/instructions",
      "specialization": "design" | "code" | "legal" | "marketing"
    }
  },
  "templates": {
    "workspace_type": "product-team",
    "created_from": "template://product-team-v1",
    "generates": ["feature", "component", "service"]
  },
  "system_design": {
    "relationships": {
      "parent": "../.maverick/",
      "children": ["./features/auth/.maverick/", "./features/payments/.maverick/"],
      "peers": ["../web-app/.maverick/"]
    },
    "data_flow": {
      "inputs": [{"from": "../shared-lib", "type": "types"}],
      "outputs": [{"to": "../api-gateway", "type": "service"}]
    }
  }
}
```

## Instructions.md Integration

Each `.maverick` scope can have its own `instructions.md` file with AI-specific guidance:

```markdown
# Product Team AI Instructions

## Context
You are working in the mobile app product workspace. This team focuses on React Native development with TypeScript.

## Architecture
- This is a mobile-first product
- Uses shared components from `/shared-lib`
- Integrates with backend APIs via `/api-gateway`

## Code Standards
- TypeScript strict mode
- React Native best practices
- Jest testing required
- ESLint configuration in root

## Team Workflow
- Feature branches for all work
- PR reviews required from 2 team members
- Design reviews with UX team before implementation

## AI Preferences
- Suggest React Native solutions first
- Consider mobile performance implications
- Reference design system components
- Include accessibility considerations
```

## Template System

### Built-in Templates

**Root Company Template**
```json
{
  "scope": {"type": "root", "name": "Company Root"},
  "generates": ["legal", "product", "marketing", "research"]
}
```

**Product Team Template**
```json
{
  "scope": {"type": "product"},
  "architecture": {"type": "microservice"},
  "generates": ["feature", "component", "service"],
  "team": {"workflow": {"template": "agile"}}
}
```

**Legal/Incorporation Template**
```json
{
  "scope": {"type": "legal"},
  "architecture": {"type": "workflow"},
  "generates": ["contract", "filing", "compliance"],
  "team": {"workflow": {"template": "legal"}}
}
```

**Feature Template**
```json
{
  "scope": {"type": "feature"},
  "architecture": {"type": "component"},
  "generates": ["component", "test", "docs"]
}
```

## System Refactoring Through Folder Movement

### Example: Splitting a Product

**Before:**
```
products/
└── mega-app/
    ├── .maverick/
    │   ├── project.json
    │   └── work-items/
    ├── src/
    │   ├── auth/
    │   ├── payments/
    │   └── social/
    └── instructions.md
```

**After (Move folders to split system):**
```
products/
├── auth-service/
│   ├── .maverick/         # Generated from feature template
│   │   ├── project.json
│   │   └── work-items/
│   ├── src/               # Moved from mega-app/src/auth
│   └── instructions.md    # AI instructions for auth domain
├── payments-service/
│   ├── .maverick/         # Generated from feature template
│   │   ├── project.json
│   │   └── work-items/
│   ├── src/               # Moved from mega-app/src/payments
│   └── instructions.md    # AI instructions for payments domain
└── social-service/
    ├── .maverick/         # Generated from feature template
    │   ├── project.json
    │   └── work-items/
    ├── src/               # Moved from mega-app/src/social
    └── instructions.md    # AI instructions for social domain
```

The system architecture changes by physically restructuring folders. Each new `.maverick/` directory gets its own AI instructions, team ownership, architectural boundaries, and work items.

## UI Integration

The Maverick UI reads the git file tree and:

1. **Discovers workspaces** by scanning for `.maverick/` directories
2. **Builds scope hierarchy** based on folder structure
3. **Loads context** from each scope's project.json and instructions.md
4. **Displays work items** from the work-items/ directory
5. **Shows AI interaction history** from ai-logs/
6. **Enables refactoring** through drag-and-drop folder operations
7. **Validates moves** against architectural constraints

## Benefits

1. **Version Controlled Architecture** - System design lives in git
2. **AI Context Inheritance** - Instructions flow down the hierarchy
3. **Physical Refactoring** - Move folders to change system design
4. **Team Boundaries** - Clear ownership and responsibility
5. **Template Driven** - Consistent workspace creation
6. **Fractal Scaling** - Works from features to entire companies

## Implementation Priority

1. Basic `.maverick` file parsing
2. Instructions.md integration with AI
3. UI workspace discovery and navigation
4. Template system for common patterns
5. Drag-and-drop folder refactoring
6. Architectural constraint validation