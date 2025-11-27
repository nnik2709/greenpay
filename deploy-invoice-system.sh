#!/bin/bash

# Deploy Invoice System Database Migrations
# PNG GST-Compliant Invoice and Green Pass (Voucher) System

echo "==================================="
echo "Invoice System Migration Deployment"
echo "==================================="
echo ""

# Database credentials
DB_HOST="72.61.208.79"
DB_NAME="greenpay_db"
DB_USER="postgres"

echo "This will run 4 migration files:"
echo "1. Update quotations table for invoices"
echo "2. Create invoices table"
echo "3. Create invoice_payments table"
echo "4. Update vouchers tables for invoice linking"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "Running migrations..."
echo ""

# Migration 1: Update quotations
echo "→ Migration 1/4: Updating quotations table..."
ssh root@$DB_HOST "sudo -u postgres psql -d $DB_NAME" < migrations/01-update-quotations-for-invoices.sql
if [ $? -eq 0 ]; then
    echo "✓ Quotations table updated"
else
    echo "✗ Failed to update quotations table"
    exit 1
fi

echo ""

# Migration 2: Create invoices table
echo "→ Migration 2/4: Creating invoices table..."
ssh root@$DB_HOST "sudo -u postgres psql -d $DB_NAME" < migrations/02-create-invoices-table.sql
if [ $? -eq 0 ]; then
    echo "✓ Invoices table created"
else
    echo "✗ Failed to create invoices table"
    exit 1
fi

echo ""

# Migration 3: Create invoice_payments table
echo "→ Migration 3/4: Creating invoice_payments table..."
ssh root@$DB_HOST "sudo -u postgres psql -d $DB_NAME" < migrations/03-create-invoice-payments-table.sql
if [ $? -eq 0 ]; then
    echo "✓ Invoice payments table created"
else
    echo "✗ Failed to create invoice payments table"
    exit 1
fi

echo ""

# Migration 4: Update vouchers
echo "→ Migration 4/4: Updating vouchers tables..."
ssh root@$DB_HOST "sudo -u postgres psql -d $DB_NAME" < migrations/04-update-vouchers-for-invoices.sql
if [ $? -eq 0 ]; then
    echo "✓ Vouchers tables updated"
else
    echo "✗ Failed to update vouchers tables"
    exit 1
fi

echo ""
echo "==================================="
echo "✓ All migrations completed successfully!"
echo "==================================="
echo ""
echo "Database schema updated:"
echo "  • quotations table: Added TIN, GST fields, invoice linking"
echo "  • invoices table: Created with PNG GST compliance"
echo "  • invoice_payments table: Created with auto-update triggers"
echo "  • corporate_vouchers: Added invoice linking (Green Pass)"
echo ""
echo "Next steps:"
echo "1. Deploy backend API routes for invoices"
echo "2. Create frontend invoice management pages"
echo "3. Update quotations page with 'Convert to Invoice' button"
echo "4. Implement PDF generation for GST-compliant invoices"
echo ""
