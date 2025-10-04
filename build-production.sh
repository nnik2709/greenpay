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

# Check if environment variables are provided
if [ -f ".env.production" ]; then
    echo "📝 Using .env.production file for build..."
    export $(cat .env.production | grep -v '^#' | xargs)
elif [ -n "$VITE_SUPABASE_URL" ] && [ -n "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "📝 Using environment variables for build..."
else
    echo "⚠️  No environment variables found!"
    echo "   Please create .env.production file or set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
    echo "   Example .env.production:"
    echo "   VITE_SUPABASE_URL=https://your-project-ref.supabase.co"
    echo "   VITE_SUPABASE_ANON_KEY=your_anon_key_here"
    echo ""
    echo "   Continuing with build using default values..."
fi

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
