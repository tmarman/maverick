#!/usr/bin/env node

/**
 * App Service deployment using Static Web Apps working configuration
 * 
 * Key lessons from successful Static Web Apps build:
 * 1. Use Prisma 5.22.0 (not 6.13.0) 
 * 2. Clean npm install environment
 * 3. Standard build process without optimizations
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
  log('App Service deployment using working Static Web Apps config...');
  
  // Use clean environment like Static Web Apps
  log('Creating clean build environment...');
  
  // Create temporary package.json with working Prisma version
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Downgrade Prisma to the version that worked in Static Web Apps
  packageJson.dependencies['@prisma/client'] = '^5.22.0';
  packageJson.devDependencies['prisma'] = '^5.22.0';
  
  const deployDir = 'deploy-working';
  
  if (fs.existsSync(deployDir)) {
    run(`rm -rf ${deployDir}`);
  }
  run(`mkdir ${deployDir}`);
  
  // Copy source files
  const filesToCopy = [
    'src',
    'prisma', 
    'public',
    'next.config.js',
    'tailwind.config.js',
    'postcss.config.js',
    'tsconfig.json',
    'azure-startup.js',
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
  
  // Write working package.json with diagnostic info
  log(`Updated Prisma versions: @prisma/client@${packageJson.dependencies['@prisma/client']}, prisma@${packageJson.devDependencies['prisma']}`);
  fs.writeFileSync(`${deployDir}/package.json`, JSON.stringify(packageJson, null, 2));
  fs.writeFileSync(`${deployDir}/package-lock.json`, '{}'); // Empty lock file for fresh install
  
  // Add verbose .deployment config
  const deploymentConfig = `[config]
SCM_DO_BUILD_DURING_DEPLOYMENT=true
WEBSITE_NODE_DEFAULT_VERSION=22.17.0
SCM_COMMAND_IDLE_TIMEOUT=1800
ENABLE_ORYX_BUILD=true
SCM_BUILD_ARGS=--verbose
WEBSITE_RUN_FROM_PACKAGE=0`;
  fs.writeFileSync(`${deployDir}/.deployment`, deploymentConfig);
  log('✓ Added verbose build configuration');
  
  // Switch to SQL Server schema for Azure
  if (fs.existsSync('prisma/schema.sqlserver.prisma')) {
    log('Using SQL Server schema for Azure...');
    run(`cp prisma/schema.sqlserver.prisma "${deployDir}/prisma/schema.prisma"`);
  }
  
  // Setup Azure server
  run(`mv "${deployDir}/azure-startup.js" "${deployDir}/server.js"`);
  
  log('Package contents:');
  run(`ls -la ${deployDir}/`);
  
  log('Package.json Prisma versions:');
  run(`grep -A2 -B2 prisma ${deployDir}/package.json`);
  
  log('Deployment configuration:');
  run(`cat ${deployDir}/.deployment`);
  
  log('Package size for deployment:');
  run(`du -sh ${deployDir}/`);
  
  // Deploy to Azure - let Azure handle the build like Static Web Apps
  log('Deploying to App Service with verbose logging - Azure will build with working dependencies...');
  const originalDir = process.cwd();
  
  try {
    process.chdir(deployDir);
    
    log('=== STARTING DEPLOYMENT ===');
    log(`Deploying from: ${process.cwd()}`);
    log(`Files being deployed:`);
    run('find . -name "*.js" -o -name "*.json" -o -name "*.md" | head -20');
    
    // Use more verbose az command with timeout
    log('Running az webapp up with full verbosity...');
    run('az webapp up --name maverick --resource-group maverick_group --location centralus --runtime "NODE:22-lts" --verbose --debug', { timeout: 600000 });
    
    log('🚀 Deployment upload complete! Now checking build status...');
    
    // Check deployment status with multiple methods
    log('=== POST-DEPLOYMENT DIAGNOSTICS ===');
    
    const originalDir2 = process.cwd();
    process.chdir('..');
    
    // Check app status
    log('1. Checking app service status:');
    run('az webapp show --name maverick --resource-group maverick_group --query "state" -o tsv');
    
    // Get deployment logs
    log('2. Getting recent deployment logs:');
    run('timeout 45s az webapp log tail --name maverick --resource-group maverick_group || echo "Log tail completed"');
    
    // Check if app is responding
    log('3. Testing app response (with retries):');
    for (let i = 1; i <= 3; i++) {
      log(`   Attempt ${i}/3:`);
      run(`curl -I --connect-timeout 10 --max-time 30 https://maverick-fcendrb4gte0dnf5.centralus-01.azurewebsites.net/ || echo "Request ${i} failed"`);
      if (i < 3) run('sleep 15');
    }
    
    // Get deployment history
    log('4. Recent deployment history:');
    run('az webapp deployment list --name maverick --resource-group maverick_group --query "[0:3].{status:status,time:received_time,deployer:author}" -o table || echo "Could not get deployment history"');
    
    process.chdir(originalDir2);
    
    log('Check: https://maverick-fcendrb4gte0dnf5.centralus-01.azurewebsites.net');
    log('Kudu logs: https://maverick-fcendrb4gte0dnf5.scm.centralus-01.azurewebsites.net/');
    
  } finally {
    process.chdir(originalDir);
    
    // Clean up
    log('Cleaning up...');
    run(`rm -rf ${deployDir}`);
    
    log('✓ Deployment complete with Static Web Apps proven config');
  }
}

if (require.main === module) {
  main();
}