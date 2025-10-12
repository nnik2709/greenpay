#!/bin/bash

# PNG Green Fees System - UAT Test Runner Script
# This script automates the execution of UAT tests using Playwright

set -e

echo "🎯 PNG Green Fees System - Automated UAT Tests"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) is installed"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "npm $(npm --version) is installed"
}

# Navigate to playwright directory
navigate_to_playwright() {
    if [ ! -d "playwright" ]; then
        print_error "Playwright directory not found. Please run this script from the project root."
        exit 1
    fi
    
    cd playwright
    print_success "Navigated to playwright directory"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found in playwright directory"
        exit 1
    fi
    
    npm install
    print_success "Dependencies installed successfully"
}

# Install Playwright browsers
install_browsers() {
    print_status "Installing Playwright browsers..."
    npx playwright install
    print_success "Playwright browsers installed successfully"
}

# Check application accessibility
check_application() {
    print_status "Checking application accessibility..."
    
    if curl -s --head https://eywademo.cloud | head -n 1 | grep -q "200 OK"; then
        print_success "Application is accessible at https://eywademo.cloud"
    else
        print_error "Application is not accessible at https://eywademo.cloud"
        print_warning "Please ensure the application is running and accessible"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Run UAT tests
run_uat_tests() {
    print_status "Starting UAT test execution..."
    echo ""
    
    # Default to headless mode unless specified
    MODE=${1:-headless}
    
    case $MODE in
        "headed")
            print_status "Running tests in headed mode (browser visible)..."
            npm run test:uat-headed
            ;;
        "debug")
            print_status "Running tests in debug mode..."
            npm run test:uat-debug
            ;;
        "ui")
            print_status "Running tests in UI mode..."
            npm run test:ui
            ;;
        "mobile")
            print_status "Running mobile tests..."
            npm run test:mobile
            ;;
        "all-browsers")
            print_status "Running tests on all browsers..."
            npm run test:all-browsers
            ;;
        *)
            print_status "Running tests in headless mode..."
            npm run test:uat
            ;;
    esac
    
    print_success "UAT tests completed!"
}

# Show test results
show_results() {
    print_status "Test execution completed. Results:"
    echo ""
    
    if [ -f "test-results.json" ]; then
        print_success "JSON report generated: test-results.json"
    fi
    
    if [ -d "playwright-report" ]; then
        print_success "HTML report generated: playwright-report/"
        echo ""
        print_status "To view the HTML report, run:"
        echo "  npm run test:report"
        echo "  or open playwright-report/index.html in your browser"
    fi
    
    if [ -f "test-results.xml" ]; then
        print_success "JUnit report generated: test-results.xml"
    fi
}

# Main execution
main() {
    echo "🚀 Starting UAT Test Execution..."
    echo ""
    
    # Check prerequisites
    check_nodejs
    check_npm
    
    # Setup
    navigate_to_playwright
    install_dependencies
    install_browsers
    
    # Pre-test checks
    check_application
    
    echo ""
    print_status "All prerequisites met. Starting test execution..."
    echo ""
    
    # Run tests based on argument
    run_uat_tests "$1"
    
    # Show results
    show_results
    
    echo ""
    print_success "🎉 UAT test execution completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "  1. Review test reports for any failures"
    echo "  2. Address any issues found"
    echo "  3. Re-run tests if necessary"
    echo "  4. Proceed with production deployment"
    echo ""
}

# Show usage information
show_usage() {
    echo "Usage: $0 [MODE]"
    echo ""
    echo "Modes:"
    echo "  (default)    Run tests in headless mode"
    echo "  headed       Run tests with browser visible"
    echo "  debug        Run tests in debug mode"
    echo "  ui           Run tests in UI mode"
    echo "  mobile       Run mobile browser tests"
    echo "  all-browsers Run tests on all browsers"
    echo ""
    echo "Examples:"
    echo "  $0              # Run in headless mode"
    echo "  $0 headed       # Run with browser visible"
    echo "  $0 debug        # Run in debug mode"
    echo "  $0 all-browsers # Run on all browsers"
    echo ""
}

# Handle command line arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_usage
    exit 0
fi

# Run main function with first argument
main "$1"
