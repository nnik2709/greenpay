#!/bin/bash

echo "Testing Backend API Login"
echo "========================="
echo ""

# Test with agent credentials
curl -k -X POST https://greenpay.eywademo.cloud/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"agent@greenpay.com\",\"password\":\"test123\"}"

echo ""
echo ""
echo "If you see a token above, login works!"
echo "If you see an error, please share the output."
