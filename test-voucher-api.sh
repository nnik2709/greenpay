#!/bin/bash

echo "Testing Voucher Validation API"
echo "==============================="
echo ""

# Test 1: Direct API call without auth (should get auth error)
echo "Test 1: Call without authentication"
curl -s "https://greenpay.eywademo.cloud/api/vouchers/validate/TEST-VOUCHER-123" | jq '.' || echo "No JSON response"
echo ""
echo ""

# Test 2: Check if route exists (should not get 404)
echo "Test 2: Check if route returns 404"
RESPONSE=$(curl -s -w "\n%{http_code}" "https://greenpay.eywademo.cloud/api/vouchers/validate/TEST-VOUCHER-123")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
echo "HTTP Status Code: $HTTP_CODE"
echo ""

# Test 3: Check database for test voucher
echo "Test 3: Check if TEST-VOUCHER-123 exists in database"
echo "Run on server: PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -c \"SELECT voucher_code, passport_number, valid_until, used_at FROM individual_purchases WHERE voucher_code = 'TEST-VOUCHER-123';\""
echo ""

echo "==============================="
echo "If HTTP code is 401/403: Auth is working, route exists"
echo "If HTTP code is 404: Route not registered"
echo "If HTTP code is 500: Backend error"
echo "==============================="
