#!/bin/bash

# Deploy buy-online.js fix to production
# This script fixes the database schema errors (p.sex, updated_at, date_of_birth)

set -e

echo "🚀 Deploying buy-online.js fix to production..."

# Server details
SERVER="eywasystems@72.61.208.79"
REMOTE_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes"
LOCAL_FILE="/Users/nikolay/github/greenpay/backend/routes/buy-online.js"

echo "📦 Copying fixed buy-online.js to server..."
scp -i ~/.ssh/nikolay "$LOCAL_FILE" "$SERVER:/tmp/buy-online.js"

echo "🔧 Installing file and restarting PM2..."
ssh -i ~/.ssh/nikolay "$SERVER" << 'ENDSSH'
  sudo -i << 'ENDROOT'
    # Backup current file
    cp /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js \
       /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js.backup-$(date +%Y%m%d-%H%M%S)

    # Move new file into place
    mv /tmp/buy-online.js /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js

    # Set correct ownership
    chown eywademo-greenpay:eywademo-greenpay /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js

    # Restart PM2
    pm2 restart greenpay-api

    echo "✅ Deployment complete!"
    echo ""
    echo "📊 PM2 Status:"
    pm2 list

    echo ""
    echo "📝 Checking logs for errors..."
    sleep 2
    pm2 logs greenpay-api --lines 20 --nostream
ENDROOT
ENDSSH

echo ""
echo "✅ Deployment script completed!"
echo ""
echo "🔍 FIXES APPLIED:"
echo "   - Removed p.sex column reference (line ~1008)"
echo "   - Removed updated_at column from passports UPDATE (line ~981)"
echo "   - Removed date_of_birth column from passports INSERT/UPDATE"
echo "   - Changed p.date_of_birth to p.expiry_date in voucher query"
echo ""
echo "🧪 Test by registering a passport to a voucher at:"
echo "   https://greenpay.eywademo.cloud/payment/success?session=..."
echo ""
