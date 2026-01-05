#!/bin/bash

# Corporate Voucher Registration Flow Test Runner
# This script runs the automated E2E test for the complete voucher flow

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎫 Corporate Voucher Registration Flow - Automated Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 This test will verify:"
echo "   1. Create corporate invoice"
echo "   2. Mark invoice as paid"
echo "   3. Generate vouchers (pending_passport status)"
echo "   4. Register passport to voucher"
echo "   5. Verify status change to active"
echo "   6. Verify PDF content changes"
echo ""
echo "🌐 Test Environment: https://greenpay.eywademo.cloud"
echo ""
echo "⏱️  Estimated time: 3-5 minutes"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Playwright is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js first."
    exit 1
fi

# Check if Playwright is installed
if ! npx playwright --version &> /dev/null; then
    echo "⚠️  Playwright not installed. Installing now..."
    npm install --save-dev @playwright/test
    npx playwright install chromium
fi

echo "🚀 Starting test in headed mode (you can see what's happening)..."
echo ""

# Run the test with custom config
npx playwright test \
  --config=playwright.config.corporate-voucher.ts \
  --headed \
  --project=chromium

# Check exit code
TEST_RESULT=$?

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $TEST_RESULT -eq 0 ]; then
    echo "✅ Test completed successfully!"
    echo ""
    echo "📊 View detailed report:"
    echo "   npx playwright show-report"
    echo ""
    echo "📸 Screenshots and videos saved in:"
    echo "   test-results/"
else
    echo "❌ Test failed or encountered errors"
    echo ""
    echo "🔍 Debugging tips:"
    echo "   1. Check screenshots in test-results/"
    echo "   2. View HTML report: npx playwright show-report"
    echo "   3. Check trace files for detailed step-by-step replay"
    echo ""
    echo "📝 Common issues:"
    echo "   - Login credentials incorrect"
    echo "   - Network timeout"
    echo "   - Page elements changed"
    echo "   - Voucher already exists/registered"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exit $TEST_RESULT
