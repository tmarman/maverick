# Session Learnings

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

## 2025-08-03 - Learning Capture System Required
**ID**: learning_1722686820_abc123def
**Type**: feedback
**Category**: user-feedback
**Impact**: critical
**Context**: Automatic Feature Extraction implementation
**Description**: we're capturing all of these things in our .maverick right? I think we should also capture 'learnings' somehow, i.e., the feedback I'm giving and in general the learnings we've made together, so we can not repeat those mistakes again
**Action Items**: Implement learning capture system in .maverick workspace structure

## 2025-08-03 - AI-First Architecture Over Complex Parsing
**ID**: learning_1722686823_def456ghi
**Type**: feedback
**Category**: architecture
**Impact**: critical
**Context**: Repository scanning implementation
**Description**: I think for these kinds of things, especially the scanning stuff, we should rely on our AI integrations (i.e., Claude) to do this. It's really about orchestration, instruction and context (the last of which we'll give with the file based solution).
**Action Items**: Refactor from complex parsing to AI orchestration approach
**Related Features**: automatic-feature-extraction

## 2025-08-03 - MCP Server Integration for AI Tools
**ID**: learning_1722686825_ghi789jkl
**Type**: feedback
**Category**: integration
**Impact**: high
**Context**: AI tool ecosystem expansion
**Description**: Oh and we should have an MCP server built in for your stuff in Goose etc just because, just like we have OpenAI and anthropic APIs
**Action Items**: Add MCP server implementation to platform
**Related Features**: ai-provider, claude-code-integration

## 2025-08-03 - Dark Mode UI Requirement
**ID**: learning_1722686827_jkl012mno
**Type**: feedback
**Category**: user-interface
**Impact**: medium
**Context**: Platform usability for developers
**Description**: this is gonna sound stupid and we're gonna capture this here, but let's also make sure we offer dark mode (which will basically be inverted)
**Action Items**: Implement dark mode toggle with inverted color scheme
**Related Features**: ui-design, theme-system

## 2025-08-03 - Executive Dashboard Project Overview Requirements
**ID**: learning_1722686830_mno345pqr
**Type**: feedback
**Category**: user-interface
**Impact**: high
**Context**: Project details page enhancement
**Description**: On the /app link, where we show project details, the project details should include more than just the link to the dashboard. let's think through what the requirements/status makes sense there at that level. I think maybe any in progress features should be there, summary/review status... I'm thinking of this like i'm the sponsor of a number of different tentpoles/projects, and they're each coming and giving me updates. or like I'm a vc, these are my investments and i get my monthly or quarterly board updates
**Action Items**: Create executive-level project overview with status summaries, in-progress features, and high-level metrics
**Related Features**: project-overview, dashboard, status-reporting

## 2025-08-03 - Platform Evolution Vision: Comprehensive Business Operations
**ID**: learning_1722686835_pqr678stu
**Type**: feedback
**Category**: product-vision
**Impact**: critical
**Context**: Long-term platform roadmap
**Description**: And we can evolve this platform into something that handles board comms, in addition to the legal stuff we're doing, cap tables, marketing, business intelligence, links/knowledge sharing etc... but we're going to build and track all of those using Maverick itself. (So start to capture these as longer term roadmap features!)
**Action Items**: Create epic work items for comprehensive business operations platform (board communications, cap tables, marketing, BI, knowledge sharing)
**Related Features**: business-operations, board-communications, cap-tables, marketing-platform, business-intelligence, knowledge-management
**Strategic Impact**: Transforms Maverick from project management to full business operations platform

## 2025-08-03 - Project View Killer Feature Recognition
**ID**: learning_1722686840_stu901vwx
**Type**: feedback
**Category**: product-validation
**Impact**: high
**Context**: Executive dashboard implementation
**Description**: Holy shit though, this project view is becoming killer! We'll need to keep capturing this kind of structure, because having these ideas in the icebox/planning phase is awesome.
**Action Items**: Continue building comprehensive project views, maintain structured idea capture process
**Related Features**: executive-dashboard, project-overview, idea-management

## 2025-08-03 - Estimation Philosophy: Priority Over Time
**ID**: learning_1722686842_vwx234yza
**Type**: feedback
**Category**: estimation-strategy
**Impact**: critical
**Context**: AI-driven development estimation
**Description**: let's shift the estimates because time is a circle with AI generation... we're really trying to focus on priority and effort level and we can MAYBE start to estimate scope / t-shirt size stuff when it comes to credits
**Action Items**: Refactor estimation from time-based to priority/effort/scope-based system, consider AI credit-based estimation
**Related Features**: work-item-estimation, ai-credit-system, priority-management
**Philosophy**: Time estimation is unreliable with AI - focus on priority, effort level, and scope instead

## 2025-08-03 - Domain Name Registration
**ID**: learning_1722686850_yza012bcd
**Type**: decision
**Category**: branding
**Impact**: medium
**Context**: Platform branding and domain setup
**Description**: Ok, I added a domain name "flywithmaverick.com", it was the best I could do for now.
**Action Items**: Configure domain DNS, update branding references, set up SSL certificate
**Related Features**: branding, domain-management, deployment
**Strategic Value**: Establishes official platform presence with memorable domain

## 2025-08-03 - Sidebar Tree Structure Clarification
**ID**: learning_1722686855_bcd345efg
**Type**: feedback
**Category**: ui-design
**Impact**: high
**Context**: Sidebar design and file structure alignment
**Description**: I should clarify when I say the sidebar should be like windows explorer... I just mean, let's do a tree based approach that matches our file/folder based approach for .maverick folders
**Action Items**: Create tree-based sidebar that mirrors actual .maverick folder structure
**Related Features**: sidebar-navigation, file-structure, tree-view
**Design Philosophy**: UI should reflect actual file/folder organization for intuitive navigation

## 2025-08-03 - Azure Deployment Strategy
**ID**: learning_1722686860_efg678hij
**Type**: decision
**Category**: infrastructure
**Impact**: high
**Context**: Production deployment strategy selection
**Description**: and why are we not deploying to azure? - User pointed out Azure makes more sense since we already use Azure Email Service
**Action Items**: Prioritize Azure Container Apps or Azure App Service for deployment over Railway/Render
**Related Features**: production-deployment, azure-integration, infrastructure
**Strategic Reasoning**: Leverage existing Azure services integration for unified platform

## 2025-08-03 - Web-Based Claude Code Terminal Vision
**ID**: learning_1722686865_hij901klm
**Type**: requirement
**Category**: ai-integration
**Impact**: critical
**Context**: Building Crystal.app-like functionality in browser
**Description**: Yes, let's focus on that. I want this to be a web-based Crystal.app basically! - User wants multi-session Claude Code management in browser
**Action Items**: Build web terminal component with multi-session management, real-time file sync, and /repos/tim/maverick workspace pattern
**Related Features**: claude-terminal-manager, multi-session-management, web-ide
**Platform Vision**: Transform Maverick into first browser-based AI development platform with full git integration

## 2025-08-03 - Marketing Site Cleanup
**ID**: learning_1722686870_klm234nop
**Type**: feedback
**Category**: user-experience
**Impact**: medium
**Context**: Marketing site navigation simplification
**Description**: On the marketing site (i.e., outside of /app) we're going to remove the links to Import, and to Examples,. but not the underlying pages for now ok? Same with AI Config
**Action Items**: Remove Import, Examples, and AI Config links from marketing navigation while preserving pages
**Related Features**: marketing-navigation, site-structure
**UX Philosophy**: Simplify marketing site to focus on core value proposition

## 2025-08-03 - About Page Requirement
**ID**: learning_1722686875_nop567qrs
**Type**: requirement
**Category**: marketing
**Impact**: medium
**Context**: Marketing site content gaps
**Description**: Maybe we need an /about page though in there, we have pricing but no details on what we do
**Action Items**: Create comprehensive About page explaining Maverick's business formation and AI development platform
**Related Features**: about-page, marketing-content, value-proposition
**Content Strategy**: Need clear explanation of what Maverick does for visitor understanding

## 2025-08-03 - Documentation Links Broken
**ID**: learning_1722686880_qrs890tuv
**Type**: bug-report
**Category**: documentation
**Impact**: medium
**Context**: Docs navigation and user experience
**Description**: Many of the docs links are broken, e.g., http://localhost:5001/docs/square-apps
**Action Items**: Fix broken documentation links and create missing doc pages
**Related Features**: documentation, square-integration, user-guides
**Quality Issue**: Broken links hurt user experience and platform credibility

## 2025-08-03 - Continuous Learning Capture Requirement
**ID**: learning_1722686885_tuv123wxy
**Type**: requirement
**Category**: self-improvement
**Impact**: high
**Context**: Systematic improvement and dogfooding
**Description**: and make sure this is always captured and updated in .maverick - User wants all learnings continuously captured in workspace
**Action Items**: Ensure all feedback and insights are systematically captured in .maverick/learnings/
**Related Features**: learning-capture, dogfooding-system, continuous-improvement
**Meta-Learning**: The act of capturing learnings is itself a critical learning that must be preserved