#!/bin/bash

# Deploy Login History Backend Files
# Run this script to upload backend files for login history feature

echo "Deploying Login History backend files..."
echo ""

# Upload login-events route
echo "1. Uploading login-events.js..."
scp backend/routes/login-events.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

# Upload updated auth.js with login event recording
echo "2. Uploading updated auth.js..."
scp backend/routes/auth.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

# Upload updated server.js with login-events route registration
echo "3. Uploading updated server.js..."
scp backend/server.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/

echo ""
echo "Files uploaded successfully!"
echo ""
echo "Now restarting PM2..."

# Restart PM2
ssh root@72.61.208.79 << 'EOF'
pm2 restart greenpay-api
echo ""
echo "Waiting for restart..."
sleep 3
echo ""
echo "PM2 Status:"
pm2 status greenpay-api
echo ""
echo "Recent logs:"
pm2 logs greenpay-api --lines 20 --nostream
EOF

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Test the endpoint:"
echo "curl -H 'Authorization: Bearer YOUR_TOKEN' https://greenpay.eywademo.cloud/api/login-events"
