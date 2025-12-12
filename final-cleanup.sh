#!/bin/bash

echo "🧹 Final cleanup..."

# Remove duplicate folders from root (they're already in backend/)
rm -rf middleware
rm -rf migrations

# Clean up temp files
rm -f reorganize.sh fix-structure.sh

echo "✅ Cleanup complete!"
echo ""
echo "📁 Project structure:"
echo ""
echo "ROOT (Frontend - Vite/React):"
ls -d src public dist index.html package.json vite.config.js 2>/dev/null
echo ""
echo "BACKEND:"
ls -d backend/{config,routes,middleware,services,utils,migrations,server.js,package.json} 2>/dev/null
echo ""
echo "DEPLOYMENT SCRIPTS:"
ls deploy*.sh 2>/dev/null | head -5

