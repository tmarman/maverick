# Goose + .maverick Integration

## Vision: Local Development with Contextual AI

Goose becomes **workspace-aware** by understanding `.maverick` folders. When you run `goose` in any directory, it:

1. **Scans up the tree** to find `.maverick` files
2. **Loads contextual instructions** from the workspace hierarchy
3. **Understands system architecture** and boundaries
4. **Provides scope-specific AI assistance**

## How It Works

### Workspace Discovery

```bash
# In any folder, Goose finds the relevant .maverick context
cd /projects/my-company/products/mobile-app/features/auth
goose "help me add OAuth support"

# Goose automatically discovers:
# 1. /projects/my-company/.maverick (root company context)
# 2. /projects/my-company/products/mobile-app/.maverick (product context)
# 3. /projects/my-company/products/mobile-app/features/auth/.maverick (feature context)
```

### Context Inheritance

Goose loads instructions in hierarchy order:

```
Root: "This is a TypeScript company using Next.js and Prisma"
Product: "Mobile app using React Native, shared components in /shared-lib"
Feature: "Auth feature using NextAuth.js, follows company security standards"
```

Result: Goose knows to suggest React Native OAuth solutions that integrate with NextAuth.js and company security standards.

## Implementation: Goose Extensions

### 1. Maverick Context Provider

```python
# Add to Goose core
class MaverickContextProvider:
    def discover_workspaces(self, current_path: str) -> List[MaverickWorkspace]:
        """Scan up directory tree for .maverick files"""
        workspaces = []
        path = current_path
        
        while path != "/":
            maverick_file = path / ".maverick"
            if maverick_file.exists():
                workspace = MaverickWorkspace.load(maverick_file)
                workspaces.append(workspace)
            path = path.parent
        
        return reversed(workspaces)  # Root to leaf order
    
    def build_context(self, workspaces: List[MaverickWorkspace]) -> str:
        """Merge instructions from workspace hierarchy"""
        context_parts = []
        
        for workspace in workspaces:
            if workspace.instructions.file:
                instructions = workspace.load_instructions()
                context_parts.append(f"# {workspace.scope.name}\n{instructions}")
        
        return "\n\n".join(context_parts)
```

### 2. Workspace-Aware Commands

```bash
# Goose understands workspace boundaries
goose "create a new feature"
# -> Checks if current .maverick can generate "feature" type
# -> Uses feature template from workspace config
# -> Creates new .maverick scope with inherited context

goose "refactor this into microservices"
# -> Analyzes current .maverick architecture
# -> Suggests folder restructuring
# -> Helps create new .maverick files for each service

goose "add a new team member"
# -> Updates .maverick team configuration
# -> Generates onboarding instructions specific to this workspace
```

### 3. Architecture-Aware Development

```bash
# In a feature folder
goose "add payment processing"

# Goose knows from .maverick context:
# - This is a React Native mobile app
# - Company uses Square for payments
# - Shared payment components exist in /shared-lib
# - Must follow company security standards
# - Should integrate with existing auth system

# Result: Suggests React Native Square SDK integration
# using existing shared components and auth context
```

## Extended Goose Commands

### Workspace Management

```bash
# Initialize new workspace
goose workspace init --type=product --name="New Product"

# List current workspace hierarchy
goose workspace list

# Move to different workspace context
goose workspace cd ../marketing

# Generate new scope from template
goose workspace generate feature auth --from=feature-template
```

### Architecture Operations

```bash
# Analyze current system architecture
goose arch analyze

# Suggest architectural improvements
goose arch improve

# Validate architectural constraints
goose arch validate

# Refactor system by moving folders
goose arch refactor --split-feature=auth --into=microservice
```

### Team Operations

```bash
# Update team configuration
goose team add-member john@company.com --role=developer

# Generate team onboarding docs
goose team onboard

# Create team-specific AI instructions
goose team configure-ai --specialization=mobile
```

## Desktop Integration Benefits

### 1. **Contextual AI Everywhere**
- `goose` automatically knows your project context
- No manual context switching or setup
- Instructions follow the codebase

### 2. **Architectural Consistency**
- Goose enforces workspace boundaries
- Suggests solutions that fit system architecture
- Prevents architectural drift

### 3. **Template-Driven Development**
- Generate new features/services from templates
- Consistent project structure
- Built-in best practices

### 4. **Local System Design**
- Refactor architecture by moving folders
- Goose helps with complex system splits
- Physical structure reflects logical design

### 5. **Team Coordination**
- Shared workspace definitions in git
- Consistent AI behavior across team members
- Version-controlled development standards

## Implementation Plan

### Phase 1: Basic Workspace Discovery
- Add `.maverick` file parsing to Goose
- Implement workspace hierarchy discovery
- Load and merge instructions.md files

### Phase 2: Architecture Awareness
- Parse architecture definitions from .maverick
- Add boundary validation
- Implement dependency tracking

### Phase 3: Template System
- Add workspace generation commands
- Create built-in templates
- Enable custom template creation

### Phase 4: Advanced Refactoring
- Implement folder-based architecture refactoring
- Add architectural constraint validation
- Enable complex system transformations

## Example Workflow

```bash
# Start new company project
mkdir my-startup && cd my-startup
goose workspace init --type=root --template=startup

# Generated structure:
# ├── .maverick (root company config)
# ├── instructions.md (company-wide AI instructions)
# ├── legal/ (with .maverick for incorporation)
# ├── products/ (ready for product teams)
# └── marketing/ (with .maverick for marketing)

# Add first product
cd products
goose workspace generate product mobile-app --template=react-native

# Generated:
# products/mobile-app/
# ├── .maverick (product team config)
# ├── instructions.md (React Native specific instructions)
# ├── src/
# ├── features/ (ready for feature development)
# └── design/

# Start working on auth feature
cd mobile-app/features
goose workspace generate feature auth --template=nextauth

# Goose now knows:
# - Company context (TypeScript, best practices)
# - Product context (React Native, mobile-first)
# - Feature context (NextAuth, security standards)

# All development suggestions are perfectly contextualized!
```

This makes the desktop version incredibly powerful - Goose becomes a workspace-aware AI that understands your entire system architecture just by reading the folder structure.