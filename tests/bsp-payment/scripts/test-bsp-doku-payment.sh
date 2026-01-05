#!/bin/bash

# Test BSP DOKU Payment Session Creation
# This script tests the payment preparation endpoint and shows what's being sent to DOKU

echo "======================================"
echo "BSP DOKU Payment Session Test"
echo "======================================"
echo ""

# Test payment preparation
echo "1. Creating payment session..."
echo ""

RESPONSE=$(curl -s -X POST https://greenpay.eywademo.cloud/api/buy-online/prepare-payment \
  -H "Content-Type: application/json" \
  -d '{
    "passportData": {
      "passportNumber": "TEST123456",
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

# Extract form params if present
if echo "$RESPONSE" | jq -e '.data.metadata.formParams' > /dev/null 2>&1; then
  echo "======================================"
  echo "DOKU Form Parameters"
  echo "======================================"
  echo "$RESPONSE" | jq '.data.metadata.formParams'
  echo ""

  echo "======================================"
  echo "Key Parameters:"
  echo "======================================"
  echo "MALLID: $(echo "$RESPONSE" | jq -r '.data.metadata.formParams.MALLID')"
  echo "AMOUNT: $(echo "$RESPONSE" | jq -r '.data.metadata.formParams.AMOUNT')"
  echo "CURRENCY: $(echo "$RESPONSE" | jq -r '.data.metadata.formParams.CURRENCY')"
  echo "TRANSIDMERCHANT: $(echo "$RESPONSE" | jq -r '.data.metadata.formParams.TRANSIDMERCHANT')"
  echo "WORDS: $(echo "$RESPONSE" | jq -r '.data.metadata.formParams.WORDS')"
  echo "PAYMENTCHANNEL: $(echo "$RESPONSE" | jq -r '.data.metadata.formParams.PAYMENTCHANNEL')"
  echo ""
fi

echo "======================================"
echo "Server Logs (Last 50 lines with BSP DOKU):"
echo "======================================"
echo ""
echo "Run on server:"
echo "pm2 logs greenpay-api --lines 100 --nostream | grep -E 'BSP DOKU|Payment'"
