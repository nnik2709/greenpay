#!/bin/bash

# Run database migrations as the greenpay user with proper permissions
# This script connects as the greenpay user which should have ownership

echo "=========================================="
echo "Running Database Migrations for Batch Purchase"
echo "=========================================="
echo ""

# Database connection details
DB_HOST="165.22.52.100"
DB_USER="greenpay"
DB_NAME="greenpay"
DB_PASSWORD="GreenPay2025!Secure#PG"

echo "Step 1: Adding batch_id column to individual_purchases table..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f database/migrations/add-batch-tracking.sql

if [ $? -eq 0 ]; then
    echo "✓ Batch tracking migration completed successfully"
else
    echo "✗ Batch tracking migration failed"
    exit 1
fi

echo ""
echo "Step 2: Fixing passport composite unique constraint..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f database/migrations/fix-passport-composite-key.sql

if [ $? -eq 0 ]; then
    echo "✓ Passport constraint migration completed successfully"
else
    echo "✗ Passport constraint migration failed"
    exit 1
fi

echo ""
echo "=========================================="
echo "✓ ALL MIGRATIONS COMPLETED SUCCESSFULLY"
echo "=========================================="
echo ""
echo "Verification - Checking new database structure:"
echo ""

# Verify batch_id column was added
echo "Checking individual_purchases table for batch_id column:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "\d individual_purchases" | grep batch_id

echo ""
echo "Checking passports table constraints:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "\d passports" | grep UNIQUE

echo ""
echo "=========================================="
echo "Next Steps:"
echo "1. Deploy backend: backend/routes/individual-purchases.js"
echo "2. Deploy frontend: dist/ folder"
echo "3. Restart services: pm2 restart greenpay-api && pm2 restart png-green-fees"
echo "=========================================="
