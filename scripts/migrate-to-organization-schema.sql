-- Migration Script: Business → Organization Schema Refactor
-- This script renames Business model to Organization and updates all references

-- Step 1: Rename the main table
EXEC sp_rename 'businesses', 'organizations';

-- Step 2: Rename all Business-related tables to Organization equivalents
EXEC sp_rename 'business_members', 'organization_members';
EXEC sp_rename 'business_formations', 'organization_formations';

-- Step 3: Update column names to reflect the new terminology
-- In organizations table (formerly businesses)
EXEC sp_rename 'organizations.businessType', 'organizationType', 'COLUMN';

-- In organization_members table (formerly business_members)  
EXEC sp_rename 'organization_members.businessId', 'organizationId', 'COLUMN';

-- In organization_formations table (formerly business_formations)
EXEC sp_rename 'organization_formations.businessId', 'organizationId', 'COLUMN';

-- In projects table - update foreign key reference
EXEC sp_rename 'projects.businessId', 'organizationId', 'COLUMN';

-- In users table - update relation name
EXEC sp_rename 'users.businessMemberships', 'organizationMemberships', 'COLUMN';

-- Step 4: Update indexes if they exist
-- Drop existing indexes that reference the old names
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_business_members_businessId_userId')
    DROP INDEX IX_business_members_businessId_userId ON organization_members;

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_business_formations_businessId')
    DROP INDEX IX_business_formations_businessId ON organization_formations;

-- Recreate indexes with new names
CREATE UNIQUE INDEX IX_organization_members_organizationId_userId 
ON organization_members (organizationId, userId);

CREATE INDEX IX_organization_formations_organizationId 
ON organization_formations (organizationId);

-- Step 5: Update foreign key constraint names
-- Note: This requires dropping and recreating the constraints
-- First, get the current constraint names (they may be auto-generated)

-- Drop existing foreign key constraints (names may vary)
DECLARE @sql NVARCHAR(MAX) = ''
SELECT @sql = @sql + 'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + '.' + 
              QUOTENAME(OBJECT_NAME(parent_object_id)) + ' DROP CONSTRAINT ' + QUOTENAME(name) + '; '
FROM sys.foreign_keys 
WHERE referenced_object_id = OBJECT_ID('organizations')

EXEC sp_executesql @sql

-- Recreate foreign key constraints with new names
ALTER TABLE organization_members 
ADD CONSTRAINT FK_organization_members_organizationId 
FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE organization_formations 
ADD CONSTRAINT FK_organization_formations_organizationId 
FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE projects 
ADD CONSTRAINT FK_projects_organizationId 
FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE;

PRINT 'Migration from Business to Organization schema completed successfully!';