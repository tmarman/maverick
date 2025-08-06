import { promises as fs } from 'fs'
import path from 'path'

export interface LearningEntry {
  id: string
  timestamp: Date
  type: 'feedback' | 'mistake' | 'best-practice' | 'decision' | 'preference'
  category: string
  title: string
  description: string
  context: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  actionItems?: string[]
  relatedFeatures?: string[]
  sessionId?: string
  userId?: string
}

export interface FeedbackPattern {
  pattern: string
  frequency: number
  lastSeen: Date
  examples: string[]
  resolution?: string
}

export interface MistakePrevention {
  mistake: string
  context: string
  prevention: string
  warning: string
  frequency: number
}

export interface BestPractice {
  practice: string
  context: string
  benefit: string
  implementation: string
  verified: boolean
}

export interface TeamPreference {
  area: string // 'coding-style', 'tools', 'workflow', 'architecture'
  preference: string
  rationale: string
  established: Date
  teamConsensus: boolean
}

export class LearningCapture {
  private projectRoot: string
  private learningDir: string
  private contextDir: string

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
    this.learningDir = path.join(projectRoot, '.maverick', 'learnings')
    this.contextDir = path.join(projectRoot, '.maverick', 'context')
  }

  async initializeLearningStructure(): Promise<void> {
    await this.ensureDirectoryExists(this.learningDir)
    await this.ensureDirectoryExists(this.contextDir)

    // Initialize learning files if they don't exist
    const learningFiles = [
      { file: 'session-learnings.md', content: this.getSessionLearningsTemplate() },
      { file: 'feedback-patterns.md', content: this.getFeedbackPatternsTemplate() },
      { file: 'mistake-prevention.md', content: this.getMistakePreventionTemplate() },
      { file: 'best-practices.md', content: this.getBestPracticesTemplate() },
      { file: 'team-knowledge.md', content: this.getTeamKnowledgeTemplate() }
    ]

    const contextFiles = [
      { file: 'team-preferences.md', content: this.getTeamPreferencesTemplate() },
      { file: 'project-constraints.md', content: this.getProjectConstraintsTemplate() },
      { file: 'decision-history.md', content: this.getDecisionHistoryTemplate() },
      { file: 'stakeholder-feedback.md', content: this.getStakeholderFeedbackTemplate() }
    ]

    for (const { file, content } of learningFiles) {
      await this.initializeFileIfNotExists(path.join(this.learningDir, file), content)
    }

    for (const { file, content } of contextFiles) {
      await this.initializeFileIfNotExists(path.join(this.contextDir, file), content)
    }
  }

  async captureLearning(learning: LearningEntry): Promise<void> {
    await this.initializeLearningStructure()

    // Add to session learnings
    await this.appendToSessionLearnings(learning)

    // Update relevant pattern files based on type
    switch (learning.type) {
      case 'feedback':
        await this.updateFeedbackPatterns(learning)
        break
      case 'mistake':
        await this.updateMistakePrevention(learning)
        break
      case 'best-practice':
        await this.updateBestPractices(learning)
        break
      case 'decision':
        await this.updateDecisionHistory(learning)
        break
      case 'preference':
        await this.updateTeamPreferences(learning)
        break
    }

    console.log(`Learning captured: ${learning.title} [${learning.type}]`)
  }

  async captureFeedback(
    feedback: string, 
    context: string, 
    impact: LearningEntry['impact'] = 'medium',
    sessionId?: string
  ): Promise<void> {
    const learning: LearningEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      type: 'feedback',
      category: 'user-feedback',
      title: this.extractTitleFromFeedback(feedback),
      description: feedback,
      context,
      impact,
      sessionId
    }

    await this.captureLearning(learning)
  }

  async captureMistake(
    mistake: string,
    context: string,
    prevention: string,
    impact: LearningEntry['impact'] = 'high'
  ): Promise<void> {
    const learning: LearningEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      type: 'mistake',
      category: 'error-prevention',
      title: `Avoid: ${mistake}`,
      description: mistake,
      context,
      impact,
      actionItems: [prevention]
    }

    await this.captureLearning(learning)
  }

  async captureBestPractice(
    practice: string,
    benefit: string,
    implementation: string,
    context: string = 'general'
  ): Promise<void> {
    const learning: LearningEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      type: 'best-practice',
      category: 'optimization',
      title: practice,
      description: benefit,
      context,
      impact: 'medium',
      actionItems: [implementation]
    }

    await this.captureLearning(learning)
  }

  async captureDecision(
    decision: string,
    rationale: string,
    alternatives: string[],
    impact: LearningEntry['impact'] = 'high'
  ): Promise<void> {
    const learning: LearningEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      type: 'decision',
      category: 'architecture',
      title: decision,
      description: rationale,
      context: `Alternatives considered: ${alternatives.join(', ')}`,
      impact
    }

    await this.captureLearning(learning)
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath)
    } catch {
      await fs.mkdir(dirPath, { recursive: true })
    }
  }

  private async initializeFileIfNotExists(filePath: string, content: string): Promise<void> {
    try {
      await fs.access(filePath)
    } catch {
      await fs.writeFile(filePath, content, 'utf-8')
    }
  }

  private async appendToSessionLearnings(learning: LearningEntry): Promise<void> {
    const filePath = path.join(this.learningDir, 'session-learnings.md')
    const entry = this.formatLearningEntry(learning)
    
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const updatedContent = content + '\n' + entry
      await fs.writeFile(filePath, updatedContent, 'utf-8')
    } catch (error) {
      console.warn('Could not append to session learnings:', error)
    }
  }

  private async updateFeedbackPatterns(learning: LearningEntry): Promise<void> {
    // For now, just append to feedback patterns file
    // In the future, this could analyze patterns and frequencies
    const filePath = path.join(this.learningDir, 'feedback-patterns.md')
    const entry = `\n### ${learning.timestamp.toISOString().split('T')[0]} - ${learning.title}\n` +
                  `**Impact**: ${learning.impact}\n` +
                  `**Context**: ${learning.context}\n` +
                  `**Feedback**: ${learning.description}\n`
    
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      await fs.writeFile(filePath, content + entry, 'utf-8')
    } catch (error) {
      console.warn('Could not update feedback patterns:', error)
    }
  }

  private async updateMistakePrevention(learning: LearningEntry): Promise<void> {
    const filePath = path.join(this.learningDir, 'mistake-prevention.md')
    const entry = `\n### ❌ ${learning.title}\n` +
                  `**Context**: ${learning.context}\n` +
                  `**Description**: ${learning.description}\n` +
                  `**Prevention**: ${learning.actionItems?.join(', ') || 'N/A'}\n` +
                  `**Impact**: ${learning.impact}\n` +
                  `**Date**: ${learning.timestamp.toISOString().split('T')[0]}\n`
    
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      await fs.writeFile(filePath, content + entry, 'utf-8')
    } catch (error) {
      console.warn('Could not update mistake prevention:', error)
    }
  }

  private async updateBestPractices(learning: LearningEntry): Promise<void> {
    const filePath = path.join(this.learningDir, 'best-practices.md')
    const entry = `\n### ✅ ${learning.title}\n` +
                  `**Benefit**: ${learning.description}\n` +
                  `**Implementation**: ${learning.actionItems?.join(', ') || 'N/A'}\n` +
                  `**Context**: ${learning.context}\n` +
                  `**Verified**: ${learning.timestamp.toISOString().split('T')[0]}\n`
    
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      await fs.writeFile(filePath, content + entry, 'utf-8')
    } catch (error) {
      console.warn('Could not update best practices:', error)
    }
  }

  private async updateDecisionHistory(learning: LearningEntry): Promise<void> {
    const filePath = path.join(this.contextDir, 'decision-history.md')
    const entry = `\n### 🎯 ${learning.title}\n` +
                  `**Date**: ${learning.timestamp.toISOString().split('T')[0]}\n` +
                  `**Rationale**: ${learning.description}\n` +
                  `**Context**: ${learning.context}\n` +
                  `**Impact**: ${learning.impact}\n`
    
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      await fs.writeFile(filePath, content + entry, 'utf-8')
    } catch (error) {
      console.warn('Could not update decision history:', error)
    }
  }

  private async updateTeamPreferences(learning: LearningEntry): Promise<void> {
    const filePath = path.join(this.contextDir, 'team-preferences.md')
    const entry = `\n### 👥 ${learning.title}\n` +
                  `**Preference**: ${learning.description}\n` +
                  `**Context**: ${learning.context}\n` +
                  `**Established**: ${learning.timestamp.toISOString().split('T')[0]}\n`
    
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      await fs.writeFile(filePath, content + entry, 'utf-8')
    } catch (error) {
      console.warn('Could not update team preferences:', error)
    }
  }

  private formatLearningEntry(learning: LearningEntry): string {
    return `\n## ${learning.timestamp.toISOString().split('T')[0]} - ${learning.title}\n` +
           `**ID**: ${learning.id}\n` +
           `**Type**: ${learning.type}\n` +
           `**Category**: ${learning.category}\n` +
           `**Impact**: ${learning.impact}\n` +
           `**Context**: ${learning.context}\n` +
           `**Description**: ${learning.description}\n` +
           (learning.actionItems ? `**Action Items**: ${learning.actionItems.join(', ')}\n` : '') +
           (learning.relatedFeatures ? `**Related Features**: ${learning.relatedFeatures.join(', ')}\n` : '') +
           (learning.sessionId ? `**Session**: ${learning.sessionId}\n` : '')
  }

  private extractTitleFromFeedback(feedback: string): string {
    // Extract meaningful title from feedback
    const sentences = feedback.split(/[.!?]/)
    const firstSentence = sentences[0]?.trim()
    
    if (firstSentence && firstSentence.length < 60) {
      return firstSentence
    }
    
    // Fallback to first 50 characters
    return feedback.substring(0, 50) + (feedback.length > 50 ? '...' : '')
  }

  private generateId(): string {
    return `learning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Template methods for initial file content
  private getSessionLearningsTemplate(): string {
    return `# Session Learnings

This file captures chronological learning entries from all sessions.

## Learning Categories
- **Feedback**: User feedback and suggestions
- **Mistake**: Errors made and how to prevent them
- **Best Practice**: Discovered best practices and optimizations
- **Decision**: Major technical or product decisions
- **Preference**: Team preferences and coding standards

## Format
Each entry includes:
- Timestamp and title
- Type and category
- Impact level (low/medium/high/critical)
- Context and description
- Action items (if applicable)
- Related features (if applicable)

---

# Session Learning Entries
`
  }

  private getFeedbackPatternsTemplate(): string {
    return `# Feedback Patterns

This file analyzes recurring feedback themes and patterns to identify areas for improvement.

## Common Themes
(This section will be populated as patterns emerge)

## Feedback Analysis
- **High-frequency feedback topics**
- **Resolution strategies that worked**
- **Impact on user satisfaction**

---

# Feedback Entries
`
  }

  private getMistakePreventionTemplate(): string {
    return `# Mistake Prevention Guide

This file catalogs mistakes made during development and how to prevent them in the future.

## Common Mistake Categories
- **Configuration errors**
- **Integration issues**
- **Performance problems**
- **Security vulnerabilities**
- **User experience issues**

## Prevention Strategies
- Code review checklists
- Automated testing approaches
- Documentation requirements

---

# Known Mistakes and Prevention
`
  }

  private getBestPracticesTemplate(): string {
    return `# Best Practices

This file documents proven best practices discovered through development and user feedback.

## Categories
- **Code Quality**
- **Performance Optimization**
- **User Experience**
- **Security**
- **Testing**
- **Documentation**

## Verification Status
- ✅ Verified and implemented
- 🔄 In testing
- 📝 Documented but not yet verified

---

# Established Best Practices
`
  }

  private getTeamKnowledgeTemplate(): string {
    return `# Team Knowledge Base

This file captures team-specific knowledge, insights, and institutional learning.

## Knowledge Areas
- **Domain expertise**
- **Technical insights**
- **Process improvements**
- **Tool mastery**
- **Stakeholder insights**

---

# Team Knowledge Entries
`
  }

  private getTeamPreferencesTemplate(): string {
    return `# Team Preferences

This file documents team preferences for coding style, tools, and workflows.

## Preference Categories
- **Coding Style**: Formatting, naming conventions, patterns
- **Tools**: IDEs, extensions, utilities
- **Workflow**: Git practices, review process, deployment
- **Architecture**: Design patterns, technology choices

---

# Established Preferences
`
  }

  private getProjectConstraintsTemplate(): string {
    return `# Project Constraints

This file documents technical and business constraints that affect development decisions.

## Constraint Types
- **Technical**: Performance, scalability, compatibility
- **Business**: Budget, timeline, regulatory
- **Resource**: Team size, expertise, tools
- **Platform**: Infrastructure, third-party dependencies

---

# Active Constraints
`
  }

  private getDecisionHistoryTemplate(): string {
    return `# Decision History

This file maintains a record of major technical and product decisions with their rationale.

## Decision Categories
- **Architecture**: Technology stack, design patterns
- **Product**: Feature priorities, user experience
- **Process**: Development workflow, quality standards
- **Infrastructure**: Deployment, monitoring, security

---

# Decision Log
`
  }

  private getStakeholderFeedbackTemplate(): string {
    return `# Stakeholder Feedback

This file captures feedback from product managers, business stakeholders, and end users.

## Stakeholder Types
- **Product Management**: Feature priorities, roadmap changes
- **Business**: ROI, market requirements, competitive concerns
- **End Users**: Usability, functionality, satisfaction
- **Technical**: Performance, reliability, maintainability

---

# Stakeholder Input
`
  }
}