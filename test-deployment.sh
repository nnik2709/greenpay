#!/bin/bash

# PNG Green Fees - Deployment Testing Script
# Test the application on both local and remote environments

set -e  # Exit on any error

echo "🧪 PNG Green Fees - Deployment Testing"
echo "======================================"
echo ""

# Function to run tests
run_tests() {
    local environment=$1
    local url=$2
    local description=$3
    
    echo "🔍 Testing $description..."
    echo "   URL: $url"
    echo ""
    
    # Run Playwright tests
    if PLAYWRIGHT_BASE_URL=$url npm run test; then
        echo "✅ $description tests PASSED"
    else
        echo "❌ $description tests FAILED"
        return 1
    fi
    echo ""
}

# Check if we want to test locally
if [ "$1" = "local" ] || [ "$1" = "all" ]; then
    echo "🏠 Testing Local Development Environment"
    echo "======================================="
    
    # Check if dev server is running
    if curl -s http://localhost:3002 > /dev/null 2>&1; then
        run_tests "local" "http://localhost:3002" "Local Development"
    else
        echo "⚠️  Local development server not running on port 3002"
        echo "   Start it with: npm run dev"
        echo ""
    fi
fi

# Check if we want to test remote
if [ "$1" = "remote" ] || [ "$1" = "production" ] || [ "$1" = "all" ]; then
    echo "🌐 Testing Production Environment"
    echo "================================"
    
    # Check if remote server is accessible
    if curl -s https://eywademo.cloud > /dev/null 2>&1; then
        run_tests "remote" "https://eywademo.cloud" "Production (HTTPS)"
    else
        echo "⚠️  Production server not accessible at https://eywademo.cloud"
        echo "   Check if the application is deployed and running"
        echo ""
    fi
fi

# If no argument provided, show usage
if [ -z "$1" ]; then
    echo "Usage: $0 [local|remote|production|all]"
    echo ""
    echo "Options:"
    echo "  local      - Test local development environment (localhost:3002)"
    echo "  remote     - Test production environment (eywademo.cloud)"
    echo "  production - Same as remote"
    echo "  all        - Test both local and remote environments"
    echo ""
    echo "Examples:"
    echo "  $0 local      # Test only local development"
    echo "  $0 remote     # Test only production"
    echo "  $0 all        # Test both environments"
    exit 1
fi

echo "🎉 Testing completed!"
echo ""
echo "📊 Test Results Summary:"
echo "   - Check the output above for individual test results"
echo "   - View detailed HTML report: npm run test:report"
echo "   - Test artifacts saved in: test-results/ and playwright-report/"
