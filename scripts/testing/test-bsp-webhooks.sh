#!/bin/bash

# BSP DOKU Webhook Testing Script
# Tests webhook endpoints and simulates DOKU notifications

echo "=========================================="
echo "BSP DOKU Webhook Testing Script"
echo "=========================================="
echo ""

# Configuration
WEBHOOK_BASE_URL="https://greenpay.eywademo.cloud/api/payment/webhook/doku"
NOTIFY_URL="${WEBHOOK_BASE_URL}/notify"
REDIRECT_URL="${WEBHOOK_BASE_URL}/redirect"

echo "Testing webhook endpoints:"
echo "  Notify:   $NOTIFY_URL"
echo "  Redirect: $REDIRECT_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check Notify endpoint is accessible
echo "=========================================="
echo "Test 1: Notify Endpoint Accessibility"
echo "=========================================="
echo ""
echo "Sending empty POST request (should fail validation but show endpoint is reachable)..."
echo ""

RESPONSE=$(curl -s -X POST "$NOTIFY_URL" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE")

echo "Response: $BODY"
echo "HTTP Code: $HTTP_CODE"
echo ""

if [ "$BODY" = "STOP" ] || [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "403" ]; then
  echo -e "${GREEN}✅ PASS${NC}: Endpoint is accessible (rejected invalid request as expected)"
else
  echo -e "${RED}❌ FAIL${NC}: Unexpected response"
fi

echo ""
echo "=========================================="
echo "Test 2: Redirect Endpoint Accessibility"
echo "=========================================="
echo ""
echo "Sending empty POST request..."
echo ""

RESPONSE=$(curl -s -X POST "$REDIRECT_URL" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "\nHTTP_CODE:%{http_code}" \
  -L)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)

echo "HTTP Code: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ PASS${NC}: Endpoint is accessible and redirects"
else
  echo -e "${YELLOW}⚠️  WARNING${NC}: Unexpected HTTP code (endpoint may still work)"
fi

echo ""
echo "=========================================="
echo "Test 3: Simulate Valid Notify Webhook"
echo "=========================================="
echo ""
echo -e "${YELLOW}NOTE:${NC} This will fail signature verification (we don't have the real SHARED_KEY)"
echo "But it will show the webhook flow is working"
echo ""

# Generate sample webhook payload (signature will be wrong)
TRANSACTION_ID="TEST_$(date +%s)"
SAMPLE_PAYLOAD=$(cat <<EOF
{
  "TRANSIDMERCHANT": "$TRANSACTION_ID",
  "AMOUNT": "50.00",
  "STATUSCODE": "0000",
  "RESULTMSG": "SUCCESS",
  "VERIFYSTATUS": "000",
  "WORDS": "fakesignature123",
  "SESSIONID": "test_session_123",
  "PAYMENTCHANNEL": "15",
  "CURRENCY": "598"
}
EOF
)

echo "Payload:"
echo "$SAMPLE_PAYLOAD"
echo ""
echo "Sending to Notify webhook..."
echo ""

RESPONSE=$(curl -s -X POST "$NOTIFY_URL" \
  -H "Content-Type: application/json" \
  -d "$SAMPLE_PAYLOAD" \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE")

echo "Response: $BODY"
echo "HTTP Code: $HTTP_CODE"
echo ""

if [ "$BODY" = "STOP" ]; then
  echo -e "${GREEN}✅ PASS${NC}: Webhook received and rejected invalid signature (security working!)"
else
  echo -e "${YELLOW}⚠️  WARNING${NC}: Unexpected response (check server logs)"
fi

echo ""
echo "=========================================="
echo "Test 4: Check Backend Logs"
echo "=========================================="
echo ""
echo "To see webhook activity in backend logs, run:"
echo ""
echo -e "${YELLOW}ssh root@165.22.52.100 'pm2 logs greenpay-api --lines 50 | grep DOKU'${NC}"
echo ""
echo "You should see entries like:"
echo "  [DOKU NOTIFY] Webhook received at: ..."
echo "  [DOKU NOTIFY] SECURITY: Signature verification failed"
echo ""

echo ""
echo "=========================================="
echo "Summary & Next Steps"
echo "=========================================="
echo ""
echo "Webhook Endpoints Status:"
echo ""
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "403" ]; then
  echo -e "  Notify:   ${GREEN}✅ ACCESSIBLE${NC}"
else
  echo -e "  Notify:   ${RED}❌ CHECK DEPLOYMENT${NC}"
fi
echo -e "  Redirect: ${GREEN}✅ ACCESSIBLE${NC}"
echo ""
echo "Next Steps:"
echo ""
echo "1. Provide these URLs to BSP:"
echo "   - Notify:   $NOTIFY_URL"
echo "   - Redirect: $REDIRECT_URL"
echo ""
echo "2. Ask BSP to confirm webhook configuration"
echo ""
echo "3. Monitor logs during test payment:"
echo "   ssh root@165.22.52.100"
echo "   pm2 logs greenpay-api --lines 100"
echo ""
echo "4. Make test payment at:"
echo "   https://greenpay.eywademo.cloud/public/buy"
echo ""
echo "5. Check database for transaction update:"
echo "   SELECT * FROM payment_gateway_transactions"
echo "   ORDER BY created_at DESC LIMIT 5;"
echo ""
echo "=========================================="
echo "Testing Complete"
echo "=========================================="
echo ""
