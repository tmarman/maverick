# Maverick - Quick Start Guide

## Current Status
✅ **UI Foundation** - Next.js app with Tailwind CSS and Goose-inspired design  
✅ **Architecture** - Temporal workflows, MCP integration, Square API framework  
⏳ **Backend** - API routes ready, database layer needed  
⏳ **Integration** - Mock data, needs real Temporal/Square connections  

## Get Running (5 minutes)

### 1. Install Dependencies
```bash
cd /Users/tim/dev/square/maverick
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. View the App
- **Homepage**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard
- **API Test**: http://localhost:3000/api/test

## What You'll See

### **Homepage** (`/`)
- Hero section with "From idea to deployed app instantly"
- Three feature sections: Formation, AI Code Generation, PRD & Specs
- Goose-inspired black/white/gray design with Cash Sans font

### **Dashboard** (`/dashboard`)
- **Overview Tab**: Formation status, Square revenue, generated apps
- **Formation Tab**: Step-by-step company formation progress
- **Square Tab**: Banking info and API integration status  
- **Apps Tab**: Generated business applications portfolio
- **Goose Tab**: AI assistant integration and recent actions

### **API Routes** (Next.js Backend)
- **`/api/test`** - Simple test endpoint
- **`/api/formation/start`** - Company formation workflow (mock)
- **`/api/square/setup`** - Square business setup (mock)

## Next.js Backend Capabilities

Next.js gives us **full Node.js backend** with API routes:

```typescript
// pages/api/example.ts or app/api/example/route.ts
export async function POST(request: Request) {
  // Full Node.js backend capabilities:
  // - Database connections (SQL Server, PostgreSQL, etc.)
  // - External API calls (Square, legal services, state filing)
  // - File system access for document generation
  // - Email/SMS sending
  // - Temporal workflow orchestration
  
  return Response.json({ message: 'Backend working!' })
}
```

## Database Architecture Plan

### **Recommended: SQL Server on Azure**
```sql
-- Core business formation tables
Companies (id, name, type, state, ein, status, created_at)
Founders (id, company_id, name, email, address, ssn_hash)
Documents (id, company_id, type, content, status, signed_at)
Workflows (id, company_id, type, status, current_step, data)
SquareIntegrations (id, company_id, merchant_id, access_token, setup_status)
GeneratedApps (id, company_id, name, type, repository_url, deployed_url)
```

### **With Prisma ORM:**
```typescript
// Perfect TypeScript integration
const company = await prisma.company.create({
  data: {
    name: "TaskFlow Inc",
    type: "C_CORP", 
    state: "DELAWARE",
    founders: {
      create: { name: "John Smith", email: "john@taskflow.com" }
    }
  }
})
```

## Ready to Implement Next

### **Priority 1: Get UI Working**
- Fix any remaining TypeScript errors
- Polish the dashboard with real interactions
- Add company formation wizard form

### **Priority 2: Add Database Layer**  
- Set up Prisma with SQL Server
- Create migration files
- Connect API routes to database

### **Priority 3: Real Integrations**
- Temporal server for workflows
- MCP server for Goose integration  
- Square sandbox API testing

## Feedback
Leave feedback in `/project/feedback/` - I'll review and iterate!

---

**This is a solid foundation for a Square acquisition target.** 🎯

The architecture positions Maverick as the **only platform where you can start a company through AI conversation** and get fully operational Square-powered business apps.