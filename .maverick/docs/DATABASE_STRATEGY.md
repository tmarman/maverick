# 🗄️ Hybrid Database Strategy for Maverick
## Portable Data Model: Cosmos DB + SQL Server with Prisma ORM

### 🎯 **Recommended Approach: Prisma with Dual Database Support**

**Why Prisma is Perfect:**
- ✅ **Multi-database support** (PostgreSQL, SQL Server, MongoDB, soon Cosmos DB)
- ✅ **Type-safe migrations** 
- ✅ **Portable schema definitions**
- ✅ **Easy database switching**
- ✅ **Already in your project!**

### 📊 **Database Strategy Options**

#### **Option A: Start with SQL Server + Future Cosmos Migration**
```prisma
// Prisma schema works with SQL Server now
// Can migrate to Cosmos DB when Prisma adds full support
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlserver"  // Easy to change later
  url      = env("DATABASE_URL")
}
```

#### **Option B: Hybrid Architecture (Recommended)**
- **SQL Server**: Structured relational data (users, businesses, projects)
- **Cosmos DB**: Flexible documents (chat messages, canvas data, AI context)
- **Prisma**: Manages SQL Server schema and migrations
- **Azure Cosmos SDK**: Direct access for document operations

---

## 🏗️ **Portable Data Model Design**

### **Core Principle: JSON-First Design**
Design the schema to work well in both relational and document databases:

```prisma
model Business {
  id          String   @id @default(cuid())
  name        String
  description String?
  industry    String?
  
  // JSON fields work in both SQL Server and Cosmos
  formationData    Json?    // Legal docs, EIN, Square data
  aiPreferences    Json?    // AI agent settings
  metadata         Json?    // Flexible business-specific data
  
  // Relationships (SQL Server) / References (Cosmos)
  projects    Project[]
  owner       User      @relation(fields: [ownerId], references: [id])
  ownerId     String
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@map("businesses")
}

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  type        ProjectType
  status      ProjectStatus @default(PLANNING)
  
  // JSON for flexibility
  githubConfig     Json?    // Repository settings
  aiAgentConfig    Json?    // Which AI agents to use
  metadata         Json?    // Project-specific data
  
  // Relationships
  business    Business  @relation(fields: [businessId], references: [id])
  businessId  String
  documents   Document[]
  features    Feature[]
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@map("projects")
}

model Document {
  id          String   @id @default(cuid())
  title       String
  type        DocumentType
  
  // Core content as JSON (works in both databases)
  content     Json     // Canvas elements, chat messages, etc.
  aiContext   Json?    // AI system prompts and context
  settings    Json?    // Document-specific settings
  
  // Relationships
  project     Project  @relation(fields: [projectId], references: [id])
  projectId   String
  
  // Collaboration
  createdBy   User     @relation(fields: [createdById], references: [id])
  createdById String
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("documents")
}

// Enums work in both databases
enum ProjectType {
  SOFTWARE
  MARKETING
  OPERATIONS
  LEGAL
  FINANCIAL
}

enum ProjectStatus {
  PLANNING
  ACTIVE
  COMPLETED
  ARCHIVED
}

enum DocumentType {
  PRD
  CANVAS
  CHAT
  SPEC
  CODE_REVIEW
  MEETING_NOTES
}
```

---

## 🔄 **Migration Strategy**

### **Phase 1: SQL Server with Prisma (Start Here)**
1. Use your existing SQL Server instance
2. Full relational model with JSON fields for flexibility
3. Easy migrations with `prisma migrate`
4. Type-safe database access

### **Phase 2: Hybrid Architecture (Scale)**
1. Keep core business data in SQL Server
2. Move document content to Cosmos DB for vector search
3. Use both databases in parallel

### **Phase 3: Full Cosmos Migration (Future)**
1. When Prisma fully supports Cosmos DB
2. Migrate entire schema using Prisma's migration tools

---

## 🚀 **Implementation Plan**

### **Step 1: Update Prisma Schema**
Extend your existing schema with the new models:

```prisma
// Add to your existing prisma/schema.prisma

model Business {
  // ... (schema above)
}

model Project {
  // ... (schema above)
}

model Document {
  // ... (schema above)
}

model Feature {
  id              String   @id @default(cuid())
  title           String
  description     String?
  status          FeatureStatus @default(PLANNED)
  
  // GitHub integration
  githubIssueNumber    Int?
  githubPRNumber       Int?
  
  // JSON for flexibility
  acceptanceCriteria   Json?
  aiGeneratedData      Json?
  
  project         Project  @relation(fields: [projectId], references: [id])
  projectId       String
  
  assignedTo      User?    @relation(fields: [assignedToId], references: [id])
  assignedToId    String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("features")
}

model AIAgent {
  id              String   @id @default(cuid())
  name            String   @unique // "product_expert", "lawyer", etc.
  displayName     String   // "Product Expert", "Legal Advisor"
  systemPrompt    String   @db.Text
  specialization  String
  isActive        Boolean  @default(true)
  
  // Configuration as JSON
  configuration   Json?    // Model settings, parameters, etc.
  
  createdBy       User     @relation(fields: [createdById], references: [id])
  createdById     String
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("ai_agents")
}

model Recommendation {
  id              String   @id @default(cuid())
  category        String   // "incorporation", "marketing", etc.
  title           String
  content         String   @db.Text
  
  // For future vector search
  tags            Json?    // Array of tags
  metadata        Json?    // Additional structured data
  
  confidenceScore Float?
  sourceType      RecommendationSource
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("recommendations")
}

enum FeatureStatus {
  PLANNED
  IN_PROGRESS
  REVIEW
  DONE
  CANCELLED
}

enum RecommendationSource {
  EXPERT_KNOWLEDGE
  USER_GENERATED
  AI_GENERATED
}
```

### **Step 2: Database Connection Setup**

For SQL Server, update your `.env.local`:
```env
# SQL Server connection
DATABASE_URL="sqlserver://localhost:1433;database=maverick;user=sa;password=YourPassword;trustServerCertificate=true"

# Optional: Cosmos DB for future hybrid setup
COSMOS_DB_CONNECTION_STRING="your-cosmos-connection-string"
COSMOS_DB_DATABASE_NAME="maverick"
```

### **Step 3: Run Migrations**
```bash
# Generate Prisma client with new schema
npm run db:generate

# Create and apply migration
npx prisma migrate dev --name "add-business-projects-documents"

# Push to database (alternative to migrate)
npm run db:push
```

---

## 🔧 **Database Service Layer**

Create a unified service layer that can work with both databases:

```typescript
// src/lib/database.ts
import { PrismaClient } from '@prisma/client'
import { CosmosClient } from '@azure/cosmos'

export class DatabaseService {
  private prisma: PrismaClient
  private cosmos?: CosmosClient
  
  constructor() {
    this.prisma = new PrismaClient()
    
    // Optional Cosmos DB for hybrid setup
    if (process.env.COSMOS_DB_CONNECTION_STRING) {
      this.cosmos = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING)
    }
  }
  
  // Business operations (SQL Server)
  async createBusiness(data: CreateBusinessData) {
    return this.prisma.business.create({
      data: {
        ...data,
        formationData: data.formationData || {},
        aiPreferences: data.aiPreferences || {},
        metadata: data.metadata || {}
      }
    })
  }
  
  // Document operations (flexible - can use either database)
  async createDocument(data: CreateDocumentData) {
    if (this.cosmos && data.type === 'CHAT') {
      // Use Cosmos for chat documents (better for real-time)
      return this.createDocumentInCosmos(data)
    } else {
      // Use SQL Server for structured documents
      return this.prisma.document.create({ data })
    }
  }
  
  private async createDocumentInCosmos(data: CreateDocumentData) {
    // Direct Cosmos DB operations for documents that need vector search
    const container = this.cosmos!.database('maverick').container('documents')
    return container.items.create({
      id: data.id,
      type: 'document',
      partitionKey: data.projectId,
      ...data,
      _ts: Date.now()
    })
  }
}

export const db = new DatabaseService()
```

---

## 🎯 **Why This Approach is Perfect**

### **✅ Database Portability**
- Same Prisma schema works with SQL Server, PostgreSQL, MySQL
- JSON fields provide document-like flexibility
- Easy to migrate between databases

### **✅ Type Safety**
- Full TypeScript support with Prisma
- Auto-generated types for all models
- Compile-time validation

### **✅ Migration Support**
- Version-controlled schema changes
- Rollback capability
- Team collaboration on schema changes

### **✅ Hybrid Ready**
- Can add Cosmos DB later without changing existing code
- Gradual migration path
- Best of both worlds (relational + document)

### **✅ AI-Native Design**
- JSON fields for flexible AI context
- Vector search ready (when migrating to Cosmos)
- Configurable AI agents

---

## 🚀 **Next Steps**

1. **Choose your starting database** (I recommend SQL Server since it's ready)
2. **Update Prisma schema** with the new models
3. **Run migrations** to create the tables
4. **Build the service layer** for business operations
5. **Create the first Business → Project → Document** flow

Want me to help you set up the SQL Server connection and run the first migration? We can always add Cosmos DB later for the document-heavy features that need vector search!