#!/usr/bin/env node

/**
 * Simple deployment script for immediate testing
 * 
 * Prerequisites:
 * 1. Install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
 * 2. Login: az login
 * 
 * This script does the minimum viable deployment to test quickly
 */

const { execSync } = require('child_process');
const fs = require('fs');

function log(message) {
  console.log(`[DEPLOY] ${message}`);
}

function error(message) {
  console.error(`[ERROR] ${message}`);
  process.exit(1);
}

function run(command, options = {}) {
  log(`Running: ${command}`);
  try {
    return execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf8',
      ...options 
    });
  } catch (err) {
    error(`Command failed: ${command}\n${err.message}`);
  }
}

function main() {
  log('Quick deployment to Azure...');
  
  // Build the app (without standalone for Azure)
  log('Building...');
  run('npm ci'); // Ensure dependencies are installed
  
  // Switch to SQL Server schema for Azure deployment BEFORE generating client
  if (fs.existsSync('prisma/schema.sqlserver.prisma')) {
    log('Switching to SQL Server schema for Azure build...');
    run('cp prisma/schema.sqlserver.prisma prisma/schema.prisma');
  }
  
  run('npx prisma generate'); // Generate Prisma client with SQL Server schema
  run('npm run build:production', { env: { ...process.env, NODE_ENV: 'production' } }); // Use production build
  
  if (!fs.existsSync('.next')) {
    error('.next directory missing after build');
  }
  
  // Create clean deploy directory
  const deployDir = 'deploy';
  log('Creating clean deployment directory...');
  
  if (fs.existsSync(deployDir)) {
    run(`rm -rf ${deployDir}`);
  }
  run(`mkdir ${deployDir}`);
  
  // Copy only essential files for optimized deployment
  const filesToCopy = [
    '.next',
    'prisma',
    'public',
    'azure-startup.js',
    'package.json',
    'package-lock.json',
    '.deployment'
  ];
  
  filesToCopy.forEach(item => {
    if (fs.existsSync(item)) {
      log(`Copying ${item}...`);
      if (fs.statSync(item).isDirectory()) {
        run(`cp -r "${item}" "${deployDir}/"`);
      } else {
        run(`cp "${item}" "${deployDir}/"`);
      }
    }
  });
  
  // Install production dependencies in deploy directory for Azure runtime
  log('Installing production dependencies for Azure...');
  const currentDir = process.cwd();
  process.chdir(deployDir);
  run('npm ci --production --silent'); // Install only production dependencies
  process.chdir(currentDir);
  log('✓ Production dependencies installed');
  
  // SQL Server schema already switched during build
  log('✓ SQL Server schema already applied during build');
  
  // Rename azure-startup.js to server.js for Azure (optimized for production)
  if (fs.existsSync(`${deployDir}/azure-startup.js`)) {
    run(`mv "${deployDir}/azure-startup.js" "${deployDir}/server.js"`);
    log('✓ Azure startup server renamed to server.js for deployment');
  }
  
  // Create .deployment file in deploy directory (let Azure handle npm install)
  const deploymentConfig = `[config]
SCM_DO_BUILD_DURING_DEPLOYMENT=true
WEBSITE_NODE_DEFAULT_VERSION=22.17.0
SCM_COMMAND_IDLE_TIMEOUT=1800`;
  fs.writeFileSync(`${deployDir}/.deployment`, deploymentConfig);
  
  // Create web.config for Azure if it doesn't exist
  if (!fs.existsSync('web.config')) {
    const webConfig = `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server.js\\/debug[\\/]?" />
        </rule>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}"/>
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="server.js"/>
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="bin"/>
        </hiddenSegments>
      </requestFiltering>
    </security>
    <httpErrors existingResponse="PassThrough" />
    <iisnode watchedFiles="web.config;*.js"/>
  </system.webServer>
</configuration>`;
    fs.writeFileSync(`${deployDir}/web.config`, webConfig);
  } else {
    run(`cp web.config "${deployDir}/"`);
  }
  
  // Deploy from the clean directory
  log('Deploying from clean directory...');
  const originalDir = process.cwd();
  
  try {
    process.chdir(deployDir);
    run('az webapp up --name maverick --resource-group maverick_group --location centralus --runtime "NODE:22-lts"');
    
    log('🚀 Deployment complete!');
    log('Check: https://maverick.azurewebsites.net');
    
  } finally {
    process.chdir(originalDir);
    
    // Clean up deploy directory
    log('Cleaning up deployment directory...');
    run(`rm -rf ${deployDir}`);
    
    // Restore PostgreSQL schema for local development
    log('Restoring PostgreSQL schema for local development...');
    run('git checkout HEAD -- prisma/schema.prisma');
    run('npx prisma generate'); // Regenerate client with PostgreSQL schema
    log('✓ Local development environment restored');
  }
}

if (require.main === module) {
  main();
}