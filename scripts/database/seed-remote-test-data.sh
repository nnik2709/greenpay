#!/bin/bash

# Seed Test Data on Remote Server
# This script runs the SQL seeding script on the production database

echo "🌱 Seeding test data on production server..."
echo ""

# Server details
SERVER="root@72.61.208.79"

# Upload SQL script to server
echo "📤 Uploading SQL script to server..."
scp seed-test-data.sql $SERVER:/tmp/seed-test-data.sql

if [ $? -ne 0 ]; then
  echo "❌ Failed to upload SQL script"
  exit 1
fi

echo "✅ SQL script uploaded"
echo ""

# Run SQL script on server
echo "🗄️  Running SQL script on database..."
ssh $SERVER "cd /tmp && PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -f seed-test-data.sql"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Test data seeded successfully!"
  echo ""
  echo "🧪 You can now run tests:"
  echo "   npx playwright test tests/new-features"
else
  echo "❌ Failed to seed test data"
  exit 1
fi

# Cleanup
ssh $SERVER "rm /tmp/seed-test-data.sql"

echo ""
echo "✨ Done!"
