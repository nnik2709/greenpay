#!/bin/bash

# Deploy Customers Table Migration
# Creates the customers table in the PostgreSQL database

echo "📦 Deploying Customers Table"
echo "=============================="
echo ""

# Upload SQL migration file
echo "📤 Uploading customers table migration..."
scp backend/migrations/create-customers-table.sql root@72.61.208.79:/tmp/

if [ $? -ne 0 ]; then
    echo "❌ Upload failed"
    exit 1
fi

echo "✅ Migration file uploaded"
echo ""

# Execute migration on server
echo "🔧 Creating customers table in database..."
ssh root@72.61.208.79 "PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -f /tmp/create-customers-table.sql"

if [ $? -ne 0 ]; then
    echo "❌ Migration failed"
    exit 1
fi

echo "✅ Customers table created successfully"
echo ""

# Verify table creation
echo "🔍 Verifying table structure..."
ssh root@72.61.208.79 "PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -c '\\d customers'"

echo ""
echo "✅ Customers Table Deployment Complete!"
echo ""
echo "Table Structure:"
echo "  - id (SERIAL PRIMARY KEY)"
echo "  - name, company_name, email, phone"
echo "  - address_line1, address_line2, city, province, postal_code, country"
echo "  - tin, is_gst_registered, contact_person, notes"
echo "  - status (active/inactive)"
echo "  - created_by, created_at, updated_at"
echo ""
echo "Indexes created on: name, email, tin, status, created_at"
echo ""
