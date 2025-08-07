# Safe Organization Migration Steps

## Problem
We need to add `organizationId` to existing projects, but Prisma can't add a required column to a table with existing data.

## Solution: 3-Step Migration

### Step 1: Make organizationId Optional
1. Edit `prisma/schema.prisma`
2. Change `organizationId String` to `organizationId String?` (make it optional)
3. Run `npx prisma db push`

### Step 2: Populate Data
1. Run the migration script: `node scripts/migrate-add-organizations.js`
2. This creates organizations and assigns all projects

### Step 3: Make organizationId Required  
1. Edit `prisma/schema.prisma`
2. Change `organizationId String?` back to `organizationId String` (make it required)
3. Run `npx prisma db push`

## Files Changed
- `prisma/schema.prisma` (temporarily, then reverted)
- Database populated with organizations
- All existing projects assigned to organizations

This ensures NO DATA LOSS while properly migrating to the new schema.