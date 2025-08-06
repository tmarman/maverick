#!/usr/bin/env node

/**
 * Next.js Standalone deployment for Azure App Service
 * 
 * Uses Next.js built-in standalone server (no custom server.js)
 * Based on Reddit/Microsoft guidance for Next.js on Azure
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
  log('Next.js Standalone deployment to Azure App Service...');
  
  // Build with standalone output locally
  log('Building Next.js with standalone output...');
  run('npm ci');
  
  // Switch to SQL Server schema for build
  if (fs.existsSync('prisma/schema.sqlserver.prisma')) {
    log('Switching to SQL Server schema...');
    run('cp prisma/schema.sqlserver.prisma prisma/schema.prisma');
    run('npx prisma generate');
  }
  
  run('npm run build');
  
  const deployDir = 'deploy-standalone';
  
  if (fs.existsSync(deployDir)) {
    run(`rm -rf ${deployDir}`);
  }
  run(`mkdir ${deployDir}`);
  
  // Copy standalone build output
  log('Copying Next.js standalone build...');
  
  if (!fs.existsSync('.next/standalone')) {
    error('Standalone build not found! Make sure next.config.js has output: "standalone"');
  }
  
  // Copy the standalone server and all its dependencies
  run(`cp -r .next/standalone/* ${deployDir}/`);
  
  // CRITICAL: Copy the entire .next directory structure for standalone
  log('Copying complete .next build directory...');
  run(`mkdir -p ${deployDir}/.next`);
  
  // Copy all .next contents to the deployment
  if (fs.existsSync('.next/static')) {
    run(`cp -r .next/static ${deployDir}/.next/`);
  }
  
  if (fs.existsSync('.next/server')) {
    run(`cp -r .next/server ${deployDir}/.next/`);
  }
  
  if (fs.existsSync('.next/BUILD_ID')) {
    run(`cp .next/BUILD_ID ${deployDir}/.next/`);
  }
  
  if (fs.existsSync('.next/prerender-manifest.json')) {
    run(`cp .next/prerender-manifest.json ${deployDir}/.next/`);
  }
  
  if (fs.existsSync('.next/routes-manifest.json')) {
    run(`cp .next/routes-manifest.json ${deployDir}/.next/`);
  }
  
  // Copy all other .next files that standalone might need
  run(`find .next -maxdepth 1 -type f -exec cp {} ${deployDir}/.next/ \\; || true`);
  
  // CRITICAL: Copy Prisma generated client for standalone
  log('Copying Prisma generated client...');
  if (fs.existsSync('node_modules/.prisma')) {
    run(`mkdir -p ${deployDir}/node_modules/.prisma`);
    run(`cp -r node_modules/.prisma/* ${deployDir}/node_modules/.prisma/`);
    log('✓ Prisma client copied');
  } else {
    log('⚠️ No .prisma directory found - running prisma generate...');
    run('npx prisma generate');
    run(`mkdir -p ${deployDir}/node_modules/.prisma`);
    run(`cp -r node_modules/.prisma/* ${deployDir}/node_modules/.prisma/`);
    log('✓ Prisma client generated and copied');
  }
  
  log('✓ Complete .next directory structure copied');
  
  // Copy public files
  if (fs.existsSync('public')) {
    run(`cp -r public ${deployDir}/`);
  }
  
  // Create Azure-specific startup configuration
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
  
  // Create package.json for Azure deployment
  const azurePackageJson = {
    name: "maverick-standalone",
    version: "1.0.0",
    scripts: {
      start: "node server.js"
    },
    dependencies: {
      // Standalone mode includes all dependencies in the server.js bundle
    }
  };
  
  fs.writeFileSync(`${deployDir}/package.json`, JSON.stringify(azurePackageJson, null, 2));
  
  // Create deployment config that doesn't try to run npm install
  const deploymentConfig = `[config]
SCM_DO_BUILD_DURING_DEPLOYMENT=false
WEBSITE_NODE_DEFAULT_VERSION=22.17.0
WEBSITE_RUN_FROM_PACKAGE=0`;
  
  fs.writeFileSync(`${deployDir}/.deployment`, deploymentConfig);
  
  log('Standalone deployment package contents:');
  run(`ls -la ${deployDir}/`);
  
  log('Checking .next directory structure:');
  run(`ls -la ${deployDir}/.next/ || echo "No .next directory found"`);
  
  log('Checking for BUILD_ID:');
  run(`cat ${deployDir}/.next/BUILD_ID || echo "No BUILD_ID found"`);
  
  log('Checking server.js content (first 10 lines):');
  run(`head -10 ${deployDir}/server.js`);
  
  log('Package size breakdown:');
  run(`du -sh ${deployDir}/`);
  run(`du -sh ${deployDir}/.next/ || echo "No .next dir"`);
  run(`du -sh ${deployDir}/node_modules/ || echo "No node_modules"`);
  
  log('Verifying Next.js production build files:');
  run(`find ${deployDir}/.next -name "BUILD_ID" -o -name "*.json" | head -10`);
  
  // Deploy to Azure
  log('Deploying standalone Next.js app to Azure...');
  const originalDir = process.cwd();
  
  try {
    process.chdir(deployDir);
    run('az webapp up --name maverick --resource-group maverick_group --location centralus --runtime "NODE:22-lts"');
    
    log('🚀 Standalone deployment complete!');
    log('Check: https://maverick-fcendrb4gte0dnf5.centralus-01.azurewebsites.net');
    
  } finally {
    process.chdir(originalDir);
    
    // Clean up and restore
    log('Cleaning up...');
    run(`rm -rf ${deployDir}`);
    
    log('Restoring local environment...');
    run('git checkout HEAD -- prisma/schema.prisma');
    run('npx prisma generate');
    log('✓ Local environment restored');
  }
}

if (require.main === module) {
  main();
}