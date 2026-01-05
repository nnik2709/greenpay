#!/bin/bash

# BSP DOKU Payment Tests - Quick Run Script

echo "=========================================="
echo "BSP DOKU Payment Integration Tests"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if OTP is configured
if grep -q "testOtp: ''" tests/bsp-payment/test-cards.config.ts; then
  echo -e "${YELLOW}⚠️  WARNING: OTP test code not configured${NC}"
  echo "Please update TEST_CONFIG.otp.testOtp in test-cards.config.ts"
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Check if database password is set
if [ -z "$DB_PASSWORD" ]; then
  echo -e "${YELLOW}⚠️  WARNING: DB_PASSWORD not set${NC}"
  echo "Database verification tests may fail"
  echo "Set it with: export DB_PASSWORD='your-password'"
  echo ""
fi

echo -e "${BLUE}Test Cards Configured:${NC}"
echo "  ✅ Card 1: 4761349999000039 (Exp: 12/31)"
echo "  ✅ Card 2: 557381011111101 (Exp: 01/28)"
echo "  ✅ Card 3: BSP Visa Platinum (Exp: 04/27)"
echo "  ✅ Card 4: BSP Visa Silver (Exp: 04/27)"
echo ""

# Menu
echo "Select test suite to run:"
echo ""
echo "  1) All BSP Tests (39 tests, ~3-5 min)"
echo "  2) Payment Flow Tests Only (17 tests, ~2-3 min)"
echo "  3) Database Verification Tests Only (22 tests, ~1 min)"
echo "  4) Happy Path Tests Only (6 tests, ~1 min)"
echo "  5) Single Test - Success Payment (1 test, ~10 sec)"
echo "  6) Run with Browser Visible (headed mode)"
echo "  7) Run in Debug Mode (step through tests)"
echo ""
read -p "Enter choice (1-7): " choice

case $choice in
  1)
    echo -e "${GREEN}Running all BSP tests...${NC}"
    npx playwright test --config=playwright.config.bsp.ts
    ;;
  2)
    echo -e "${GREEN}Running payment flow tests...${NC}"
    npx playwright test --config=playwright.config.bsp.ts tests/bsp-payment/bsp-payment-flow.spec.ts
    ;;
  3)
    echo -e "${GREEN}Running database verification tests...${NC}"
    npx playwright test --config=playwright.config.bsp.ts tests/bsp-payment/bsp-database-verification.spec.ts
    ;;
  4)
    echo -e "${GREEN}Running happy path tests only...${NC}"
    npx playwright test --config=playwright.config.bsp.ts tests/bsp-payment/bsp-payment-flow.spec.ts -g "Happy Path"
    ;;
  5)
    echo -e "${GREEN}Running single success payment test...${NC}"
    npx playwright test --config=playwright.config.bsp.ts tests/bsp-payment/bsp-payment-flow.spec.ts -g "1.1"
    ;;
  6)
    echo -e "${GREEN}Running in headed mode (browser visible)...${NC}"
    npx playwright test --config=playwright.config.bsp.ts --headed
    ;;
  7)
    echo -e "${GREEN}Running in debug mode...${NC}"
    npx playwright test --config=playwright.config.bsp.ts --debug
    ;;
  *)
    echo -e "${RED}Invalid choice${NC}"
    exit 1
    ;;
esac

# Check exit code
if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}=========================================="
  echo "✅ Tests completed successfully!"
  echo "==========================================${NC}"
  echo ""
  echo "View HTML report with:"
  echo "  npx playwright show-report"
else
  echo ""
  echo -e "${RED}=========================================="
  echo "❌ Some tests failed"
  echo "==========================================${NC}"
  echo ""
  echo "View detailed report with:"
  echo "  npx playwright show-report"
  echo ""
  echo "Check backend logs:"
  echo "  pm2 logs greenpay-api"
fi
