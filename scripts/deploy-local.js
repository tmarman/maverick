#!/usr/bin/env node

/**
 * Local deployment script for Maverick to Azure App Service
 * 
 * Prerequisites:
 * 1. Install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
 * 2. Login: az login
 * 3. Ensure you have access to the 'maverick' app service
 * 
 * Usage:
 *   npm run deploy:local
 *   or
 *   node scripts/deploy-local.js
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const APP_NAME = 'maverick';
const RESOURCE_GROUP = 'maverick_group';

function log(message) {
  console.log(`[DEPLOY] ${message}`);
}

function error(message) {
  console.error(`[ERROR] ${message}`);
  process.exit(1);
}

function runCommand(command, options = {}) {
  log(`Running: ${command}`);
  try {
    const result = execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf8',
      ...options 
    });
    return result;
  } catch (err) {
    error(`Command failed: ${command}\n${err.message}`);
  }
}

function checkPrerequisites() {
  log('Checking prerequisites...');
  
  // Check if Azure CLI is installed
  try {
    execSync('az --version', { stdio: 'ignore' });
  } catch (err) {
    error('Azure CLI is not installed. Please install it: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli');
  }
  
  // Check if logged in to Azure
  try {
    execSync('az account show', { stdio: 'ignore' });
  } catch (err) {
    error('Not logged in to Azure. Please run: az login');
  }
  
  // Check if app service exists
  try {
    execSync(`az webapp show --name ${APP_NAME} --resource-group ${RESOURCE_GROUP}`, { stdio: 'ignore' });
    log(`✓ Azure App Service '${APP_NAME}' found`);
  } catch (err) {
    error(`Azure App Service '${APP_NAME}' not found in resource group '${RESOURCE_GROUP}'`);
  }
  
  log('✓ All prerequisites met');
}

function buildApplication() {
  log('Building application...');
  
  // Install dependencies
  runCommand('npm ci');
  
  // Run tests
  runCommand('npm test');
  
  // Generate Prisma client
  runCommand('npx prisma generate');
  
  // Build application
  runCommand('npm run build', { env: { ...process.env, NODE_ENV: 'production' } });
  
  // Verify build output
  if (!fs.existsSync('.next')) {
    error('Build failed: .next directory not found');
  }
  
  log('✓ Application built successfully');
}

function optimizeForDeployment() {
  log('Optimizing for deployment...');
  
  const beforeSize = execSync('du -sh node_modules/', { encoding: 'utf8' }).trim();
  log(`Before optimization: ${beforeSize}`);
  
  // Remove dev dependencies
  runCommand('npm prune --production');
  
  // Remove large dev-only packages that may remain
  const devPackages = [
    'node_modules/@types',
    'node_modules/typescript',
    'node_modules/eslint*',
    'node_modules/@typescript-eslint',
    'node_modules/jest*',
    'node_modules/@testing-library',
    'node_modules/babel-jest'
  ];
  
  devPackages.forEach(pkg => {
    try {
      if (fs.existsSync(pkg)) {
        runCommand(`rm -rf ${pkg}`);
      }
    } catch (err) {
      // Ignore errors for packages that don't exist
    }
  });
  
  const afterSize = execSync('du -sh node_modules/', { encoding: 'utf8' }).trim();
  log(`After optimization: ${afterSize}`);
  
  // Verify .next directory still exists
  if (!fs.existsSync('.next')) {
    error('Optimization failed: .next directory was removed');
  }
  
  const totalSize = execSync('du -sh .', { encoding: 'utf8' }).trim();
  log(`Total deployment size: ${totalSize}`);
  
  log('✓ Optimization complete');
}

function deployToAzure() {
  log('Deploying to Azure...');
  
  // Create deployment package (zip current directory)
  const zipFile = 'deployment.zip';
  
  // Remove old zip if exists
  if (fs.existsSync(zipFile)) {
    fs.unlinkSync(zipFile);
  }
  
  // Create zip excluding unnecessary files
  const excludePatterns = [
    '--exclude=.git/*',
    '--exclude=.github/*',
    '--exclude=node_modules/.cache/*',
    '--exclude=*.log',
    '--exclude=.DS_Store',
    '--exclude=.env.local',
    '--exclude=tmp/*',
    '--exclude=test-worktrees/*',
    '--exclude=feature-branch/*'
  ].join(' ');
  
  runCommand(`zip -r ${zipFile} . ${excludePatterns}`);
  
  log(`Created deployment package: ${zipFile}`);
  
  // Deploy using Azure CLI
  log('Starting Azure deployment...');
  runCommand(`az webapp deploy --name ${APP_NAME} --resource-group ${RESOURCE_GROUP} --src-path ${zipFile} --type zip`);
  
  // Clean up
  fs.unlinkSync(zipFile);
  
  log('✓ Deployment complete!');
  log(`App URL: https://${APP_NAME}.azurewebsites.net`);
}

function main() {
  log('Starting local deployment to Azure...');
  
  try {
    checkPrerequisites();
    buildApplication();
    optimizeForDeployment();
    deployToAzure();
    
    log('🚀 Deployment successful!');
  } catch (err) {
    error(`Deployment failed: ${err.message}`);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('Deployment interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  log('Deployment terminated');
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = { main };