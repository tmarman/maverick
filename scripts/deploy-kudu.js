#!/usr/bin/env node

/**
 * Deployment using Kudu API with publish profile (no extra dependencies)
 * 
 * Prerequisites:
 * 1. Download publish profile from Azure portal and save as scripts/maverick.PublishSettings
 * 
 * Usage:
 *   npm run deploy:kudu
 *   or
 *   node scripts/deploy-kudu.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PUBLISH_PROFILE_PATH = path.join(__dirname, 'maverick.PublishSettings');
const ZIP_FILE = 'deployment.zip';

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

function parsePublishProfile() {
  if (!fs.existsSync(PUBLISH_PROFILE_PATH)) {
    error(`Publish profile not found: ${PUBLISH_PROFILE_PATH}
    
Download from Azure portal:
1. Go to portal.azure.com
2. Navigate to App Services -> maverick
3. Click "Get publish profile"
4. Save as: ${PUBLISH_PROFILE_PATH}`);
  }
  
  const content = fs.readFileSync(PUBLISH_PROFILE_PATH, 'utf8');
  
  // Parse the first publishProfile (usually the Web Deploy one)
  const publishUrlMatch = content.match(/publishUrl="([^"]+)"/);
  const userNameMatch = content.match(/userName="([^"]+)"/);
  const passwordMatch = content.match(/userPWD="([^"]+)"/);
  
  if (!publishUrlMatch || !userNameMatch || !passwordMatch) {
    error('Could not parse publish profile');
  }
  
  return {
    publishUrl: publishUrlMatch[1],
    userName: userNameMatch[1],
    password: passwordMatch[1]
  };
}

function buildApp() {
  log('Building application...');
  
  run('npm ci');
  run('npm test');
  run('npx prisma generate');
  run('npm run build', { env: { ...process.env, NODE_ENV: 'production' } });
  
  if (!fs.existsSync('.next')) {
    error('.next directory missing after build');
  }
  
  log('✓ Build complete');
}

function createZip() {
  log('Creating deployment package...');
  
  // Remove old zip
  if (fs.existsSync(ZIP_FILE)) {
    fs.unlinkSync(ZIP_FILE);
  }
  
  // Create zip with essential files
  const includes = [
    '.next',
    'node_modules',
    'prisma',
    'public',
    'server.js',
    'package.json',
    'web.config',
    '.deployment'
  ].filter(p => fs.existsSync(p)).join(' ');
  
  run(`zip -r ${ZIP_FILE} ${includes} -x "node_modules/@types/*" "node_modules/typescript/*" "node_modules/jest/*"`);
  
  const stats = fs.statSync(ZIP_FILE);
  log(`✓ Package created: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
}

function deployToKudu(profile) {
  return new Promise((resolve, reject) => {
    log('Deploying via Kudu...');
    
    const zipBuffer = fs.readFileSync(ZIP_FILE);
    const kuduUrl = `https://${profile.publishUrl}/api/zipdeploy`;
    const url = new URL(kuduUrl);
    
    const auth = Buffer.from(`${profile.userName}:${profile.password}`).toString('base64');
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/zip',
        'Content-Length': zipBuffer.length,
        'Authorization': `Basic ${auth}`
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          log('✓ Deployment successful');
          resolve();
        } else {
          error(`Deployment failed (${res.statusCode}): ${data}`);
        }
      });
    });
    
    req.on('error', err => error(`Request failed: ${err.message}`));
    req.write(zipBuffer);
    req.end();
  });
}

async function main() {
  try {
    const profile = parsePublishProfile();
    log(`Using publish profile for: ${profile.publishUrl}`);
    
    buildApp();
    createZip();
    await deployToKudu(profile);
    
    // Cleanup
    if (fs.existsSync(ZIP_FILE)) {
      fs.unlinkSync(ZIP_FILE);
    }
    
    log('🚀 Deployment complete!');
    log('Check: https://maverick.azurewebsites.net');
    
  } catch (err) {
    error(err.message);
  }
}

if (require.main === module) {
  main();
}