#!/bin/bash

# Deploy Revenue Report & Cash Reconciliation Fixes
# Created: December 15, 2025

set -e

SERVER="root@165.22.52.100"
PROJECT_DIR="/var/www/greenpay"

echo "🚀 Deploying Revenue Report & Cash Reconciliation Fixes..."
echo ""

# Step 1: Deploy Database Migration
echo "📊 Step 1: Deploying database migration..."
scp backend/migrations/create-cash-reconciliations-table.sql $SERVER:$PROJECT_DIR/backend/migrations/
ssh $SERVER "cd $PROJECT_DIR && PGPASSWORD='GreenPay2025!Secure#PG' psql -U greenpay_user -d greenpay_db -f backend/migrations/create-cash-reconciliations-table.sql"
echo "✅ Database migration complete"
echo ""

# Step 2: Deploy Backend Files
echo "📦 Step 2: Deploying backend files..."

# Backup existing server.js
ssh $SERVER "cd $PROJECT_DIR && cp backend/server.js backend/server.js.backup-\$(date +%Y%m%d-%H%M%S)"

# Upload new cash reconciliation route
scp backend/routes/cash-reconciliations.js $SERVER:$PROJECT_DIR/backend/routes/

# Upload updated server.js
scp backend/server.js $SERVER:$PROJECT_DIR/backend/

echo "✅ Backend files uploaded"
echo ""

# Step 3: Restart Backend
echo "🔄 Step 3: Restarting backend server..."
ssh $SERVER "cd $PROJECT_DIR && pm2 restart greenpay-backend"
sleep 3
ssh $SERVER "pm2 status greenpay-backend"
echo "✅ Backend restarted"
echo ""

# Step 4: Deploy Frontend
echo "🎨 Step 4: Deploying frontend build..."

# Backup existing dist
ssh $SERVER "cd $PROJECT_DIR && [ -d dist ] && mv dist dist.backup-\$(date +%Y%m%d-%H%M%S) || true"

# Upload new dist
rsync -avz --delete dist/ $SERVER:$PROJECT_DIR/dist/

echo "✅ Frontend deployed"
echo ""

# Step 5: Restart Frontend (if using PM2)
echo "🔄 Step 5: Restarting frontend server..."
ssh $SERVER "cd $PROJECT_DIR && pm2 restart greenpay-frontend || pm2 restart png-green-fees || echo 'Frontend PM2 process not found'"
echo "✅ Frontend restarted"
echo ""

# Step 6: Verify Deployment
echo "✅ Step 6: Verifying deployment..."
echo ""
echo "Backend logs (last 20 lines):"
ssh $SERVER "pm2 logs greenpay-backend --lines 20 --nostream"
echo ""
echo "PM2 Status:"
ssh $SERVER "pm2 status"
echo ""

echo "✅ Deployment Complete!"
echo ""
echo "📝 Changes Deployed:"
echo "  1. ✅ Fixed Revenue Report error (created_at.split undefined)"
echo "  2. ✅ Created Cash Reconciliation backend API"
echo "  3. ✅ Created cash_reconciliations database table"
echo "  4. ✅ Registered /api/cash-reconciliations route"
echo ""
echo "🧪 Testing:"
echo "  - Revenue Report: https://greenpay.eywademo.cloud/app/reports/revenue-generated"
echo "  - Cash Reconciliation: https://greenpay.eywademo.cloud/app/reports/cash-reconciliation"
echo ""
echo "📊 API Endpoints:"
echo "  - GET  /api/cash-reconciliations/transactions?date=YYYY-MM-DD&agent_id=ID"
echo "  - GET  /api/cash-reconciliations"
echo "  - POST /api/cash-reconciliations"
echo "  - PUT  /api/cash-reconciliations/:id"
echo ""
