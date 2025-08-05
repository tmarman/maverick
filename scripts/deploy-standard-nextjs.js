#!/usr/bin/env node

/**
 * Standard Next.js deployment to Azure (no custom server)
 * This will temporarily disable WebSocket features but get the app running
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
  log('Standard Next.js deployment to Azure (no custom server)...');
  
  // Build for standard Next.js
  log('Building with standard Next.js...');
  run('npm ci');
  
  // Switch to SQL Server schema
  if (fs.existsSync('prisma/schema.sqlserver.prisma')) {
    log('Switching to SQL Server schema...');
    run('cp prisma/schema.sqlserver.prisma prisma/schema.prisma');
  }
  
  run('npx prisma generate');
  run('npx next build');
  
  if (!fs.existsSync('.next')) {
    error('.next directory missing after build');
  }
  
  // Create deploy directory with standard Next.js structure
  const deployDir = 'deploy-standard';
  log('Creating standard deployment...');
  
  if (fs.existsSync(deployDir)) {
    run(`rm -rf ${deployDir}`);
  }
  run(`mkdir ${deployDir}`);
  
  // Copy for standard Next.js deployment
  const filesToCopy = [
    '.next',
    'node_modules', 
    'public',
    'package.json',
    'prisma'
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
  
  // Create package.json with standard start script
  const packageData = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  packageData.scripts.start = 'next start';
  fs.writeFileSync(`${deployDir}/package.json`, JSON.stringify(packageData, null, 2));
  
  // Create web.config for standard Next.js
  const webConfig = `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}"/>
        </rule>
        <rule name="NextJS">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="server.js"/>
        </rule>
      </rules>
    </rewrite>
    <iisnode watchedFiles="web.config;*.js"/>
  </system.webServer>
</configuration>`;
  
  fs.writeFileSync(`${deployDir}/web.config`, webConfig);
  
  // Create simple server.js for Azure
  const simpleServer = `const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.PORT || process.env.WEBSITES_PORT || 3000;

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(\`> Ready on http://localhost:\${port}\`);
  });
});`;
  
  fs.writeFileSync(`${deployDir}/server.js`, simpleServer);
  
  // Deploy
  log('Deploying standard Next.js app...');
  const originalDir = process.cwd();
  
  try {
    process.chdir(deployDir);
    run('az webapp up --name maverick --resource-group maverick_group --location centralus --runtime "NODE|22-lts"');
    
    log('🚀 Standard deployment complete!');
    log('Check: https://maverick.azurewebsites.net');
    log('⚠️  Note: WebSocket features (Claude Code) will be disabled');
    
  } finally {
    process.chdir(originalDir);
    
    // Cleanup
    log('Cleaning up...');
    run(`rm -rf ${deployDir}`);
    
    // Restore local schema
    run('git checkout HEAD -- prisma/schema.prisma');
    run('npx prisma generate');
  }
}

if (require.main === module) {
  main();
}