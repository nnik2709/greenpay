#!/bin/bash

# Test Production Build Locally
echo "🧪 Testing PNG Green Fees Production Build..."

# Navigate to the latest deployment
LATEST_BUILD=$(ls -t deployments/png-green-fees-production-* | head -1)
BUILD_DIR=$(basename "$LATEST_BUILD" .tar.gz)

echo "📁 Testing build: $BUILD_DIR"

# Extract if needed
if [ ! -d "deployments/$BUILD_DIR" ]; then
    echo "📦 Extracting build package..."
    cd deployments
    tar -xzf "${BUILD_DIR}.tar.gz"
    cd ..
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd "deployments/$BUILD_DIR"
npm install

# Start the production server
echo "🚀 Starting production server..."
echo "📱 The application will be available at http://localhost:3000"
echo "⏹️  Press Ctrl+C to stop the server"
echo ""

# Start server
node server.js
