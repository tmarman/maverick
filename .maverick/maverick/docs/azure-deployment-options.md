# Azure Deployment Options

This document outlines the different ways to deploy Maverick to Azure App Service.

## Quick Start

For immediate testing, use the simple deployment script:

```bash
# Install Azure CLI if needed
# https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

# Login to Azure
az login

# Deploy
npm run deploy:simple
```

## Deployment Methods

### 1. GitHub Actions (CI/CD) - Recommended for Production
- **File**: `.github/workflows/main_maverick.yml`
- **Trigger**: Push to main branch
- **Benefits**: Automated, includes tests, optimized builds
- **Status**: Currently troubleshooting 409 conflicts

### 2. Simple Local Deployment
- **Command**: `npm run deploy:simple`
- **Requirements**: Azure CLI + login
- **Use case**: Quick testing and development
- **Benefits**: Fastest to set up, uses `az webapp up`

### 3. Full Local Deployment
- **Command**: `npm run deploy:local`
- **Requirements**: Azure CLI + login + app service exists
- **Use case**: Production-like deployment from local
- **Benefits**: Full build optimization, matches CI/CD process

### 4. Publish Profile Deployment
- **Command**: `npm run deploy:profile`
- **Requirements**: Download publish profile from Azure portal
- **Use case**: Alternative when Azure CLI auth is problematic
- **Setup**: Save publish profile as `scripts/maverick.PublishSettings`

## Current Azure Resources

- **App Service**: `maverick`
- **Resource Group**: `maverick_group`
- **Location**: Central US
- **Runtime**: Node.js 18 LTS
- **URL**: https://maverick.azurewebsites.net

## Troubleshooting

### 409 Conflict Errors
The GitHub Actions deployment is encountering 409 conflicts. This typically means:
- Another deployment is in progress, or
- A previous deployment didn't complete cleanly
- The app service is in a locked state

**Solutions to try:**
1. Use local deployment scripts while troubleshooting CI/CD
2. Stop the app service temporarily, then redeploy
3. Use the simple deployment which recreates the deployment

### Missing .next Directory
Our previous deployments failed because the .next directory wasn't preserved in artifact handling. The current workflow now builds and deploys in a single job to avoid this issue.

### Large Package Size
Deployments were timing out due to 1.5GB+ package sizes. We now:
- Run `npm prune --production` after build
- Remove TypeScript, Jest, and other dev-only packages
- Optimize the deployment package before upload

## Files Included in Deployment

**Required for runtime:**
- `.next/` - Built application
- `node_modules/` - Production dependencies only
- `server.js` - Custom server entry point
- `package.json` - App metadata
- `web.config` - IIS configuration for Azure
- `.deployment` - Azure deployment configuration
- `prisma/` - Database schema

**Excluded from deployment:**
- `.git/` - Git history
- `.github/` - CI/CD workflows
- `src/` - Source code (built into .next)
- Dev dependencies in node_modules
- Test files and coverage reports
- Temporary files and logs

## Next Steps

1. **Fix CI/CD**: Resolve the 409 conflict in GitHub Actions
2. **Database Setup**: Configure Azure SQL Database connection
3. **Environment Variables**: Set up production secrets in Azure
4. **Custom Domain**: Configure custom domain if needed
5. **Monitoring**: Set up Application Insights for monitoring

## Environment Variables Needed

The following environment variables need to be configured in Azure App Service:

```env
DATABASE_URL=<Azure SQL connection string>
NEXTAUTH_SECRET=<random secret>
NEXTAUTH_URL=https://maverick.azurewebsites.net
AZURE_EMAIL_CONNECTION_STRING=<Azure Communication Services>
GITHUB_CLIENT_ID=<GitHub OAuth>
GITHUB_CLIENT_SECRET=<GitHub OAuth>
SQUARE_ENVIRONMENT=production
SQUARE_APPLICATION_ID=<Square app ID>
SQUARE_ACCESS_TOKEN=<Square production token>
```

## Deployment Package Optimization

The deployment scripts include these optimizations to reduce package size and deployment time:

1. **Production Dependencies**: Remove dev dependencies after build
2. **Package Cleanup**: Remove TypeScript, Jest, and other dev-only packages
3. **File Exclusion**: Skip .git, .github, src/, and other non-runtime files
4. **Compression**: Use zip compression for faster uploads

This reduces deployment packages from 1.5GB+ to approximately 200-300MB.