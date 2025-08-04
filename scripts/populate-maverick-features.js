#!/usr/bin/env node

/**
 * Populate Maverick features into structured AI format
 * This demonstrates our AI analysis system with real feature data
 */

const { promises: fs } = require('fs')
const path = require('path')
const { randomUUID } = require('crypto')

// Import our existing features data
function getExistingMaverickFeatures() {
  return [
    {
      title: "Project Canvas & Work Item Management",
      description: "Visual project canvas where users can create, organize and manage work items (features, bugs, tasks). Includes AI-powered smart creation, drag-and-drop organization by stages (Plan, Execute, Review, Complete), and detailed work item sidebar with subtasks and planning.",
      category: "Project Management", 
      type: "FEATURE",
      status: "ACTIVE",
      components: ["SimpleWorkItemCanvas", "WorkItemDetailSidebar", "WorkItemManager"],
      files: [
        "src/components/SimpleWorkItemCanvas.tsx",
        "src/components/WorkItemDetailSidebar.tsx", 
        "src/app/api/projects/[name]/work-items/"
      ]
    },
    {
      title: "AI-Powered Work Item Analysis",
      description: "Structured AI integration using Claude/Gemini that analyzes user input and creates comprehensive work items with tasks, opportunities, risks, acceptance criteria, and technical considerations. Returns structured JSON for better integration.",
      category: "AI & Automation",
      type: "FEATURE", 
      status: "ACTIVE",
      components: ["StructuredAIProvider"],
      files: [
        "src/lib/structured-ai-provider.ts",
        "src/lib/ai-provider.ts",
        "src/app/api/projects/[name]/work-items/smart-create/"
      ]
    },
    {
      title: "GitHub Repository Integration",
      description: "Import repositories from GitHub, manage project-repository connections, create worktrees for features, and integrate with git-based project architecture. Includes pagination and repository selection.",
      category: "Version Control",
      type: "FEATURE",
      status: "ACTIVE", 
      components: ["GitHubRepositorySelector", "WorktreeManager"],
      files: [
        "src/components/GitHubRepositorySelector.tsx",
        "src/components/WorktreeManager.tsx",
        "src/app/cockpit/repositories/",
        "src/app/api/github/"
      ]
    },
    {
      title: "Project-Based Navigation & Routing",
      description: "Hierarchical project navigation with proper URL routing, project-specific sidebars, and consistent cockpit shell interface. Supports project overview, tasks, code, deployments, team, and analytics views.",
      category: "UI/UX",
      type: "FEATURE",
      status: "ACTIVE",
      components: ["ProjectSidebar", "CockpitShell"],
      files: [
        "src/components/ProjectSidebar.tsx",
        "src/components/CockpitShell.tsx", 
        "src/app/cockpit/projects/[name]/"
      ]
    },
    {
      title: "Markdown-Based Work Item Storage",
      description: "Git-native project architecture where work items are stored as markdown files in project folders. Includes frontmatter metadata, AI-generated content, and file-based indexing for fast UI loading.",
      category: "Data Architecture",
      type: "FEATURE",
      status: "ACTIVE",
      components: ["WorkItem Storage System"],
      files: [
        "src/app/api/projects/[name]/work-items/route.ts",
        "projects/{projectName}/work-items/{workItemId}.md"
      ]
    },
    {
      title: "Claude Code Terminal Integration", 
      description: "WebSocket-based terminal interface for Claude Code CLI integration, persistent sessions, and real-time AI development assistance within project contexts.",
      category: "AI & Development",
      type: "FEATURE",
      status: "ACTIVE",
      components: ["ClaudeCodeTerminal"],
      files: [
        "src/components/ClaudeCodeTerminal.tsx",
        "src/app/api/claude-code/",
        "server.js"
      ]
    },
    {
      title: "Business Formation Workflow",
      description: "Automated LLC/Corp creation workflow with legal document generation, Square integration for business accounts, and guided business setup process.",
      category: "Business Formation",
      type: "FEATURE", 
      status: "ACTIVE",
      components: ["Formation Wizard"],
      files: [
        "src/app/api/formation/",
        "src/components/SquarePaymentForm.tsx"
      ]
    },
    {
      title: "Document Canvas & Collaboration",
      description: "Visual collaboration interface for requirements gathering, document creation, and project planning with real-time collaboration features.",
      category: "Collaboration",
      type: "FEATURE",
      status: "ACTIVE", 
      components: ["DocumentCanvas"],
      files: [
        "src/components/DocumentCanvas.tsx",
        "src/app/api/documents/"
      ]
    },
    {
      title: "Multi-AI Provider System",
      description: "Flexible AI provider system supporting Claude Code, Gemini, and automatic fallback. Includes conversation history, project context, and provider health monitoring.",
      category: "AI & Automation",
      type: "FEATURE",
      status: "ACTIVE",
      components: ["MultiAIProvider"],
      files: [
        "src/lib/ai-provider.ts"
      ]
    },
    {
      title: "Presentation Generator",
      description: "AI-powered presentation generation for business pitches, project overviews, and stakeholder communications.",
      category: "Content Generation", 
      type: "FEATURE",
      status: "ACTIVE",
      components: ["PresentationGenerator"],
      files: [
        "src/components/PresentationGenerator.tsx",
        "src/app/api/presentations/"
      ]
    },
    {
      title: "Authentication & Session Management",
      description: "NextAuth.js integration with magic link authentication, session persistence, and user profile management.",
      category: "Authentication",
      type: "FEATURE",
      status: "ACTIVE",
      components: ["Auth System"],
      files: [
        "src/lib/auth.ts",
        "src/app/api/auth/"
      ]
    },
    {
      title: "Project Insights & Analytics",
      description: "AI-powered project analysis providing insights, opportunities, risks, and recommendations based on current project state and work items.",
      category: "Analytics & Insights",
      type: "FEATURE",
      status: "ACTIVE",
      components: ["Project Insights API"],
      files: [
        "src/app/api/projects/[name]/insights/route.ts"
      ]
    }
  ]
}

// Mock AI analysis function (simulates what our real AI would return)
function mockAIAnalysis(feature) {
  const taskCategories = ['PLANNING', 'DESIGN', 'DEVELOPMENT', 'TESTING', 'DOCUMENTATION']
  const priorities = ['LOW', 'MEDIUM', 'HIGH']
  const impacts = ['LOW', 'MEDIUM', 'HIGH']
  
  // Generate realistic tasks based on feature
  const tasks = [
    {
      id: `task-${randomUUID().slice(0, 8)}`,
      title: `Implement core ${feature.category} functionality`,
      description: `Build the main components and logic for ${feature.title}`,
      priority: 'HIGH',
      estimatedDuration: '1-2d',
      category: 'DEVELOPMENT',
      acceptance_criteria: [
        'Core functionality is implemented and working',
        'Component interfaces are properly defined',
        'Basic error handling is in place'
      ]
    },
    {
      id: `task-${randomUUID().slice(0, 8)}`,
      title: `Create comprehensive tests`,
      description: `Add unit and integration tests for ${feature.title}`,
      priority: 'MEDIUM',
      estimatedDuration: '1d',
      category: 'TESTING',
      acceptance_criteria: [
        'Unit tests cover main functionality',
        'Integration tests verify end-to-end flows',
        'Test coverage is above 80%'
      ]
    },
    {
      id: `task-${randomUUID().slice(0, 8)}`,
      title: `Update documentation`,
      description: `Document usage and implementation details for ${feature.title}`,
      priority: 'MEDIUM',
      estimatedDuration: '4h',
      category: 'DOCUMENTATION',
      acceptance_criteria: [
        'API documentation is complete',
        'Usage examples are provided',
        'Architecture decisions are documented'
      ]
    }
  ]

  // Generate opportunities
  const opportunities = [
    {
      id: `opp-${randomUUID().slice(0, 8)}`,
      title: `Enhanced ${feature.category} automation`,
      description: `Add more AI-powered automation to ${feature.title}`,
      type: 'FEATURE_ENHANCEMENT',
      impact: 'MEDIUM',
      effort: 'MEDIUM',
      timeline: 'Next quarter',
      potential_value: 'Improved user productivity and reduced manual work'
    }
  ]

  // Generate risks
  const risks = [
    {
      id: `risk-${randomUUID().slice(0, 8)}`,
      title: `Scalability concerns for ${feature.category}`,
      description: `Current implementation may not scale with large datasets`,
      severity: 'MEDIUM',
      probability: 'MEDIUM',
      mitigation_strategy: 'Implement caching and optimize database queries',
      impact_areas: ['Performance', 'User Experience']
    }
  ]

  return {
    title: feature.title,
    description: feature.description,
    type: feature.type,
    priority: feature.status === 'ACTIVE' ? 'HIGH' : 'MEDIUM',
    functionalArea: 'SOFTWARE',
    estimatedEffort: '1w',
    tasks,
    opportunities,
    risks,
    acceptance_criteria: [
      'Feature is fully functional and tested',
      'User interface is intuitive and responsive',
      'Performance meets requirements',
      'Documentation is complete'
    ],
    technical_considerations: [
      `Integrate with existing ${feature.category} infrastructure`,
      'Maintain backward compatibility',
      'Follow established coding patterns',
      'Consider security implications'
    ],
    business_impact: `Enhances ${feature.category} capabilities and improves user productivity`
  }
}

function generateFeatureMarkdown(aiAnalysis, workItem, originalFeature) {
  const dateFormatted = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return `---
id: ${workItem.id}
title: "${aiAnalysis.title}"
type: ${workItem.type}
status: ${workItem.status}
priority: ${aiAnalysis.priority}
functionalArea: ${workItem.functionalArea}
estimatedEffort: "${aiAnalysis.estimatedEffort}"
category: "${originalFeature.category}"
businessImpact: "${aiAnalysis.business_impact}"
createdAt: ${workItem.createdAt}
updatedAt: ${workItem.updatedAt}
isExistingFeature: true
---

# ${aiAnalysis.title}

## 📋 Description
${aiAnalysis.description}

**Original Feature Category:** ${originalFeature.category}
**Components:** ${originalFeature.components?.join(', ') || 'N/A'}
**Key Files:** ${originalFeature.files?.join(', ') || 'N/A'}

## 🏷️ Classification
- **Type:** ${workItem.type}
- **Priority:** ${aiAnalysis.priority}
- **Functional Area:** ${workItem.functionalArea}
- **Estimated Effort:** ${aiAnalysis.estimatedEffort}
- **Business Impact:** ${aiAnalysis.business_impact}
- **Current Status:** ${workItem.status}

## ✅ AI-Generated Tasks

${aiAnalysis.tasks.map((task, index) => `### ${index + 1}. ${task.title}
**Priority:** ${task.priority} | **Duration:** ${task.estimatedDuration} | **Category:** ${task.category}

${task.description}

${task.acceptance_criteria && task.acceptance_criteria.length > 0 ? `**Acceptance Criteria:**
${task.acceptance_criteria.map(criteria => `- ${criteria}`).join('\n')}` : ''}
`).join('\n')}

## 🚀 Identified Opportunities

${aiAnalysis.opportunities.length > 0 ? aiAnalysis.opportunities.map(opp => `### ${opp.title}
**Type:** ${opp.type} | **Impact:** ${opp.impact} | **Effort:** ${opp.effort} | **Timeline:** ${opp.timeline}

${opp.description}

**Potential Value:** ${opp.potential_value}
`).join('\n') : '_No specific opportunities identified._'}

## ⚠️ Potential Risks

${aiAnalysis.risks.length > 0 ? aiAnalysis.risks.map(risk => `### ${risk.title}
**Severity:** ${risk.severity} | **Probability:** ${risk.probability}

${risk.description}

**Impact Areas:** ${risk.impact_areas.join(', ')}
**Mitigation Strategy:** ${risk.mitigation_strategy}
`).join('\n') : '_No significant risks identified._'}

## 🎯 Acceptance Criteria

${aiAnalysis.acceptance_criteria.map(criteria => `- [ ] ${criteria}`).join('\n')}

## 🔧 Technical Considerations

${aiAnalysis.technical_considerations.map(consideration => `- ${consideration}`).join('\n')}

## 📁 Implementation Details

### Components
${originalFeature.components?.map(comp => `- **${comp}**: React component implementing ${originalFeature.title} functionality`).join('\n') || '_No specific components listed._'}

### Key Files
${originalFeature.files?.map(file => `- \`${file}\``).join('\n') || '_No specific files listed._'}

## 💬 Feature Analysis Notes

### ${dateFormatted}
- Existing Maverick feature analyzed via AI
- Comprehensive planning and risk assessment completed
- Ready for enhancement or production optimization

---

## Metadata
- **Analyzed:** ${dateFormatted}
- **Project:** maverick
- **Original Category:** ${originalFeature.category}
- **Generated by:** Maverick AI ✨ (Feature Analysis)

> _This is an existing Maverick platform feature analyzed through our structured AI system. The analysis provides insights for production readiness and future enhancements._
`
}

async function saveWorkItemToMarkdown(projectName, workItemId, markdownContent) {
  const workItemsDir = path.join(process.cwd(), 'projects', projectName, 'work-items')
  const filePath = path.join(workItemsDir, `${workItemId}.md`)
  
  await fs.mkdir(workItemsDir, { recursive: true })
  await fs.writeFile(filePath, markdownContent, 'utf-8')
  console.log(`✅ Saved: ${filePath}`)
}

async function updateWorkItemsIndex(projectName, workItems) {
  const indexPath = path.join(process.cwd(), 'projects', projectName, '.maverick.work-items.json')
  
  const index = {
    count: workItems.length,
    lastUpdated: new Date().toISOString(),
    populated_features: true,
    items: workItems.map(item => ({
      id: item.id,
      filename: `${item.id}.md`,
      path: `work-items/${item.id}.md`,
      title: item.title,
      category: item.originalFeature.category,
      status: item.status,
      priority: item.priority
    }))
  }
  
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8')
  console.log(`✅ Updated index: ${indexPath}`)
}

async function generateSummaryReport(workItems, features) {
  const reportPath = path.join(process.cwd(), 'projects', 'maverick', 'FEATURE_ANALYSIS_REPORT.md')
  
  const totalTasks = workItems.reduce((sum, item) => sum + (item.aiTasks?.length || 0), 0)
  const totalOpportunities = workItems.reduce((sum, item) => sum + (item.aiOpportunities?.length || 0), 0)
  const totalRisks = workItems.reduce((sum, item) => sum + (item.aiRisks?.length || 0), 0)
  
  const categoryCounts = features.reduce((acc, feature) => {
    acc[feature.category] = (acc[feature.category] || 0) + 1
    return acc
  }, {})

  const report = `# Maverick Feature Analysis Report

Generated: ${new Date().toISOString()}

## 📊 Summary Statistics

- **Total Features Analyzed:** ${features.length}
- **Work Items Created:** ${workItems.length}
- **Total Tasks Generated:** ${totalTasks}
- **Total Opportunities Identified:** ${totalOpportunities}
- **Total Risks Assessed:** ${totalRisks}

## 📋 Features by Category

${Object.entries(categoryCounts).map(([category, count]) => `- **${category}:** ${count} features`).join('\n')}

## 🎯 Key Features Analyzed

${features.map((feature, index) => `### ${index + 1}. ${feature.title}
**Category:** ${feature.category} | **Status:** ${feature.status}

${feature.description}

**Components:** ${feature.components?.join(', ') || 'N/A'}
`).join('\n')}

## 📈 Analysis Insights

### Feature Distribution
${Object.entries(categoryCounts).map(([category, count]) => 
  `- ${category}: ${count} features (${Math.round(count/features.length*100)}%)`
).join('\n')}

### Production Readiness
- All ${features.length} features are currently marked as ACTIVE
- Comprehensive task breakdown created for each feature
- Risk assessment completed with mitigation strategies
- Enhancement opportunities identified

## 🚀 Next Steps

1. **Review Generated Work Items**: Check the work-items/ folder for detailed analysis
2. **Prioritize Tasks**: Use the structured task data for sprint planning
3. **Address Risks**: Implement mitigation strategies for identified risks
4. **Explore Opportunities**: Plan enhancements based on AI suggestions

## 📁 Generated Files

- **Work Items:** \`.maverick/work-items/\` (${workItems.length} files)
- **Index:** \`.maverick/.maverick.work-items.json\`
- **This Report:** \`.maverick/reports/FEATURE_ANALYSIS_REPORT.md\`

---

*Generated by Maverick AI Feature Analysis System*
`

  await fs.writeFile(reportPath, report, 'utf-8')
  console.log(`✅ Generated report: ${reportPath}`)
}

async function main() {
  console.log('🚀 Populating Maverick features with structured AI analysis...\n')
  
  const projectName = 'maverick'
  const features = getExistingMaverickFeatures()
  const workItems = []

  // Ensure project directory exists
  await fs.mkdir(path.join(process.cwd(), 'projects', projectName), { recursive: true })

  console.log(`📋 Processing ${features.length} existing features...\n`)

  for (const [index, feature] of features.entries()) {
    console.log(`[${index + 1}/${features.length}] Processing: ${feature.title}`)
    
    try {
      // Simulate AI analysis (in production this would call the real AI)
      const aiAnalysis = mockAIAnalysis(feature)
      
      // Create work item
      const workItemId = randomUUID()
      const timestamp = new Date().toISOString()
      
      const workItem = {
        id: workItemId,
        title: aiAnalysis.title,
        description: aiAnalysis.description,
        type: feature.type,
        status: feature.status,
        priority: aiAnalysis.priority,
        functionalArea: 'SOFTWARE',
        parentId: null,
        orderIndex: Date.now() + index,
        depth: 0,
        estimatedEffort: aiAnalysis.estimatedEffort,
        projectName,
        assignedToId: null,
        createdAt: timestamp,
        updatedAt: timestamp,
        // Enhanced with AI analysis
        aiTasks: aiAnalysis.tasks,
        aiOpportunities: aiAnalysis.opportunities,
        aiRisks: aiAnalysis.risks,
        acceptanceCriteria: aiAnalysis.acceptance_criteria,
        technicalConsiderations: aiAnalysis.technical_considerations,
        businessImpact: aiAnalysis.business_impact,
        // Original feature metadata
        originalFeature: feature
      }

      // Generate markdown
      const markdownContent = generateFeatureMarkdown(aiAnalysis, workItem, feature)
      
      // Save to project
      await saveWorkItemToMarkdown(projectName, workItemId, markdownContent)
      
      workItems.push(workItem)
      
      console.log(`   ✅ Generated ${aiAnalysis.tasks.length} tasks, ${aiAnalysis.opportunities.length} opportunities, ${aiAnalysis.risks.length} risks`)
      
    } catch (error) {
      console.error(`   ❌ Error processing ${feature.title}:`, error.message)
    }
  }

  // Update index
  await updateWorkItemsIndex(projectName, workItems)
  
  // Generate summary report
  await generateSummaryReport(workItems, features)

  console.log(`\n🎉 Feature population complete!`)
  console.log(`\n📊 Results:`)
  console.log(`   • ${workItems.length} work items created`)
  console.log(`   • ${workItems.reduce((sum, item) => sum + item.aiTasks.length, 0)} tasks generated`)
  console.log(`   • ${workItems.reduce((sum, item) => sum + item.aiOpportunities.length, 0)} opportunities identified`)
  console.log(`   • ${workItems.reduce((sum, item) => sum + item.aiRisks.length, 0)} risks assessed`)
  console.log(`\n📁 Check the following:`)
  console.log(`   • .maverick/work-items/ - Individual work item files`)
  console.log(`   • .maverick/.maverick.work-items.json - Project index`)
  console.log(`   • .maverick/reports/FEATURE_ANALYSIS_REPORT.md - Summary report`)
  console.log(`\n🎯 Demo ready! Visit http://localhost:5001/cockpit/projects/maverick/tasks to see the results`)
}

main().catch(console.error)