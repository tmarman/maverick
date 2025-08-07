/**
 * GitHub App Service
 * Provides authenticated GitHub API access using GitHub App credentials
 * Better rate limits and can act on behalf of installations
 */

import { Octokit } from '@octokit/rest'
import { createAppAuth } from '@octokit/auth-app'

export class GitHubAppService {
  private octokit: Octokit
  private appId: string
  private privateKey: string
  private installationId?: string

  constructor() {
    this.appId = process.env.GITHUB_APP_ID!
    this.privateKey = process.env.GITHUB_APP_PRIVATE_KEY!
    this.installationId = process.env.GITHUB_APP_INSTALLATION_ID

    if (!this.appId || !this.privateKey) {
      throw new Error('GitHub App credentials not configured. Set GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY environment variables.')
    }

    // Initialize Octokit with App authentication
    this.octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: this.appId,
        privateKey: this.privateKey.replace(/\\n/g, '\n'), // Handle newlines in env var
        installationId: this.installationId ? parseInt(this.installationId) : undefined,
      },
    })
  }

  // Get installations for the app
  async getInstallations() {
    const { data } = await this.octokit.rest.apps.listInstallations()
    return data
  }

  // Set installation ID (for when working with specific installation)
  setInstallation(installationId: number) {
    this.installationId = installationId.toString()
    this.octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: this.appId,
        privateKey: this.privateKey.replace(/\\n/g, '\n'),
        installationId: installationId,
      },
    })
  }

  // Create repository
  async createRepository(name: string, options: {
    description?: string
    private?: boolean
    auto_init?: boolean
    gitignore_template?: string
    license_template?: string
  } = {}) {
    const { data } = await this.octokit.rest.repos.createForAuthenticatedUser({
      name,
      description: options.description,
      private: options.private ?? true,
      auto_init: options.auto_init ?? true,
      gitignore_template: options.gitignore_template,
      license_template: options.license_template,
    })
    return data
  }

  // Get repository
  async getRepository(owner: string, repo: string) {
    const { data } = await this.octokit.rest.repos.get({
      owner,
      repo,
    })
    return data
  }

  // Create issue
  async createIssue(owner: string, repo: string, title: string, body?: string, labels?: string[]) {
    const { data } = await this.octokit.rest.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
    })
    return data
  }

  // Create branch
  async createBranch(owner: string, repo: string, branchName: string, baseBranch = 'main') {
    // Get the base branch reference
    const { data: baseRef } = await this.octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    })

    // Create new branch
    const { data } = await this.octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseRef.object.sha,
    })
    
    return data
  }

  // Create pull request
  async createPullRequest(owner: string, repo: string, title: string, head: string, base: string, body?: string) {
    const { data } = await this.octokit.rest.pulls.create({
      owner,
      repo,
      title,
      head,
      base,
      body,
    })
    return data
  }

  // Get authenticated app info
  async getApp() {
    const { data } = await this.octokit.rest.apps.getAuthenticated()
    return data
  }

  // Check rate limit
  async getRateLimit() {
    const { data } = await this.octokit.rest.rateLimit.get()
    return data
  }

  // Raw octokit instance for advanced usage
  getOctokit() {
    return this.octokit
  }
}

// Singleton instance
let githubAppService: GitHubAppService | null = null

export const getGitHubAppService = (): GitHubAppService => {
  if (!githubAppService) {
    githubAppService = new GitHubAppService()
  }
  return githubAppService
}

// Helper to check if GitHub App is configured
export const isGitHubAppConfigured = (): boolean => {
  return !!(process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY)
}