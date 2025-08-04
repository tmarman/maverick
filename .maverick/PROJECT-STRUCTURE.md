# Project Structure Overview

**Repository Template Standards for Business-Focused Applications**

## 🏗️ Directory Organization

### Root Level (Keep Minimal)
```
├── package.json              # Dependencies and scripts
├── README.md                 # Project overview and getting started
├── CLAUDE.md                 # AI development guidance
├── server.js                 # Custom server configuration
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # Styling configuration
├── tsconfig.json             # TypeScript configuration
├── prisma/                   # Database schema only
└── .github/                  # GitHub workflows and templates
```

### /project Directory (All Documentation)
```
/project/
├── specifications.md         # Product requirements and specifications
├── marketing.md              # Marketing strategy and content
├── pricing-strategy.md       # Business pricing models
├── 
├── /docs/                    # Technical documentation
│   ├── PLATFORM_ARCHITECTURE.md
│   ├── DATABASE_STRATEGY.md
│   └── COSMOS_DB_ANALYSIS.md
├── 
├── /setup/                   # Installation and setup guides
│   ├── DATABASE_SETUP_INSTRUCTIONS.md
│   ├── NEXTAUTH_SETUP.md
│   ├── LOCAL_AI_SETUP.md
│   ├── STARTUP.md
│   ├── GITHUB_INTEGRATION_GUIDE.md
│   ├── GOOSE_INTEGRATION.md
│   └── database-setup.sql
└── 
└── /deployment/              # Deployment configuration
    └── azure-env-setup.md
```

### /scripts Directory (Utilities)
```
/scripts/
├── test-*.js                 # Testing utilities
├── debug-*.js                # Debugging tools
├── verify-*.js               # Verification scripts
└── setup-*.js                # Setup automation
```

### /src Directory (Application Code)
```
/src/
├── app/                      # Next.js App Router
├── components/               # React components
├── lib/                      # Business logic and utilities
└── styles/                   # Global styles
```

## 📋 File Naming Conventions

### Documentation
- **kebab-case** for all files: `database-setup.md`
- **SCREAMING_CASE** for major docs: `PLATFORM_ARCHITECTURE.md`
- **Descriptive names**: `azure-env-setup.md` not `azure.md`

### Code Files  
- **PascalCase** for components: `NavigationMenu.tsx`
- **camelCase** for utilities: `databaseService.ts`
- **kebab-case** for pages: `register/page.tsx`

### Scripts
- **Functional naming**: `test-email-api.js`
- **Purpose-first**: `debug-square-oauth.js`
- **Action-object**: `verify-database.js`

## 🎯 Organization Principles

### Business-First Structure
- **Non-developers should understand the organization**
- **Business documentation at project root level**
- **Technical details in appropriate subdirectories**
- **Clear separation of concerns**

### Template Scalability
- **Consistent patterns across all Maverick projects**
- **Easy to replicate for new business applications**
- **Clear entry points for different user types**
- **Maintainable as projects grow**

### Professional Standards
- **No clutter in root directory**
- **Everything has a logical place**
- **Easy to find what you need**
- **Scales from small to enterprise projects**

## ⚠️ Rules to Follow

### DO
✅ Put all documentation in `/project` subdirectories  
✅ Keep root directory minimal and clean  
✅ Use consistent naming conventions  
✅ Organize by function, not file type  
✅ Make structure self-explanatory  

### DON'T  
❌ Create .md files in root directory  
❌ Mix business and technical docs  
❌ Use unclear or abbreviated names  
❌ Create deep nested structures unnecessarily  
❌ Leave files unorganized "temporarily"  

## 🚀 Template Benefits

This structure ensures:
- **Professional appearance** for business stakeholders
- **Developer efficiency** with clear organization  
- **Easy scaling** as projects grow
- **Consistent patterns** across all Maverick applications
- **Business-focused** rather than developer-centric organization

---

*This structure serves as the standard template for all Maverick business application repositories.*