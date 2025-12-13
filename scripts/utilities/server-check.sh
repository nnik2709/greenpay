#!/bin/bash

echo "==================================="
echo "Backend Server Diagnostic Check"
echo "==================================="
echo ""

echo "1. Checking .env file format:"
echo "----------------------------"
head -15 /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env
echo ""

echo "2. Testing Node.js can read .env:"
echo "--------------------------------"
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
node -e "require('dotenv').config(); console.log('DB_HOST:', process.env.DB_HOST); console.log('DB_USER:', process.env.DB_USER);"
echo ""

echo "3. PM2 Status:"
echo "-------------"
pm2 describe greenpay-api | grep -E "(status|restart time)"
echo ""

echo "4. Recent error logs:"
echo "--------------------"
pm2 logs greenpay-api --err --lines 5 --nostream
echo ""

echo "==================================="
echo "Run this script on the server"
echo "==================================="
