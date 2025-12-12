#!/bin/bash

echo "🔧 Reorganizing project structure..."

# Backend files to move
mkdir -p backend

# Move backend-specific folders
mv config backend/ 2>/dev/null
mv middleware backend/ 2>/dev/null
mv routes backend/ 2>/dev/null
mv services backend/ 2>/dev/null
mv utils backend/ 2>/dev/null
mv migrations backend/ 2>/dev/null

# Move backend files
mv server.js backend/ 2>/dev/null
mv test-email.js backend/ 2>/dev/null

# Move package.json and node_modules to backend
mv package.json backend/ 2>/dev/null
mv package-lock.json backend/ 2>/dev/null
mv node_modules backend/ 2>/dev/null

# Keep .env in root but create symlink in backend
if [ -f .env ]; then
  cp .env backend/.env
fi

echo "✅ Backend files moved to backend/"
echo ""
echo "📁 New structure:"
tree -L 2 -I 'node_modules|dist' .

