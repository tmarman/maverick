# Maverick Feature Development Workflow

This document defines the standardized workflow for feature development using Maverick's GitHub integration and worktree management.

## Overview

Maverick uses Git worktrees to manage multiple feature branches simultaneously, allowing AI agents to work on different features in isolation while maintaining a clean development environment.

## Repository Structure

```
/tmp/maverick/repositories/{userId}/{repoName}/
├── .git-bare/                 # Bare repository for worktree management
├── .maverick-worktrees.json   # Metadata about worktrees
├── main/                      # Main branch worktree
├── feature-{name}/            # Feature worktrees
├── hotfix-{name}/             # Hotfix worktrees
└── develop/                   # Development branch worktree (optional)
```

## Workflow Rules

### 1. Repository Setup

When a user connects a GitHub repository:

1. **Clone as bare repository** to enable worktree management
2. **Create main worktree** from the default branch (main/master)
3. **Initialize metadata** to track all worktrees
4. **Set up directory structure** under user's workspace

```typescript
// API: POST /api/github/repositories/{owner}/{repo}/clone
{
  "baseDirectory": "/tmp/maverick/repositories/{userId}",
  "shallow": true,
  "includeSubmodules": false
}
```

### 2. Feature Development

For each new feature:

1. **Create feature worktree** from main branch
2. **Generate unique branch name** (e.g., `feature/payment-integration`)
3. **Set up isolated workspace** for AI agents to work in
4. **Track worktree metadata** for management

```typescript
// API: POST /api/github/repositories/{owner}/{repo}/worktrees
{
  "featureName": "payment-integration",
  "baseBranch": "main",
  "purpose": "feature",
  "createBranch": true
}
```

### 3. AI Agent Integration

When AI agents work on features:

1. **Switch to feature worktree** for the specific feature
2. **Work in isolation** without affecting other features
3. **Commit changes** to the feature branch
4. **Update worktree metadata** with activity timestamps

```typescript
// Get worktree path for AI agent
const worktreePath = await githubWorktreeService.getWorktreeForFeature(
  repositoryPath,
  featureName
)
```

### 4. Worktree Management

#### Active Worktrees
- **Purpose**: `main`, `feature`, `hotfix`, `develop`
- **Status**: `active`, `stale`, `merged`
- **Tracking**: Last activity, uncommitted changes, branch status

#### Cleanup Rules
- **Stale Detection**: No activity for > 7 days
- **Automatic Cleanup**: Remove stale feature worktrees
- **Preserve Main**: Never remove main worktree
- **Force Removal**: Available for stuck worktrees

### 5. Branch Naming Conventions

```
feature/{feature-name}     # New features
hotfix/{issue-name}        # Critical bug fixes
release/{version}          # Release preparation
chore/{task-name}          # Maintenance tasks
```

### 6. Feature Lifecycle

```mermaid
graph LR
    A[Create Feature] --> B[Create Worktree]
    B --> C[AI Development]
    C --> D[Commit Changes]
    D --> E[Push to GitHub]
    E --> F[Create PR]
    F --> G[Code Review]
    G --> H[Merge]
    H --> I[Remove Worktree]
```

## API Endpoints

### Repository Management

```bash
# Clone repository
POST /repositories/{owner}/{repo}/clone

# Analyze repository
GET /repositories/{owner}/{repo}/analyze
```

### Worktree Management

```bash
# List all worktrees
GET /repositories/{owner}/{repo}/worktrees

# Create feature worktree  
POST /repositories/{owner}/{repo}/worktrees

# Get worktree details
GET /repositories/{owner}/{repo}/worktrees/{worktreeName}

# Remove worktree
DELETE /repositories/{owner}/{repo}/worktrees/{worktreeName}
```

## Implementation Rules

### 1. Directory Isolation

Each worktree has its own directory:
- **No file conflicts** between features
- **Parallel development** on multiple features
- **Easy context switching** for AI agents

### 2. Branch Management

```typescript
// Branch creation rules
const branchName = options.branch || `feature/${sanitizeName(featureName)}`
const baseBranch = options.baseBranch || setup.mainBranch

// Ensure up-to-date base
await executeGitCommand(['fetch', 'origin'], bareRepoDir)
await executeGitCommand(['branch', branchName, `origin/${baseBranch}`], bareRepoDir)
```

### 3. Metadata Tracking

```typescript
interface WorktreeInfo {
  name: string              // feature-payment-integration
  branch: string            // feature/payment-integration  
  path: string              // /tmp/maverick/.../feature-payment-integration
  purpose: 'feature' | 'hotfix' | 'main' | 'develop'
  status: 'active' | 'stale' | 'merged'
  createdAt: Date
  lastActivity?: Date
}
```

### 4. Error Handling

- **Git command failures**: Detailed error messages
- **Directory conflicts**: Automatic cleanup and retry
- **Network issues**: Graceful degradation
- **Permission errors**: Clear user guidance

### 5. Security Considerations

- **User isolation**: Each user has separate workspace
- **Access token handling**: Secure credential management
- **Path validation**: Prevent directory traversal
- **Resource limits**: Cleanup stale worktrees

## AI Agent Guidelines

### Working Directory

```typescript
// AI agents should use the feature-specific worktree
const workingDirectory = await githubWorktreeService.getWorktreeForFeature(
  repositoryPath,
  featureName
)

// Use this directory for all file operations
process.chdir(workingDirectory)
```

### Commit Messages

```
feat: add payment integration with Square API

- Implement payment processing workflow
- Add error handling for failed transactions  
- Include webhook support for payment status
- Update API documentation

🚀 Created with Maverick
```

### Branch Updates

```bash
# Before starting work
git fetch origin
git rebase origin/main

# After completing work
git push origin feature/payment-integration
```

## Monitoring and Cleanup

### Automated Tasks

1. **Daily cleanup** of stale worktrees
2. **Weekly analysis** of repository usage
3. **Monthly optimization** of disk usage
4. **Quarterly review** of workflow effectiveness

### Manual Operations

```bash
# Cleanup stale worktrees
POST /repositories/{owner}/{repo}/cleanup

# Force remove stuck worktree
DELETE /repositories/{owner}/{repo}/worktrees/{name}?force=true

# Repository statistics
GET /repositories/{owner}/{repo}/stats
```

## Benefits

1. **Parallel Development**: Multiple features can be developed simultaneously
2. **Clean Isolation**: No conflicts between different features
3. **Easy Context Switching**: AI agents can switch between features instantly
4. **Automated Management**: Worktrees are created and cleaned up automatically
5. **GitHub Integration**: Seamless push/pull with GitHub repositories
6. **Scalable Architecture**: Supports multiple users and repositories

This workflow ensures that Maverick can efficiently manage complex development projects while maintaining clean separation between features and providing a robust foundation for AI-assisted development.