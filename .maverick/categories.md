# Project Categories

Categories help organize work items by functional area. Each category can span multiple teams and represents a logical grouping of related work.

## Category Definitions

### Authentication & Security
- **ID**: `auth-security`
- **Color**: `#F59E0B`
- **Description**: Authentication, authorization, security features, permissions, OAuth, data protection
- **Keywords**: auth, login, password, security, permission, oauth, jwt, token, encrypt, session, authorization
- **Examples**: Login systems, user permissions, security audits, data encryption

### User Interface & Experience  
- **ID**: `ui-ux`
- **Color**: `#3B82F6`
- **Description**: User interface components, design systems, user experience, frontend interactions
- **Keywords**: ui, frontend, component, styling, css, tailwind, react, design, button, form, modal, responsive, theme, interface, sidebar, canvas, visual
- **Examples**: Component libraries, design systems, responsive layouts, user flows

### API & Services
- **ID**: `api-services` 
- **Color**: `#10B981`
- **Description**: Backend services, API endpoints, business logic, integrations, data processing
- **Keywords**: api, backend, server, endpoint, route, middleware, service, logic, processing, integration, webhook, controller
- **Examples**: REST APIs, business logic, third-party integrations, microservices

### Data & Analytics
- **ID**: `data-analytics`
- **Color**: `#8B5CF6` 
- **Description**: Database design, data modeling, analytics, reporting, search, data pipelines
- **Keywords**: database, db, sql, prisma, schema, migration, query, table, model, index, optimization, search, uuid, analytics, reporting
- **Examples**: Database schemas, analytics dashboards, data migration, search functionality

### Infrastructure & DevOps
- **ID**: `infrastructure-devops`
- **Color**: `#EF4444`
- **Description**: Deployment, CI/CD, monitoring, performance optimization, scaling, infrastructure
- **Keywords**: deploy, deployment, ci/cd, pipeline, docker, kubernetes, infrastructure, monitoring, scaling, build, devops, config, automate, actions, github, error, debug, fix, performance
- **Examples**: CI/CD pipelines, monitoring systems, deployment automation, performance optimization

### Testing & Quality
- **ID**: `testing-quality` 
- **Color**: `#6B7280`
- **Description**: Testing frameworks, quality assurance, validation, reliability, accessibility
- **Keywords**: test, testing, spec, jest, cypress, qa, quality, unit test, validation, coverage, suite, accessibility, reliability
- **Examples**: Unit tests, integration tests, QA processes, accessibility testing

### Content & Marketing
- **ID**: `content-marketing`
- **Color**: `#EC4899` 
- **Description**: Content creation, marketing materials, documentation, SEO, campaigns
- **Keywords**: marketing, copy, content, landing page, documentation, docs, readme, blog, seo, campaign, analytics, tracking, conversion, messaging, team, contextual, advice
- **Examples**: Marketing pages, documentation, blog posts, SEO optimization

## Custom Categories

Users can add custom categories by editing this file. Each category should follow this format:

### Category Name
- **ID**: `category-id` (lowercase, hyphenated)
- **Color**: `#HEXCOLOR` 
- **Description**: Brief description of what this category covers
- **Keywords**: comma, separated, keywords, for, auto-categorization
- **Examples**: Example work items that would fit this category

## Category Management

Categories are automatically applied to work items based on keyword matching. Users can:
1. Edit this file to modify existing categories
2. Add new custom categories
3. Override auto-categorization by manually setting the category in work item frontmatter
4. Suggest new categories through the UI

---
*Last updated: ${new Date().toISOString()}*