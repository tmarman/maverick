# Azure Deployment Guide for Maverick

## Why Azure?
- **Existing Integration**: Already using Azure Email Service
- **Custom Server Support**: Azure App Service supports Node.js custom servers
- **Enterprise Ready**: Built-in SSL, scaling, monitoring
- **Cost Effective**: Integrated billing with existing Azure services

## Deployment Options

### Option 1: Azure Container Apps (FASTEST)
```bash
# Prerequisites
az login
az extension add --name containerapp

# One-command deployment
az containerapp up \
  --name maverick-prod \
  --resource-group maverick-rg \
  --location eastus \
  --environment maverick-env \
  --source . \
  --target-port 5001 \
  --ingress external
```

### Option 2: Azure App Service (RECOMMENDED)

#### 1. Create Azure Resources
```bash
# Create resource group
az group create --name maverick-rg --location eastus

# Create App Service plan
az appservice plan create \
  --name maverick-plan \
  --resource-group maverick-rg \
  --sku B1 \
  --is-linux

# Create web app
az webapp create \
  --name maverick-prod \
  --resource-group maverick-rg \
  --plan maverick-plan \
  --runtime "NODE|18-lts"
```

#### 2. Configure Application Settings
```bash
# Set Node.js startup command
az webapp config set \
  --name maverick-prod \
  --resource-group maverick-rg \
  --startup-file "server.js"

# Configure environment variables
az webapp config appsettings set \
  --name maverick-prod \
  --resource-group maverick-rg \
  --settings \
    NODE_ENV=production \
    NEXTAUTH_URL=https://maverick-prod.azurewebsites.net \
    NEXTAUTH_SECRET="your-secret-here"
```

#### 3. Deploy via GitHub Actions
Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure App Service

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to Azure
      uses: azure/webapps-deploy@v2
      with:
        app-name: maverick-prod
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: .
```

## Database Setup

### Option 1: Azure Database for PostgreSQL
```bash
# Create PostgreSQL server
az postgres server create \
  --name maverick-db \
  --resource-group maverick-rg \
  --location eastus \
  --admin-user maverickadmin \
  --admin-password "SecurePassword123!" \
  --sku-name B_Gen5_1

# Create database
az postgres db create \
  --name maverick \
  --server-name maverick-db \
  --resource-group maverick-rg

# Get connection string
az postgres server show-connection-string \
  --server-name maverick-db \
  --database-name maverick \
  --admin-user maverickadmin \
  --admin-password "SecurePassword123!"
```

### Option 2: Use Existing SQL Server
Update Prisma schema to use Azure SQL Database connection.

## Custom Domain Setup

### 1. Add Custom Domain
```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name maverick-prod \
  --resource-group maverick-rg \
  --hostname flywithmaverick.com

# Enable SSL
az webapp config ssl create \
  --name maverick-prod \
  --resource-group maverick-rg \
  --hostname flywithmaverick.com
```

### 2. DNS Configuration
```
# DNS Records needed:
CNAME: flywithmaverick.com → maverick-prod.azurewebsites.net
CNAME: www.flywithmaverick.com → maverick-prod.azurewebsites.net

# For domain verification:
TXT: asuid.flywithmaverick.com → [verification-id-from-azure]
```

## Environment Variables for Production

```bash
# Required environment variables
NODE_ENV=production
NEXTAUTH_URL=https://flywithmaverick.com
NEXTAUTH_SECRET=your-super-secure-secret-here
DATABASE_URL=postgresql://maverickadmin:SecurePassword123!@maverick-db.postgres.database.azure.com:5432/maverick
GITHUB_CLIENT_ID=your-github-app-id
GITHUB_CLIENT_SECRET=your-github-app-secret

# Azure-specific
AZURE_EMAIL_CONNECTION_STRING=your-azure-email-connection-string
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

## Post-Deployment Steps

### 1. Initialize Database
```bash
# SSH into the app or run via Azure Cloud Shell
az webapp ssh --name maverick-prod --resource-group maverick-rg

# Inside the container:
npx prisma db push
npx prisma db seed
```

### 2. Test Deployment
- Visit https://maverick-prod.azurewebsites.net
- Test user registration/login
- Verify project creation
- Test Claude Code integration
- Check all major features

### 3. Configure Custom Domain
- Add flywithmaverick.com in Azure Portal
- Update DNS records
- Enable SSL certificate
- Test https://flywithmaverick.com

## Monitoring & Scaling

### Application Insights
```bash
# Enable Application Insights
az monitor app-insights component create \
  --app maverick-insights \
  --location eastus \
  --resource-group maverick-rg \
  --application-type web

# Link to App Service
az webapp config appsettings set \
  --name maverick-prod \
  --resource-group maverick-rg \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=[instrumentation-key]
```

### Auto-scaling
```bash
# Configure auto-scaling rules
az monitor autoscale create \
  --resource-group maverick-rg \
  --resource maverick-plan \
  --resource-type Microsoft.Web/serverfarms \
  --name maverick-autoscale \
  --min-count 1 \
  --max-count 5 \
  --count 2
```

## Backup Strategy

### 1. Database Backups
Azure PostgreSQL includes automatic backups with point-in-time restore.

### 2. Application Backups
```bash
# Configure app backup
az webapp config backup create \
  --resource-group maverick-rg \
  --webapp-name maverick-prod \
  --backup-name maverick-backup \
  --container-url [storage-container-url]
```

## Cost Optimization

### Current Estimated Costs (Monthly)
- **App Service B1**: ~$13/month
- **PostgreSQL Basic**: ~$25/month  
- **Storage**: ~$5/month
- **Application Insights**: ~$5/month
- **Total**: ~$48/month

### Production Scaling
- **App Service S1**: ~$75/month (better performance)
- **PostgreSQL Standard**: ~$100/month (better performance)
- **Total Production**: ~$180/month

## Security Considerations

### 1. Managed Identity
```bash
# Enable managed identity
az webapp identity assign \
  --name maverick-prod \
  --resource-group maverick-rg
```

### 2. Key Vault Integration
```bash
# Create Key Vault
az keyvault create \
  --name maverick-vault \
  --resource-group maverick-rg \
  --location eastus

# Store secrets
az keyvault secret set \
  --vault-name maverick-vault \
  --name "NextAuthSecret" \
  --value "your-secret-here"
```

## Quick Start Commands

```bash
# 1. Login to Azure
az login

# 2. Deploy with Container Apps (FASTEST)
az containerapp up \
  --name maverick-prod \
  --resource-group maverick-rg \
  --location eastus \
  --environment maverick-env \
  --source . \
  --target-port 5001 \
  --ingress external

# 3. Get URL
az containerapp show \
  --name maverick-prod \
  --resource-group maverick-rg \
  --query properties.configuration.ingress.fqdn
```

This will get Maverick live on Azure in under 10 minutes!