-- Azure PostgreSQL Database Setup for Maverick
-- Run this SQL script on your Azure PostgreSQL database

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (NextAuth required)
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Create accounts table (NextAuth required)
CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- Create sessions table (NextAuth required)
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- Create verification tokens table (NextAuth required)
CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- Create square_connections table (Maverick specific)
CREATE TABLE IF NOT EXISTS "square_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "square_connections_pkey" PRIMARY KEY ("id")
);

-- Create github_connections table (Maverick specific)
CREATE TABLE IF NOT EXISTS "github_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "githubId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scopes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_connections_pkey" PRIMARY KEY ("id")
);

-- Create businesses table (Maverick specific)
CREATE TABLE IF NOT EXISTS "businesses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "industry" TEXT,
    "businessType" TEXT,
    "location" TEXT,
    "legalStructure" TEXT,
    "state" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "squareServices" TEXT[],
    "appType" TEXT,
    "appFeatures" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- Create business_formations table (Maverick specific)
CREATE TABLE IF NOT EXISTS "business_formations" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "workflowId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INITIATED',
    "currentStep" TEXT,
    "completedSteps" TEXT[],
    "documentsGenerated" TEXT[],
    "stateFilingId" TEXT,
    "einNumber" TEXT,
    "bankingSetup" BOOLEAN NOT NULL DEFAULT false,
    "appGenerated" BOOLEAN NOT NULL DEFAULT false,
    "deploymentUrl" TEXT,
    "repositoryUrl" TEXT,
    "cost" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_formations_pkey" PRIMARY KEY ("id")
);

-- Create chat_sessions table (Maverick specific)
CREATE TABLE IF NOT EXISTS "chat_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionData" JSONB NOT NULL,
    "completionPercentage" INTEGER NOT NULL DEFAULT 0,
    "currentStep" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX IF NOT EXISTS "square_connections_userId_key" ON "square_connections"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "square_connections_merchantId_key" ON "square_connections"("merchantId");
CREATE UNIQUE INDEX IF NOT EXISTS "github_connections_userId_key" ON "github_connections"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "github_connections_githubId_key" ON "github_connections"("githubId");
CREATE UNIQUE INDEX IF NOT EXISTS "github_connections_username_key" ON "github_connections"("username");

-- Add foreign key constraints
ALTER TABLE "Account" 
ADD CONSTRAINT "Account_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session" 
ADD CONSTRAINT "Session_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "square_connections" 
ADD CONSTRAINT "square_connections_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "github_connections" 
ADD CONSTRAINT "github_connections_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "businesses" 
ADD CONSTRAINT "businesses_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "business_formations" 
ADD CONSTRAINT "business_formations_businessId_fkey" 
FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chat_sessions" 
ADD CONSTRAINT "chat_sessions_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert initial data (optional)
-- You can add any seed data here if needed

-- Grant permissions (adjust as needed for your Azure setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;