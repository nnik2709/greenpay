#!/bin/bash

# Cleanup Test Data Script
# Removes old test artifacts, reports, and results to prepare for new testing

set -e

echo "🧹 Cleaning up test data and artifacts..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo ""
echo "📁 Project root: $PROJECT_ROOT"
echo ""

# Function to remove directory if it exists
cleanup_dir() {
    local dir="$1"
    local description="$2"
    
    if [ -d "$dir" ]; then
        size=$(du -sh "$dir" 2>/dev/null | cut -f1)
        echo -e "${YELLOW}Removing${NC} $description: $dir (${size})"
        rm -rf "$dir"
        echo -e "${GREEN}✅ Removed${NC} $description"
    else
        echo -e "${GREEN}✓${NC} $description not found (already clean)"
    fi
}

# Function to remove file if it exists
cleanup_file() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        size=$(du -h "$file" 2>/dev/null | cut -f1)
        echo -e "${YELLOW}Removing${NC} $description: $file (${size})"
        rm -f "$file"
        echo -e "${GREEN}✅ Removed${NC} $description"
    else
        echo -e "${GREEN}✓${NC} $description not found (already clean)"
    fi
}

# 1. Clean Playwright test results
echo ""
echo "📊 Cleaning Playwright test results..."
cleanup_dir "test-results" "Test results directory"
cleanup_dir "playwright-report" "Playwright HTML report"
cleanup_dir "playwright/.auth" "Playwright auth states"

# 2. Clean backend test results if they exist
if [ -d "backend/test-results" ]; then
    cleanup_dir "backend/test-results" "Backend test results"
fi

# 3. Clean reports directory
if [ -d "reports" ]; then
    echo ""
    echo "📄 Cleaning reports..."
    cleanup_dir "reports/html" "HTML reports"
    cleanup_file "reports/junit.xml" "JUnit XML report"
    cleanup_file "reports/results.json" "Test results JSON"
fi

# 4. Clean screenshot files (test screenshots)
echo ""
echo "📸 Cleaning test screenshots..."
find . -maxdepth 1 -name "*.png" -type f -name "*test*.png" -o -name "*debug*.png" -o -name "*verify*.png" 2>/dev/null | while read -r file; do
    if [ -f "$file" ]; then
        echo -e "${YELLOW}Removing${NC} test screenshot: $file"
        rm -f "$file"
        echo -e "${GREEN}✅ Removed${NC} test screenshot"
    fi
done

# 5. Clean Playwright cache (optional - uncomment if needed)
# echo ""
# echo "🗑️  Cleaning Playwright cache..."
# npx playwright install --force 2>/dev/null || true

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""
echo "Cleaned up:"
echo "  • Playwright test results"
echo "  • Playwright reports"
echo "  • Auth state files"
echo "  • Test screenshots"
echo ""
echo "You're ready to start a new round of testing!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

