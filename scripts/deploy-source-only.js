#!/usr/bin/env node

/**
 * Source-only deployment - let Azure handle npm install
 * 
 * This approach:
 * 1. Builds the app locally with SQL Server schema
 * 2. Sends only source files + .next build output
 * 3. Lets Azure run npm install during deployment via .deployment config
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
  log('Source-only deployment to Azure...');
  
  // Build the app locally with SQL Server schema
  log('Building locally with SQL Server schema...');
  run('npm ci');
  
  // Switch to SQL Server schema BEFORE build
  if (fs.existsSync('prisma/schema.sqlserver.prisma')) {
    log('Switching to SQL Server schema...');
    run('cp prisma/schema.sqlserver.prisma prisma/schema.prisma');
  }
  
  run('npx prisma generate');
  run('npm run build:production', { env: { ...process.env, NODE_ENV: 'production' } });
  
  // Create deployment package with source + build output (NO node_modules)
  const deployDir = 'deploy-source';
  log('Creating source deployment package...');
  
  if (fs.existsSync(deployDir)) {
    run(`rm -rf ${deployDir}`);
  }
  run(`mkdir ${deployDir}`);
  
  // Copy source files and build output
  const filesToCopy = [
    '.next',                // Built Next.js app
    'src',                 // Source code
    'prisma',              // Database schema
    'public',              // Static assets
    'package.json',        // Dependencies list
    'package-lock.json',   // Exact dependency versions
    '.deployment',         // Azure build config
    'azure-startup.js',    // Azure server
    'next.config.js',      // Next.js config
    'tailwind.config.js',  // Tailwind config
    'postcss.config.js',   // PostCSS config
    'tsconfig.json'        // TypeScript config
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
  
  // Rename server for Azure
  if (fs.existsSync(`${deployDir}/azure-startup.js`)) {
    run(`mv "${deployDir}/azure-startup.js" "${deployDir}/server.js"`);
    log('✓ Azure startup server configured');
  }
  
  // Show package size
  log('Deployment package contents:');
  run(`ls -la ${deployDir}/`);
  log('Package size:');
  run(`du -sh ${deployDir}/`);
  
  // Deploy to Azure - let Azure handle npm install
  log('Deploying source package - Azure will run npm install...');
  const originalDir = process.cwd();
  
  try {
    process.chdir(deployDir);
    run('az webapp up --name maverick --resource-group maverick_group --location centralus --runtime "NODE:22-lts"');
    
    log('🚀 Source deployment complete!');
    log('Azure is now running npm install and starting the app...');
    log('Check: https://maverick-fcendrb4gte0dnf5.centralus-01.azurewebsites.net');
    
  } finally {
    process.chdir(originalDir);
    
    // Clean up
    log('Cleaning up...');
    run(`rm -rf ${deployDir}`);
    
    // Restore local environment
    log('Restoring local PostgreSQL schema...');
    run('git checkout HEAD -- prisma/schema.prisma');
    run('npx prisma generate');
    log('✓ Local environment restored');
  }
}

if (require.main === module) {
  main();
}