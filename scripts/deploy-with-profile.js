#!/usr/bin/env node

/**
 * Alternative deployment script using Azure publish profile
 * 
 * Prerequisites:
 * 1. Download publish profile from Azure portal:
 *    - Go to Azure portal -> App Services -> maverick
 *    - Click "Get publish profile" in overview page
 *    - Save as scripts/maverick.PublishSettings
 * 
 * Usage:
 *   npm run deploy:profile
 *   or
 *   node scripts/deploy-with-profile.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const AdmZip = require('adm-zip');

const PUBLISH_PROFILE_PATH = path.join(__dirname, 'maverick.PublishSettings');
const ZIP_FILE = 'deployment.zip';

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

function parsePublishProfile() {
  if (!fs.existsSync(PUBLISH_PROFILE_PATH)) {
    error(`Publish profile not found at: ${PUBLISH_PROFILE_PATH}
    
To get the publish profile:
1. Go to Azure portal (portal.azure.com)
2. Navigate to App Services -> maverick
3. Click "Get publish profile" in the overview page
4. Save the downloaded file as: ${PUBLISH_PROFILE_PATH}`);
  }
  
  const profileContent = fs.readFileSync(PUBLISH_PROFILE_PATH, 'utf8');
  
  // Parse the XML to extract deployment info
  const publishUrlMatch = profileContent.match(/publishUrl="([^"]+)"/);
  const userNameMatch = profileContent.match(/userName="([^"]+)"/);
  const passwordMatch = profileContent.match(/userPWD="([^"]+)"/);
  
  if (!publishUrlMatch || !userNameMatch || !passwordMatch) {
    error('Invalid publish profile format');
  }
  
  return {
    publishUrl: publishUrlMatch[1],
    userName: userNameMatch[1],
    password: passwordMatch[1]
  };
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

function createDeploymentPackage() {
  log('Creating deployment package...');
  
  const zip = new AdmZip();
  
  // Add necessary files and directories
  const filesToInclude = [
    { path: '.next', isDirectory: true },
    { path: 'node_modules', isDirectory: true },
    { path: 'prisma', isDirectory: true },
    { path: 'public', isDirectory: true },
    { path: 'server.js', isDirectory: false },
    { path: 'package.json', isDirectory: false },
    { path: 'web.config', isDirectory: false },
    { path: '.deployment', isDirectory: false }
  ];
  
  filesToInclude.forEach(item => {
    if (fs.existsSync(item.path)) {
      if (item.isDirectory) {
        zip.addLocalFolder(item.path, item.path);
      } else {
        zip.addLocalFile(item.path);
      }
    }
  });
  
  zip.writeZip(ZIP_FILE);
  log(`✓ Created deployment package: ${ZIP_FILE}`);
  
  const stats = fs.statSync(ZIP_FILE);
  log(`Package size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

function deployViaKudu(profile) {
  return new Promise((resolve, reject) => {
    log('Deploying via Kudu API...');
    
    const zipBuffer = fs.readFileSync(ZIP_FILE);
    const url = new URL(`https://${profile.publishUrl}/api/zipdeploy`);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/zip',
        'Content-Length': zipBuffer.length,
        'Authorization': 'Basic ' + Buffer.from(`${profile.userName}:${profile.password}`).toString('base64')
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 202) {
          log('✓ Deployment successful');
          resolve(data);
        } else {
          error(`Deployment failed with status ${res.statusCode}: ${data}`);
        }
      });
    });
    
    req.on('error', (err) => {
      error(`Deployment request failed: ${err.message}`);
    });
    
    req.write(zipBuffer);
    req.end();
  });
}

async function main() {
  log('Starting deployment with publish profile...');
  
  try {
    const profile = parsePublishProfile();
    log(`✓ Loaded publish profile for: ${profile.publishUrl.split('.')[0]}`);
    
    buildApplication();
    createDeploymentPackage();
    
    await deployViaKudu(profile);
    
    // Clean up
    if (fs.existsSync(ZIP_FILE)) {
      fs.unlinkSync(ZIP_FILE);
    }
    
    log('🚀 Deployment complete!');
    log('App URL: https://maverick.azurewebsites.net');
    
  } catch (err) {
    error(`Deployment failed: ${err.message}`);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('Deployment interrupted by user');
  if (fs.existsSync(ZIP_FILE)) {
    fs.unlinkSync(ZIP_FILE);
  }
  process.exit(1);
});

if (require.main === module) {
  main();
}