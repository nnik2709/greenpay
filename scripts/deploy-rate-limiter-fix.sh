#!/bin/bash

#
# DEPLOY RATE LIMITER FIX
# Reduces auth rate limit window from 15 minutes to 5 minutes
#

set -e

echo "================================================"
echo "   DEPLOYING RATE LIMITER FIX"
echo "================================================"
echo ""

SERVER="root@165.22.52.100"
BACKEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

echo "Step 1: Backing up current rateLimiter.js..."
ssh $SERVER "cd $BACKEND_PATH/middleware && cp rateLimiter.js rateLimiter.js.backup-\$(date +%Y%m%d-%H%M%S)"
echo "✓ Backup created"
echo ""

echo "Step 2: Uploading updated rateLimiter.js..."
scp backend/middleware/rateLimiter.js $SERVER:$BACKEND_PATH/middleware/
echo "✓ File uploaded"
echo ""

echo "Step 3: Verifying upload..."
ssh $SERVER "cd $BACKEND_PATH/middleware && grep '5 \* 60 \* 1000' rateLimiter.js"
if [ $? -eq 0 ]; then
  echo "✓ File verified - contains '5 * 60 * 1000'"
else
  echo "✗ ERROR: File upload failed or incorrect content"
  exit 1
fi
echo ""

echo "Step 4: Restarting backend..."
ssh $SERVER "pm2 restart greenpay-api"
sleep 2
echo "✓ Backend restarted"
echo ""

echo "Step 5: Checking PM2 status..."
ssh $SERVER "pm2 list | grep greenpay-api"
echo ""

echo "================================================"
echo "   DEPLOYMENT COMPLETE"
echo "================================================"
echo ""
echo "Auth rate limit window reduced: 15 minutes → 5 minutes"
echo "Users will now recover from rate limiting 3x faster"
echo ""
echo "Test: Try to trigger rate limit and verify error message says '5 minutes'"
echo ""
