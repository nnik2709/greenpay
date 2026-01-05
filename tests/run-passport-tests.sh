#!/bin/bash

# Passport-Voucher Integration Test Runner
# Runs the new passport integration tests

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   🧪 Passport-Voucher Integration Tests                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Playwright is installed
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx not found. Please install Node.js${NC}"
    exit 1
fi

# Base URL (default to production)
BASE_URL="${PLAYWRIGHT_BASE_URL:-https://greenpay.eywademo.cloud}"

echo -e "${BLUE}Testing against: ${BASE_URL}${NC}"
echo ""

# Test categories
echo "Available test suites:"
echo "  1. UI Tests (form behavior, validation, accessibility)"
echo "  2. API Tests (backend integration, data persistence)"
echo "  3. E2E Tests (complete workflows)"
echo "  4. All Tests (comprehensive)"
echo ""

# Parse command line argument
TEST_SUITE=${1:-all}

case $TEST_SUITE in
  ui)
    echo -e "${GREEN}Running UI Tests...${NC}"
    npx playwright test tests/passport-voucher-integration.spec.ts \
      --grep "@ui" \
      --reporter=list
    ;;

  api)
    echo -e "${GREEN}Running API Tests...${NC}"
    npx playwright test tests/passport-voucher-integration.spec.ts \
      tests/passport-voucher-e2e.spec.ts \
      --grep "API|Backend Integration|Contract" \
      --reporter=list
    ;;

  e2e)
    echo -e "${GREEN}Running E2E Tests...${NC}"
    npx playwright test tests/passport-voucher-e2e.spec.ts \
      --reporter=list
    ;;

  all|*)
    echo -e "${GREEN}Running All Passport-Voucher Tests...${NC}"
    echo ""

    # Run UI tests
    echo -e "${BLUE}━━━ Phase 1: UI Tests ━━━${NC}"
    npx playwright test tests/passport-voucher-integration.spec.ts \
      --reporter=list || {
      echo -e "${RED}UI tests failed!${NC}"
      exit 1
    }
    echo ""

    # Run E2E tests
    echo -e "${BLUE}━━━ Phase 2: E2E Tests ━━━${NC}"
    npx playwright test tests/passport-voucher-e2e.spec.ts \
      --reporter=list || {
      echo -e "${RED}E2E tests failed!${NC}"
      exit 1
    }
    echo ""
    ;;
esac

echo ""
echo -e "${GREEN}✅ All passport-voucher tests passed!${NC}"
echo ""

# Generate report
echo -e "${BLUE}Generating test report...${NC}"
npx playwright show-report --host 127.0.0.1 --port 9323 &
REPORT_PID=$!

echo ""
echo -e "${GREEN}Test report available at: http://127.0.0.1:9323${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the report server${NC}"
echo ""

# Wait for user to stop
wait $REPORT_PID
