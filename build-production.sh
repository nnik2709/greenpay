#!/bin/bash

# PNG Green Fees - Production Build Script
# This script builds the application for production deployment

set -e  # Exit on any error

echo "🚀 Starting production build process..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing all dependencies..."
npm install

echo "🔧 Building application..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Production build completed successfully!"
echo "📁 Build output: ./dist/"
echo "📊 Build size:"
du -sh dist/

echo ""
echo "🎯 Next steps:"
echo "1. Copy the dist/ folder to your VPS"
echo "2. Run the deployment script on your VPS"
echo "3. Configure your web server to serve the static files"
