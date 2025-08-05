import { execSync } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { worktreeManager } from './worktree-manager'

export interface SyncStatus {
  project: string
  branch: string
  status: 'synced' | 'ahead' | 'behind' | 'diverged' | 'conflict' | 'error'
  lastSync: Date
  conflictFiles?: string[]
  message?: string
  needsAttention?: boolean
}

export interface ConflictResolution {
  strategy: 'accept-ours' | 'accept-theirs' | 'manual-review' | 'auto-merge'
  files: string[]
  description: string
}

export class BackgroundSyncService {
  private syncInterval: NodeJS.Timeout | null = null
  private isRunning = false
  private readonly syncIntervalMs = 5 * 60 * 1000 // 5 minutes

  constructor() {
    // Start background sync when service is created (unless disabled)
    if (!process.env.DISABLE_BACKGROUND_SERVICES) {
      this.start()
    } else {
      console.log('⚠️  Background sync service disabled for cloud deployment')
    }
  }

  /**
   * Start the background sync service
   */
  start(): void {
    if (this.isRunning) return

    this.isRunning = true
    console.log('🔄 Starting background sync service...')

    // Run initial sync
    this.performSyncCycle().catch(console.error)

    // Set up periodic sync
    this.syncInterval = setInterval(() => {
      this.performSyncCycle().catch(console.error)
    }, this.syncIntervalMs)
  }

  /**
   * Stop the background sync service
   */
  stop(): void {
    if (!this.isRunning) return

    this.isRunning = false
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    console.log('⏹️ Stopped background sync service')
  }

  /**
   * Perform a complete sync cycle for all projects
   */
  async performSyncCycle(): Promise<SyncStatus[]> {
    const results: SyncStatus[] = []
    
    try {
      // Get all projects in tmp/repos
      const repoPath = path.join(process.cwd(), 'tmp', 'repos')
      await fs.mkdir(repoPath, { recursive: true })
      
      const projects = await fs.readdir(repoPath)
      
      for (const project of projects) {
        try {
          // Skip if not a directory or doesn't have .git
          const projectPath = path.join(repoPath, project)
          const stat = await fs.stat(projectPath)
          if (!stat.isDirectory()) continue

          const gitPath = path.join(projectPath, '.git')
          try {
            await fs.access(gitPath)
          } catch {
            continue // Not a git repository
          }

          // Get all worktrees for this project
          const worktrees = await worktreeManager.listProjectWorktrees(project)
          
          for (const worktree of worktrees) {
            const syncStatus = await this.syncWorktree(project, worktree.branch)
            results.push(syncStatus)
          }
        } catch (error) {
          console.error(`Error syncing project ${project}:`, error)
          results.push({
            project,
            branch: 'unknown',
            status: 'error',
            lastSync: new Date(),
            message: `Error: ${error}`
          })
        }
      }
    } catch (error) {
      console.error('Error in sync cycle:', error)
    }

    return results
  }

  /**
   * Sync a specific worktree with remote
   */
  async syncWorktree(project: string, branch: string): Promise<SyncStatus> {
    const worktreePath = worktreeManager.getWorktreePath(project, branch)
    
    try {
      // Check if worktree exists
      await fs.access(worktreePath)
    } catch {
      return {
        project,
        branch,
        status: 'error',
        lastSync: new Date(),
        message: 'Worktree path does not exist'
      }
    }

    try {
      // Fetch latest changes from remote
      execSync('git fetch origin', { 
        cwd: worktreePath, 
        stdio: 'pipe' 
      })

      // Check status relative to remote
      const status = await this.getGitStatus(worktreePath, branch)
      
      // Auto-sync if possible
      if (status.status === 'behind') {
        await this.autoMergeIfSafe(worktreePath, branch)
        // Re-check status after merge
        return await this.getGitStatus(worktreePath, branch)
      }

      return status
    } catch (error: any) {
      console.error(`Error syncing ${project}/${branch}:`, error)
      return {
        project,
        branch,
        status: 'error',
        lastSync: new Date(),
        message: error.message
      }
    }
  }

  /**
   * Get detailed git status for a worktree
   */
  private async getGitStatus(worktreePath: string, branch: string): Promise<SyncStatus> {
    try {
      // Get current branch (might be different from folder name)
      const currentBranch = execSync('git branch --show-current', {
        cwd: worktreePath,
        encoding: 'utf8'
      }).trim()

      // Get remote branch name
      const remoteBranch = `origin/${currentBranch}`

      // Check if remote branch exists
      try {
        execSync(`git rev-parse --verify ${remoteBranch}`, {
          cwd: worktreePath,
          stdio: 'pipe'
        })
      } catch {
        // No remote branch, probably a new local branch
        return {
          project: path.basename(path.dirname(worktreePath)),
          branch,
          status: 'ahead',
          lastSync: new Date(),
          message: 'New branch, needs to be pushed'
        }
      }

      // Compare local and remote
      const ahead = execSync(`git rev-list --count ${remoteBranch}..HEAD`, {
        cwd: worktreePath,
        encoding: 'utf8'
      }).trim()

      const behind = execSync(`git rev-list --count HEAD..${remoteBranch}`, {
        cwd: worktreePath,
        encoding: 'utf8'
      }).trim()

      const aheadCount = parseInt(ahead) || 0
      const behindCount = parseInt(behind) || 0

      // Check for conflicts
      const conflictFiles = await this.getConflictFiles(worktreePath)
      
      let status: SyncStatus['status']
      let needsAttention = false
      let message = ''

      if (conflictFiles.length > 0) {
        status = 'conflict'
        needsAttention = true
        message = `${conflictFiles.length} files have conflicts`
      } else if (aheadCount > 0 && behindCount > 0) {
        status = 'diverged'
        needsAttention = true
        message = `${aheadCount} commits ahead, ${behindCount} behind`
      } else if (aheadCount > 0) {
        status = 'ahead'
        message = `${aheadCount} commits to push`
      } else if (behindCount > 0) {
        status = 'behind'
        message = `${behindCount} commits to pull`
      } else {
        status = 'synced'
        message = 'Up to date'
      }

      return {
        project: path.basename(path.dirname(worktreePath)),
        branch,
        status,
        lastSync: new Date(),
        conflictFiles,
        message,
        needsAttention
      }
    } catch (error: any) {
      return {
        project: path.basename(path.dirname(worktreePath)),
        branch,
        status: 'error',
        lastSync: new Date(),
        message: `Status check failed: ${error.message}`
      }
    }
  }

  /**
   * Get list of files with merge conflicts
   */
  private async getConflictFiles(worktreePath: string): Promise<string[]> {
    try {
      const output = execSync('git diff --name-only --diff-filter=U', {
        cwd: worktreePath,
        encoding: 'utf8'
      })
      return output.split('\n').filter(line => line.trim())
    } catch {
      return []
    }
  }

  /**
   * Attempt to auto-merge if it's safe (fast-forward only)
   */
  private async autoMergeIfSafe(worktreePath: string, branch: string): Promise<boolean> {
    try {
      // Check if working directory is clean
      const status = execSync('git status --porcelain', {
        cwd: worktreePath,
        encoding: 'utf8'
      }).trim()

      if (status !== '') {
        console.log(`⚠️ Cannot auto-merge ${branch}: working directory not clean`)
        return false
      }

      // Try fast-forward merge
      execSync('git merge --ff-only origin/main', {
        cwd: worktreePath,
        stdio: 'pipe'
      })

      console.log(`✅ Auto-merged ${branch} successfully`)
      return true
    } catch (error) {
      console.log(`⚠️ Cannot auto-merge ${branch}: ${error}`)
      return false
    }
  }

  /**
   * Resolve conflicts automatically using business-friendly strategies
   */
  async resolveConflictsAutomatically(
    project: string, 
    branch: string, 
    strategy: ConflictResolution['strategy'] = 'auto-merge'
  ): Promise<{ success: boolean; message: string; remainingConflicts: string[] }> {
    const worktreePath = worktreeManager.getWorktreePath(project, branch)
    
    try {
      const conflictFiles = await this.getConflictFiles(worktreePath)
      
      if (conflictFiles.length === 0) {
        return {
          success: true,
          message: 'No conflicts to resolve',
          remainingConflicts: []
        }
      }

      switch (strategy) {
        case 'accept-ours':
          // Keep our version for all conflicts
          for (const file of conflictFiles) {
            execSync(`git checkout --ours "${file}"`, { cwd: worktreePath })
            execSync(`git add "${file}"`, { cwd: worktreePath })
          }
          break

        case 'accept-theirs':
          // Accept incoming changes for all conflicts
          for (const file of conflictFiles) {
            execSync(`git checkout --theirs "${file}"`, { cwd: worktreePath })
            execSync(`git add "${file}"`, { cwd: worktreePath })
          }
          break

        case 'auto-merge':
          // Try intelligent auto-resolution
          await this.smartConflictResolution(worktreePath, conflictFiles)
          break

        case 'manual-review':
          // Mark for manual review - don't auto-resolve
          return {
            success: false,
            message: 'Conflicts require manual review',
            remainingConflicts: conflictFiles
          }
      }

      // Check if any conflicts remain
      const remainingConflicts = await this.getConflictFiles(worktreePath)
      
      if (remainingConflicts.length === 0) {
        // Complete the merge
        execSync('git commit --no-edit', { cwd: worktreePath })
        return {
          success: true,
          message: `Resolved ${conflictFiles.length} conflicts automatically`,
          remainingConflicts: []
        }
      } else {
        return {
          success: false,
          message: `${remainingConflicts.length} conflicts need manual attention`,
          remainingConflicts
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Error resolving conflicts: ${error.message}`,
        remainingConflicts: await this.getConflictFiles(worktreePath)
      }
    }
  }

  /**
   * Smart conflict resolution for common business scenarios
   */
  private async smartConflictResolution(worktreePath: string, conflictFiles: string[]): Promise<void> {
    for (const file of conflictFiles) {
      try {
        const content = await fs.readFile(path.join(worktreePath, file), 'utf8')
        
        // Simple heuristics for auto-resolution
        if (file.endsWith('.md')) {
          // For markdown files, try to merge content intelligently
          await this.resolveMarkdownConflict(worktreePath, file, content)
        } else if (file.endsWith('.json')) {
          // For JSON files, be more conservative
          execSync(`git checkout --ours "${file}"`, { cwd: worktreePath })
          execSync(`git add "${file}"`, { cwd: worktreePath })
        } else {
          // For other files, prefer our version by default
          execSync(`git checkout --ours "${file}"`, { cwd: worktreePath })
          execSync(`git add "${file}"`, { cwd: worktreePath })
        }
      } catch (error) {
        console.error(`Error resolving conflict in ${file}:`, error)
        // Fall back to keeping our version
        execSync(`git checkout --ours "${file}"`, { cwd: worktreePath })
        execSync(`git add "${file}"`, { cwd: worktreePath })
      }
    }
  }

  /**
   * Resolve markdown conflicts by merging content sections
   */
  private async resolveMarkdownConflict(worktreePath: string, file: string, content: string): Promise<void> {
    // Simple strategy: if it's a work item or documentation file,
    // try to preserve both versions with clear sections
    const lines = content.split('\n')
    const resolved: string[] = []
    let inConflict = false
    let ourSection: string[] = []
    let theirSection: string[] = []
    let conflictType: 'ours' | 'theirs' | null = null

    for (const line of lines) {
      if (line.startsWith('<<<<<<<')) {
        inConflict = true
        conflictType = 'ours'
        continue
      } else if (line.startsWith('=======')) {
        conflictType = 'theirs'
        continue
      } else if (line.startsWith('>>>>>>>')) {
        inConflict = false
        
        // Merge the sections intelligently
        if (ourSection.join('\n').trim() && theirSection.join('\n').trim()) {
          resolved.push('## Our Changes')
          resolved.push(...ourSection)
          resolved.push('')
          resolved.push('## Incoming Changes')
          resolved.push(...theirSection)
        } else if (ourSection.join('\n').trim()) {
          resolved.push(...ourSection)
        } else {
          resolved.push(...theirSection)
        }
        
        ourSection = []
        theirSection = []
        conflictType = null
        continue
      }

      if (inConflict) {
        if (conflictType === 'ours') {
          ourSection.push(line)
        } else if (conflictType === 'theirs') {
          theirSection.push(line)
        }
      } else {
        resolved.push(line)
      }
    }

    // Write resolved content
    await fs.writeFile(path.join(worktreePath, file), resolved.join('\n'))
    execSync(`git add "${file}"`, { cwd: worktreePath })
  }

  /**
   * Get all projects that need attention
   */
  async getProjectsNeedingAttention(): Promise<SyncStatus[]> {
    const allStatuses = await this.performSyncCycle()
    return allStatuses.filter(status => status.needsAttention || status.status === 'conflict')
  }
}

// Export singleton instance
export const backgroundSyncService = new BackgroundSyncService()