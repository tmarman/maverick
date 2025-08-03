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
    echo "Running npm run build with environment variables..."
    export NODE_ENV=production
    npm run build
    if [ $? -ne 0 ]; then
        echo "ERROR: Build failed!"
        exit 1
    fi
else
    echo "SUCCESS: .next directory found"
    ls -la .next/
fi

echo "=== Starting server ==="
export NODE_ENV=production
export PORT=${PORT:-8080}
node server.js