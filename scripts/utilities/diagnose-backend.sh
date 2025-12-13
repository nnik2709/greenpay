#!/bin/bash

# Diagnostic script to check backend deployment status

echo "🔍 Backend Deployment Diagnostics"
echo "=================================="
echo ""

BACKEND_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

echo "1️⃣ Checking backend directory..."
if [ -d "$BACKEND_DIR" ]; then
    echo "✅ Backend directory exists"
    ls -lh "$BACKEND_DIR" | grep -E "(server.js|package.json|.env)"
else
    echo "❌ Backend directory not found!"
    exit 1
fi
echo ""

echo "2️⃣ Checking routes folder..."
if [ -d "$BACKEND_DIR/routes" ]; then
    echo "✅ Routes folder exists"
    ls -lh "$BACKEND_DIR/routes/"
else
    echo "❌ Routes folder not found!"
    exit 1
fi
echo ""

echo "3️⃣ Checking individual-purchases.js table name..."
echo "Looking for correct table name (individual_purchases):"
grep -n "INSERT INTO" "$BACKEND_DIR/routes/individual-purchases.js" | head -3
echo ""
echo "Looking for wrong table name (IndividualPurchase):"
grep -n "IndividualPurchase" "$BACKEND_DIR/routes/individual-purchases.js" | head -3 || echo "None found (GOOD!)"
echo ""

echo "4️⃣ Checking file modification times..."
stat -c "%y %n" "$BACKEND_DIR/routes/individual-purchases.js" 2>/dev/null || stat -f "%Sm %N" "$BACKEND_DIR/routes/individual-purchases.js"
echo ""

echo "5️⃣ Checking PM2 process..."
pm2 describe greenpay-api 2>/dev/null || echo "⚠️  PM2 process not found"
echo ""

echo "6️⃣ Checking if PM2 is using correct directory..."
pm2 describe greenpay-api | grep -E "(script path|cwd)" || echo "Cannot determine PM2 directory"
echo ""

echo "7️⃣ Last 10 lines of error log..."
pm2 logs greenpay-api --err --lines 10 --nostream
echo ""

echo "=================================="
echo "Diagnosis complete!"
echo ""
echo "📋 Expected values:"
echo "  - Table name should be: individual_purchases (lowercase with underscore)"
echo "  - File should be recently modified (today's date)"
echo "  - PM2 should be running from: $BACKEND_DIR"
echo ""
