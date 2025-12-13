#!/bin/bash

echo "🔍 Verifying Phase 2 Deployment..."
echo ""

# Check if buy-online.js exists on server
echo "1. Checking if buy-online.js exists on server..."
ssh root@72.61.208.79 "ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js" 2>&1 | grep -q "buy-online.js"
if [ $? -eq 0 ]; then
    echo "   ✅ buy-online.js found"
else
    echo "   ❌ buy-online.js NOT FOUND"
fi

# Check if server.js has the route registration
echo ""
echo "2. Checking if server.js has buy-online route..."
ssh root@72.61.208.79 "grep -q 'buy-online' /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js"
if [ $? -eq 0 ]; then
    echo "   ✅ server.js has buy-online route"
    ssh root@72.61.208.79 "grep 'buy-online' /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js"
else
    echo "   ❌ server.js missing buy-online route"
fi

# Check PM2 status
echo ""
echo "3. Checking PM2 status..."
ssh root@72.61.208.79 "pm2 describe greenpay-api | grep -A 5 'status'"

# Check recent server restart time
echo ""
echo "4. Checking when server was last restarted..."
ssh root@72.61.208.79 "pm2 describe greenpay-api | grep 'uptime'"

echo ""
echo "5. Testing API endpoint..."
curl -s -X POST https://greenpay.eywademo.cloud/api/buy-online/prepare-payment \
  -H "Content-Type: application/json" \
  -d '{"test": true}' | head -c 200

echo ""
echo ""
echo "✅ Verification complete!"
