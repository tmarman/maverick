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
  
  // Build the app
  log('Building...');
  run('npm run build', { env: { ...process.env, NODE_ENV: 'production' } });
  
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
  
  // Copy essential files for standalone deployment
  const filesToCopy = [
    '.next/standalone',
    'prisma',
    'web.config',
    '.deployment'
  ];
  
  filesToCopy.forEach(item => {
    if (fs.existsSync(item)) {
      log(`Copying ${item}...`);
      if (item === '.next/standalone') {
        // Copy standalone contents to deploy root
        run(`cp -r "${item}"/* "${deployDir}/"`);
      } else if (fs.statSync(item).isDirectory()) {
        run(`cp -r "${item}" "${deployDir}/"`);
      } else {
        run(`cp "${item}" "${deployDir}/"`);
      }
    }
  });
  
  // Create .deployment file in deploy directory
  const deploymentConfig = `[config]
command = node server.js`;
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
  }
}

if (require.main === module) {
  main();
}