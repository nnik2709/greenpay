#!/bin/bash

echo "🚀 Deploying Phase 2: Buy Online with Updated Login Page"
echo "=============================================="
echo ""

# Step 1: Deploy frontend
echo "📦 1. Deploying frontend (dist/)..."
rsync -avz --delete dist/ root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/
if [ $? -eq 0 ]; then
    echo "   ✅ Frontend deployed successfully"
else
    echo "   ❌ Frontend deployment failed"
    exit 1
fi

echo ""

# Step 2: Deploy backend files
echo "📦 2. Deploying backend files..."

echo "   Uploading buy-online.js..."
scp backend/routes/buy-online.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

echo "   Uploading public-purchases.js..."
scp backend/routes/public-purchases.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

echo "   Uploading server.js..."
scp backend/server.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/

if [ $? -eq 0 ]; then
    echo "   ✅ Backend files deployed successfully"
else
    echo "   ❌ Backend deployment failed"
    exit 1
fi

echo ""

# Step 3: Verify database migration
echo "📊 3. Verifying database migration..."
ssh root@72.61.208.79 "sudo -u postgres psql -d greenpay -c \"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'purchase_sessions' AND column_name IN ('passport_data', 'passport_created');\"" > /tmp/db-check.txt

if grep -q "passport_data" /tmp/db-check.txt && grep -q "passport_created" /tmp/db-check.txt; then
    echo "   ✅ Database migration already applied"
else
    echo "   ⚠️  Database migration not found, applying now..."
    ssh root@72.61.208.79 "sudo -u postgres psql -d greenpay << 'EOF'
ALTER TABLE purchase_sessions ADD COLUMN IF NOT EXISTS passport_data JSONB;
CREATE INDEX IF NOT EXISTS idx_purchase_sessions_passport_data ON purchase_sessions USING GIN (passport_data);
ALTER TABLE purchase_sessions ADD COLUMN IF NOT EXISTS passport_created BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN purchase_sessions.passport_data IS 'Passport information stored before payment (JSONB): {passportNumber, surname, givenName, nationality, dateOfBirth, sex}';
COMMENT ON COLUMN purchase_sessions.passport_created IS 'Whether passport record was successfully created during webhook processing';
EOF
"
    if [ $? -eq 0 ]; then
        echo "   ✅ Database migration applied successfully"
    else
        echo "   ❌ Database migration failed"
        exit 1
    fi
fi

echo ""

# Step 4: Restart backend
echo "🔄 4. Restarting backend (PM2)..."
ssh root@72.61.208.79 "cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend && pm2 restart greenpay-api"

if [ $? -eq 0 ]; then
    echo "   ✅ Backend restarted successfully"
else
    echo "   ❌ Backend restart failed"
    exit 1
fi

echo ""

# Step 5: Wait for backend to start
echo "⏳ 5. Waiting for backend to start..."
sleep 3

# Step 6: Check PM2 status
echo "📊 6. Checking PM2 status..."
ssh root@72.61.208.79 "pm2 status greenpay-api"

echo ""

# Step 7: Test the endpoint
echo "🧪 7. Testing /api/buy-online/prepare-payment endpoint..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://greenpay.eywademo.cloud/api/buy-online/prepare-payment \
  -H "Content-Type: application/json" \
  -d '{"test": true}')

if [ "$RESPONSE" == "400" ] || [ "$RESPONSE" == "200" ]; then
    echo "   ✅ Endpoint is responding (HTTP $RESPONSE)"
elif [ "$RESPONSE" == "404" ]; then
    echo "   ❌ Endpoint not found (HTTP 404) - Route registration failed"
    echo "   🔍 Checking PM2 logs..."
    ssh root@72.61.208.79 "pm2 logs greenpay-api --lines 10 --nostream"
    exit 1
else
    echo "   ⚠️  Unexpected response: HTTP $RESPONSE"
fi

echo ""
echo "=============================================="
echo "✅ Phase 2 Deployment Complete!"
echo "=============================================="
echo ""
echo "📝 Next Steps:"
echo "1. Visit: https://greenpay.eywademo.cloud/login"
echo "2. Click: 'Continue to Purchase →'"
echo "3. Test the buy online flow with test data"
echo ""
echo "🔍 Monitor logs:"
echo "   ssh root@72.61.208.79 'pm2 logs greenpay-api'"
echo ""
