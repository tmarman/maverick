# Vercel Database Setup Guide

## Quick Fix for Current Deployment Issue

Your Vercel deployment is failing because it's trying to use SQL Server but doesn't have a proper `sqlserver://` connection string.

## ✅ Schema Updated for Multi-Database Support

**Good news!** I've updated your schema to use PostgreSQL by default, and created a separate SQL Server schema file for your Azure deployments.

- **`prisma/schema.prisma`** - Now uses `provider = "postgresql"` (for Vercel)
- **`prisma/schema.sqlserver.prisma`** - Uses `provider = "sqlserver"` (for Azure)

### Option 1: Set Up PostgreSQL Database (Recommended)

1. **Go to your Vercel project dashboard**
2. **Go to Storage tab** → **Create Database** → **PostgreSQL** (powered by Neon)
3. **Connect your database** - this will automatically add `DATABASE_URL` to your Vercel project
4. **Your schema is already configured for PostgreSQL!** ✅

### Option 2: Use Your Existing SQL Server (Advanced)

If you want to keep using your Azure SQL Server for Vercel:

1. **Add these environment variables to Vercel:**
   ```
   DATABASE_PROVIDER=sqlserver
   DATABASE_URL=sqlserver://marmandb.database.windows.net:1433;database=maverick;user=tmarman;password=y*!8pf3QjZ%nOsh9;encrypt=true;trustServerCertificate=true;enableArithAbort=true
   ```

2. **Make sure your Azure SQL Server allows connections from Vercel** (you may need to add Vercel's IP ranges to your firewall)

### Environment Variable Setup

Your Vercel project needs these environment variables:

**Required:**
- `DATABASE_PROVIDER` - either "postgresql" or "sqlserver"  
- `DATABASE_URL` - your database connection string
- `NEXTAUTH_URL` - your Vercel app URL (e.g., https://your-app.vercel.app)
- `NEXTAUTH_SECRET` - your NextAuth secret

**Optional (if using these features):**
- `SQUARE_ACCESS_TOKEN`
- `SQUARE_CLIENT_ID`
- `SQUARE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `AZURE_COMMUNICATION_CONNECTION_STRING`

### Migration Commands

After setting up the database:

```bash
# Generate Prisma client for the new database
npx prisma generate

# Push your schema to the new database  
npx prisma db push

# Optional: Seed with initial data
npx prisma db seed
```

### Recommended: PostgreSQL with Neon

PostgreSQL is easier to set up on Vercel and has better compatibility. The schema will work with both databases since we use `@db.Text` which is supported by both.

## Current Schema Compatibility

✅ Your current schema is compatible with both PostgreSQL and SQL Server
✅ All JSON fields use `@db.Text` which works on both databases
✅ No database-specific features that would break compatibility

## Next Steps

1. Choose your database option (PostgreSQL recommended)
2. Set up the database in Vercel
3. Add the environment variables
4. Redeploy your application

The deployment should work once you have the correct `DATABASE_PROVIDER` and `DATABASE_URL` environment variables set.