#!/bin/bash

# Setup Local Development Environment
# This script downloads necessary files from production server

SERVER="root@72.61.208.79"
REMOTE_BACKEND="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"
LOCAL_BACKEND="./backend"

echo "🔧 Setting up local development environment..."
echo ""

# Create directories
mkdir -p $LOCAL_BACKEND/routes
mkdir -p $LOCAL_BACKEND/middleware
mkdir -p $LOCAL_BACKEND/config

# Download missing route files
echo "📥 Downloading route files from server..."
scp $SERVER:$REMOTE_BACKEND/routes/auth.js $LOCAL_BACKEND/routes/ 2>/dev/null
scp $SERVER:$REMOTE_BACKEND/routes/users.js $LOCAL_BACKEND/routes/ 2>/dev/null
scp $SERVER:$REMOTE_BACKEND/routes/invoices.js $LOCAL_BACKEND/routes/ 2>/dev/null
scp $SERVER:$REMOTE_BACKEND/routes/quotations.js $LOCAL_BACKEND/routes/ 2>/dev/null
scp $SERVER:$REMOTE_BACKEND/routes/tickets.js $LOCAL_BACKEND/routes/ 2>/dev/null

# Download middleware
echo "📥 Downloading middleware from server..."
scp $SERVER:$REMOTE_BACKEND/middleware/auth.js $LOCAL_BACKEND/middleware/ 2>/dev/null

echo ""
echo "✅ Files downloaded!"
echo ""
echo "📦 Now install backend dependencies:"
echo "   cd backend"
echo "   npm install"
echo ""
echo "🚀 Start the backend server:"
echo "   npm run dev"
echo ""
echo "💻 In another terminal, start the frontend:"
echo "   npm run dev"
echo ""
