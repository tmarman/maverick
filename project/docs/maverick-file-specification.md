# .maverick File Specification

## Overview

The `.maverick` file defines a **workspace scope** within a git repository. Each `.maverick` file creates a bounded context with its own AI instructions, system design, team configuration, and workflow rules. These can be nested to create fractal organizational structures.

## Core Concept: Composable System Architecture

Moving folders with `.maverick` files literally refactors your system design. The physical file structure IS the system architecture.

```
repository/
├── .maverick                    # Root: Company-wide scope
├── legal/
│   ├── .maverick               # Legal workspace scope
│   ├── instructions.md         # AI instructions for legal work
│   ├── incorporation/
│   └── contracts/
├── products/
│   ├── mobile-app/
│   │   ├── .maverick          # Product team scope
│   │   ├── instructions.md    # Product-specific AI instructions
│   │   ├── src/
│   │   ├── design/
│   │   └── features/
│   │       ├── auth/
│   │       │   ├── .maverick  # Feature scope
│   │       │   └── instructions.md
│   │       └── payments/
│   │           ├── .maverick  # Feature scope
│   │           └── instructions.md
│   └── web-app/
│       ├── .maverick          # Another product scope
│       └── src/
└── marketing/
    ├── .maverick              # Marketing scope
    ├── instructions.md        # Marketing AI instructions
    └── campaigns/
```

## .maverick File Schema

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
      "parent": "../.maverick",
      "children": ["./features/auth/.maverick", "./features/payments/.maverick"],
      "peers": ["../web-app/.maverick"]
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
    ├── .maverick
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
│   ├── .maverick          # Generated from feature template
│   ├── src/               # Moved from mega-app/src/auth
│   └── instructions.md    # AI instructions for auth domain
├── payments-service/
│   ├── .maverick          # Generated from feature template
│   ├── src/               # Moved from mega-app/src/payments
│   └── instructions.md    # AI instructions for payments domain
└── social-service/
    ├── .maverick          # Generated from feature template
    ├── src/               # Moved from mega-app/src/social
    └── instructions.md    # AI instructions for social domain
```

The system architecture changes by physically restructuring folders. Each new `.maverick` scope gets its own AI instructions, team ownership, and architectural boundaries.

## UI Integration

The Maverick UI reads the git file tree and:

1. **Discovers workspaces** by scanning for `.maverick` files
2. **Builds scope hierarchy** based on folder structure
3. **Loads context** from each scope's instructions.md
4. **Enables refactoring** through drag-and-drop folder operations
5. **Validates moves** against architectural constraints

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