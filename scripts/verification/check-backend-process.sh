#!/bin/bash

echo "Checking which PM2 processes are running..."
echo ""

ssh root@165.22.52.100 "pm2 list"
echo ""

echo "Checking for greenpay backend processes..."
ssh root@165.22.52.100 "pm2 list | grep -i greenpay"
echo ""

echo "Which process handled the PDF request?"
echo "Last PDF request was to: /api/buy-online/voucher/.../pdf"
echo ""

echo "Checking greenpay-api logs for our debug messages..."
ssh root@165.22.52.100 "pm2 logs greenpay-api --lines 50 --nostream | grep -i '🔍\|logo\|emblem'"
echo ""

echo "Checking greenpay-backend logs for our debug messages..."
ssh root@165.22.52.100 "pm2 logs greenpay-backend --lines 50 --nostream | grep -i '🔍\|logo\|emblem'"
echo ""

echo "Checking greenpay logs for our debug messages..."
ssh root@165.22.52.100 "pm2 logs greenpay --lines 50 --nostream | grep -i '🔍\|logo\|emblem'"
