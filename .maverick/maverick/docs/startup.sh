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

echo "=== Checking node_modules setup ==="
if [ -L "node_modules" ]; then
    echo "node_modules is a symlink pointing to: $(readlink node_modules)"
    ls -la /node_modules/.bin/next 2>/dev/null || echo "next not found in /node_modules/.bin/"
elif [ -d "node_modules" ]; then
    echo "node_modules directory exists from deployment package"
    echo "Checking for next binary:"
    ls -la ./node_modules/.bin/next 2>/dev/null || echo "next not found in ./node_modules/.bin/"
    if [ ! -f "./node_modules/.bin/next" ]; then
        echo "Next binary not found, attempting to install missing dependencies..."
        npm install --production --prefer-offline --no-audit --no-fund --timeout=300000 || echo "Install failed, continuing with available dependencies"
    fi
else
    echo "node_modules not found, installing dependencies..."
    npm install --production --prefer-offline --no-audit --no-fund --timeout=300000
fi

echo "=== Setting up production environment ==="
export NODE_ENV=production
# Check both possible paths for node_modules
if [ -d "/node_modules/.bin" ]; then
    export PATH="/node_modules/.bin:$PATH"
    echo "Using global node_modules: /node_modules/.bin"
else
    export PATH="./node_modules/.bin:$PATH" 
    echo "Using local node_modules: ./node_modules/.bin"
fi
echo "PATH: $PATH"

echo "=== Checking for .next directory ==="
if [ ! -d ".next" ]; then
    echo "ERROR: .next directory not found!"
    echo "Contents of current directory:"
    ls -la
    
    echo "Checking for next binary:"
    which next || echo "next not found in PATH"
    ls -la /node_modules/.bin/next 2>/dev/null || ls -la ./node_modules/.bin/next 2>/dev/null || echo "next binary not found in either location"
    
    echo "=== Running build ==="
    # Try different approaches to run the build
    if command -v next >/dev/null 2>&1; then
        echo "Running: next build"
        next build
    elif [ -f "/node_modules/.bin/next" ]; then
        echo "Running: /node_modules/.bin/next build"
        /node_modules/.bin/next build
    elif [ -f "./node_modules/.bin/next" ]; then
        echo "Running: ./node_modules/.bin/next build"
        ./node_modules/.bin/next build
    else
        echo "Running: npx next build"
        npx next build
    fi
    
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

# Check if next module is available for full server
if [ -f "./node_modules/.bin/next" ] || [ -f "/node_modules/.bin/next" ] || command -v next >/dev/null 2>&1; then
    echo "Next.js module available, using full server with WebSocket support"
    node server.js
else
    echo "Next.js module not available, using simplified production server"
    echo "Note: WebSocket features (Claude Code integration) will not be available"
    node server.production.js
fi