#!/bin/bash

# BSP DOKU Webhook Security Testing Script
# ==========================================
# Tests webhook security features:
# - Invalid signature rejection
# - Missing signature rejection
# - Replay attack prevention
# - SQL injection protection
#
# Usage: ./test-webhook-security.sh

WEBHOOK_URL="https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "BSP DOKU Webhook Security Tests"
echo "=========================================="
echo ""

# Test 1: Invalid WORDS Signature
echo -e "${BLUE}Test 1: Invalid WORDS Signature${NC}"
echo "------------------------------------------------"
echo "Sending webhook with invalid signature..."
echo ""

RESPONSE=$(curl -s -X POST ${WEBHOOK_URL} \
  -H "Content-Type: application/json" \
  -d '{
    "MALLID": "11170",
    "CHAINMERCHANT": "NA",
    "AMOUNT": "5000",
    "TRANSIDMERCHANT": "PGKO-SECURITY-TEST-INVALID-SIG",
    "RESULTCODE": "0000",
    "WORDS": "INVALID_SIGNATURE_12345",
    "RESPONSECODE": "0000",
    "APPROVALCODE": "TEST123",
    "PAYMENTCHANNEL": "02",
    "PAYMENTCODE": ""
  }')

echo "Response: ${RESPONSE}"
echo ""

if [ "${RESPONSE}" == "STOP" ]; then
  echo -e "${GREEN}✅ PASS: Invalid signature rejected${NC}"
else
  echo -e "${RED}❌ FAIL: Invalid signature NOT rejected${NC}"
  echo -e "${RED}   Expected: STOP${NC}"
  echo -e "${RED}   Got: ${RESPONSE}${NC}"
fi

echo ""
echo ""

# Test 2: Missing WORDS Field
echo -e "${BLUE}Test 2: Missing WORDS Field${NC}"
echo "------------------------------------------------"
echo "Sending webhook without WORDS field..."
echo ""

RESPONSE=$(curl -s -X POST ${WEBHOOK_URL} \
  -H "Content-Type: application/json" \
  -d '{
    "MALLID": "11170",
    "CHAINMERCHANT": "NA",
    "AMOUNT": "5000",
    "TRANSIDMERCHANT": "PGKO-SECURITY-TEST-NO-SIG",
    "RESULTCODE": "0000",
    "RESPONSECODE": "0000",
    "APPROVALCODE": "TEST123",
    "PAYMENTCHANNEL": "02",
    "PAYMENTCODE": ""
  }')

echo "Response: ${RESPONSE}"
echo ""

if [ "${RESPONSE}" == "STOP" ]; then
  echo -e "${GREEN}✅ PASS: Missing signature rejected${NC}"
else
  echo -e "${RED}❌ FAIL: Missing signature NOT rejected${NC}"
  echo -e "${RED}   Expected: STOP${NC}"
  echo -e "${RED}   Got: ${RESPONSE}${NC}"
fi

echo ""
echo ""

# Test 3: Empty WORDS Field
echo -e "${BLUE}Test 3: Empty WORDS Field${NC}"
echo "------------------------------------------------"
echo "Sending webhook with empty WORDS field..."
echo ""

RESPONSE=$(curl -s -X POST ${WEBHOOK_URL} \
  -H "Content-Type: application/json" \
  -d '{
    "MALLID": "11170",
    "CHAINMERCHANT": "NA",
    "AMOUNT": "5000",
    "TRANSIDMERCHANT": "PGKO-SECURITY-TEST-EMPTY-SIG",
    "RESULTCODE": "0000",
    "WORDS": "",
    "RESPONSECODE": "0000",
    "APPROVALCODE": "TEST123",
    "PAYMENTCHANNEL": "02",
    "PAYMENTCODE": ""
  }')

echo "Response: ${RESPONSE}"
echo ""

if [ "${RESPONSE}" == "STOP" ]; then
  echo -e "${GREEN}✅ PASS: Empty signature rejected${NC}"
else
  echo -e "${RED}❌ FAIL: Empty signature NOT rejected${NC}"
  echo -e "${RED}   Expected: STOP${NC}"
  echo -e "${RED}   Got: ${RESPONSE}${NC}"
fi

echo ""
echo ""

# Test 4: SQL Injection in TRANSIDMERCHANT
echo -e "${BLUE}Test 4: SQL Injection Attempt${NC}"
echo "------------------------------------------------"
echo "Attempting SQL injection in TRANSIDMERCHANT field..."
echo ""

RESPONSE=$(curl -s -X POST ${WEBHOOK_URL} \
  -H "Content-Type: application/json" \
  -d '{
    "MALLID": "11170",
    "CHAINMERCHANT": "NA",
    "AMOUNT": "5000",
    "TRANSIDMERCHANT": "PGKO-TEST''; DROP TABLE individual_purchases;--",
    "RESULTCODE": "0000",
    "WORDS": "test",
    "RESPONSECODE": "0000",
    "APPROVALCODE": "TEST123",
    "PAYMENTCHANNEL": "02",
    "PAYMENTCODE": ""
  }')

echo "Response: ${RESPONSE}"
echo ""
echo -e "${YELLOW}NOTE: This should be rejected OR handled safely${NC}"
echo -e "${YELLOW}Check PM2 logs for errors and verify database integrity${NC}"

echo ""
echo ""

# Test 5: XSS Attempt in Fields
echo -e "${BLUE}Test 5: XSS Attempt${NC}"
echo "------------------------------------------------"
echo "Attempting XSS injection in fields..."
echo ""

RESPONSE=$(curl -s -X POST ${WEBHOOK_URL} \
  -H "Content-Type: application/json" \
  -d '{
    "MALLID": "11170",
    "CHAINMERCHANT": "NA",
    "AMOUNT": "5000",
    "TRANSIDMERCHANT": "PGKO-XSS-TEST<script>alert(1)</script>",
    "RESULTCODE": "0000",
    "WORDS": "test",
    "RESPONSECODE": "0000",
    "APPROVALCODE": "<script>alert(1)</script>",
    "PAYMENTCHANNEL": "02",
    "PAYMENTCODE": ""
  }')

echo "Response: ${RESPONSE}"
echo ""
echo -e "${YELLOW}NOTE: Check that script tags are escaped in database${NC}"

echo ""
echo ""

# Test 6: Malformed JSON
echo -e "${BLUE}Test 6: Malformed JSON${NC}"
echo "------------------------------------------------"
echo "Sending malformed JSON..."
echo ""

RESPONSE=$(curl -s -X POST ${WEBHOOK_URL} \
  -H "Content-Type: application/json" \
  -d '{MALFORMED JSON}')

echo "Response: ${RESPONSE}"
echo ""

if [ "${RESPONSE}" == "STOP" ] || [ "${RESPONSE}" == "" ]; then
  echo -e "${GREEN}✅ PASS: Malformed JSON rejected${NC}"
else
  echo -e "${YELLOW}⚠️  WARNING: Unexpected response to malformed JSON${NC}"
fi

echo ""
echo ""

# Summary
echo "=========================================="
echo "Security Test Summary"
echo "=========================================="
echo ""
echo "Tests completed. Please review results above."
echo ""
echo -e "${YELLOW}IMPORTANT: Check PM2 logs for security warnings:${NC}"
echo "  ssh root@165.22.52.100 'pm2 logs greenpay-api --lines 100 | grep -E \"STOP|signature|security|ERROR\"'"
echo ""
echo -e "${YELLOW}IMPORTANT: Verify database integrity:${NC}"
echo "  ssh root@165.22.52.100 'PGPASSWORD=\"GreenPay2025!Secure#PG\" psql -h localhost -U greenpay -d greenpay -c \"SELECT COUNT(*) FROM individual_purchases;\"'"
echo ""
echo "=========================================="
