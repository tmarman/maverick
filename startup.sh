#!/bin/bash

echo "=== Maverick Startup Script ==="
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

echo "=== Environment Variables ==="
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "NEXTAUTH_URL: $NEXTAUTH_URL"
echo "DATABASE_URL: ${DATABASE_URL:0:20}..." # Only show first 20 chars for security

echo "=== Checking for .next directory ==="
if [ ! -d ".next" ]; then
    echo "ERROR: .next directory not found!"
    echo "Contents of current directory:"
    ls -la
    
    echo "=== Installing dependencies first ==="
    # Azure deployment removes node_modules, so we need to reinstall
    npm install --production
    
    echo "=== Setting up build environment ==="
    export NODE_ENV=production
    export PATH="./node_modules/.bin:$PATH"
    echo "PATH: $PATH"
    echo "Checking for next binary:"
    which next || echo "next not found in PATH"
    ls -la ./node_modules/.bin/next 2>/dev/null || echo "next binary not found"
    
    echo "=== Running build ==="
    # Try npm run build first, then fallback to npx
    npm run build || npx next build
    if [ $? -ne 0 ]; then
        echo "ERROR: Build failed!"
        exit 1
    fi
    echo "SUCCESS: Build completed"
else
    echo "SUCCESS: .next directory found"
    ls -la .next/
fi

echo "=== Starting server ==="
export NODE_ENV=production
export PORT=${PORT:-8080}
node server.js