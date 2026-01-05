#!/bin/bash

# Test BSP DOKU Payment with IDR Currency
# This script tests if the DOKU rejection is due to currency support issues

echo "======================================"
echo "BSP DOKU Payment Test - IDR Currency"
echo "======================================"
echo ""

echo "This test will:"
echo "1. Set BSP_DOKU_TEST_CURRENCY=360 (IDR) on the server"
echo "2. Restart the backend service"
echo "3. Test a payment transaction"
echo "4. Compare results with PGK (598) currency"
echo ""
echo "Purpose: Determine if DOKU rejection is due to:"
echo "  - Merchant credentials not activated (will fail with both)"
echo "  - PGK currency not supported in test mode (will succeed with IDR)"
echo ""

read -p "Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Test cancelled"
    exit 0
fi

SERVER="root@165.22.52.100"
APP_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

echo ""
echo "======================================"
echo "Step 1: Backup current .env"
echo "======================================"
ssh $SERVER "cd $APP_DIR && cp .env .env.backup-before-idr-test"
echo "✓ Backup created: .env.backup-before-idr-test"

echo ""
echo "======================================"
echo "Step 2: Add BSP_DOKU_TEST_CURRENCY=360"
echo "======================================"
ssh $SERVER << 'ENDSSH'
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Check if variable already exists
if grep -q "^BSP_DOKU_TEST_CURRENCY=" .env; then
    # Update existing
    sed -i 's/^BSP_DOKU_TEST_CURRENCY=.*/BSP_DOKU_TEST_CURRENCY=360/' .env
    echo "✓ Updated BSP_DOKU_TEST_CURRENCY=360"
else
    # Add new
    echo "" >> .env
    echo "# Currency Testing - IDR (Indonesian Rupiah)" >> .env
    echo "BSP_DOKU_TEST_CURRENCY=360" >> .env
    echo "✓ Added BSP_DOKU_TEST_CURRENCY=360"
fi

# Show BSP DOKU configuration
echo ""
echo "Current BSP DOKU Configuration:"
grep "^BSP_DOKU" .env | grep -v "SHARED_KEY"
ENDSSH

echo ""
echo "======================================"
echo "Step 3: Restart Backend Service"
echo "======================================"
ssh $SERVER "pm2 restart greenpay-api"
sleep 3
echo "✓ Service restarted"

echo ""
echo "======================================"
echo "Step 4: Verify Currency in Logs"
echo "======================================"
ssh $SERVER "pm2 logs greenpay-api --lines 30 --nostream | grep -E 'BSP DOKU|Currency|CURRENCY' || echo 'No currency logs yet'"

echo ""
echo "======================================"
echo "Step 5: Test Payment Creation"
echo "======================================"
echo ""
echo "Creating test payment with IDR currency..."
echo ""

RESPONSE=$(curl -s -X POST https://greenpay.eywademo.cloud/api/buy-online/prepare-payment \
  -H "Content-Type: application/json" \
  -d '{
    "passportData": {
      "passportNumber": "IDR123456",
      "surname": "TESTUSER",
      "givenName": "TEST",
      "dateOfBirth": "1990-01-01",
      "nationality": "PNG",
      "sex": "M"
    },
    "email": "test@example.com",
    "amount": 50.00,
    "verification": {
      "answer": 5,
      "expected": 5,
      "timeSpent": 10
    }
  }')

echo "Response:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract and display form params
if echo "$RESPONSE" | jq -e '.data.metadata.formParams' > /dev/null 2>&1; then
  echo "======================================"
  echo "DOKU Form Parameters (IDR Test)"
  echo "======================================"
  echo "CURRENCY: $(echo "$RESPONSE" | jq -r '.data.metadata.formParams.CURRENCY')"
  echo "AMOUNT: $(echo "$RESPONSE" | jq -r '.data.metadata.formParams.AMOUNT')"
  echo "WORDS: $(echo "$RESPONSE" | jq -r '.data.metadata.formParams.WORDS')"
  echo "TRANSIDMERCHANT: $(echo "$RESPONSE" | jq -r '.data.metadata.formParams.TRANSIDMERCHANT')"
  echo ""

  CURRENCY_CODE=$(echo "$RESPONSE" | jq -r '.data.metadata.formParams.CURRENCY')

  if [ "$CURRENCY_CODE" = "360" ]; then
    echo "✓ SUCCESS: Currency is set to 360 (IDR)"
    echo ""
    echo "======================================"
    echo "Next Steps:"
    echo "======================================"
    echo "1. Visit: https://greenpay.eywademo.cloud/buy-online"
    echo "2. Enter quantity and details"
    echo "3. Click 'Proceed to Payment'"
    echo "4. Check if DOKU accepts the payment"
    echo ""
    echo "If DOKU accepts IDR but rejects PGK:"
    echo "  → PGK (598) is not supported in test mode"
    echo "  → Contact BSP to enable PGK in test environment"
    echo ""
    echo "If DOKU still rejects IDR:"
    echo "  → Merchant credentials (Mall ID 11170) not activated"
    echo "  → Contact BSP to activate test credentials"
    echo ""
  else
    echo "✗ ERROR: Currency is still $CURRENCY_CODE (expected 360)"
    echo "The environment variable may not have taken effect"
    echo "Check server logs for issues"
  fi
else
  echo "✗ ERROR: No form parameters in response"
  echo "Payment session creation may have failed"
fi

echo ""
echo "======================================"
echo "Test Complete"
echo "======================================"
echo ""
echo "To restore PGK currency:"
echo "  ssh $SERVER 'cd $APP_DIR && sed -i \"s/^BSP_DOKU_TEST_CURRENCY=.*/BSP_DOKU_TEST_CURRENCY=598/\" .env && pm2 restart greenpay-api'"
echo ""
echo "To restore original .env:"
echo "  ssh $SERVER 'cd $APP_DIR && cp .env.backup-before-idr-test .env && pm2 restart greenpay-api'"
echo ""
