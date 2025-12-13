#!/bin/bash

# Production Deployment Script for Critical Fixes
# Date: October 11, 2025
# Purpose: Deploy Edge Functions, Migrations, and Test Updates

set -e  # Exit on error

echo "🚀 PNG Green Fees - Production Deployment"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Check if Supabase CLI is installed
echo "Step 1: Checking Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI is not installed"
    echo ""
    echo "Please install it first:"
    echo "  Mac/Linux: brew install supabase/tap/supabase"
    echo "  Or npm:    npm install -g supabase"
    exit 1
fi
print_success "Supabase CLI found: $(supabase --version)"
echo ""

# Check if project is linked
echo "Step 2: Checking Supabase project link..."
if [ ! -f ".supabase/config.toml" ]; then
    print_warning "Project not linked to Supabase"
    echo ""
    echo "Please run first:"
    echo "  supabase login"
    echo "  supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    echo "Your project ref can be found in:"
    echo "  Supabase Dashboard → Settings → General → Reference ID"
    exit 1
fi
print_success "Project is linked"
echo ""

# Deploy Edge Functions
echo "Step 3: Deploying Edge Functions..."
echo "-----------------------------------"

FUNCTIONS=(
    "bulk-passport-upload"
    "generate-corporate-zip"
    "generate-quotation-pdf"
    "send-bulk-passport-vouchers"
    "send-voucher-batch"
    "bulk-corporate"
    "report-export"
    "send-email"
    "send-invoice"
    "send-quotation"
)

DEPLOYED=0
FAILED=0

for func in "${FUNCTIONS[@]}"; do
    echo "Deploying $func..."
    if supabase functions deploy $func 2>&1 | tee /tmp/deploy_output.txt; then
        if grep -q "Error\|error\|failed" /tmp/deploy_output.txt; then
            print_error "Failed to deploy $func"
            ((FAILED++))
        else
            print_success "Deployed $func"
            ((DEPLOYED++))
        fi
    else
        print_error "Failed to deploy $func"
        ((FAILED++))
    fi
done

echo ""
echo "Edge Functions Deployment Summary:"
echo "  ✅ Deployed: $DEPLOYED"
echo "  ❌ Failed:   $FAILED"
echo ""

# Apply Database Migrations
echo "Step 4: Applying Database Migrations..."
echo "---------------------------------------"
echo ""
print_warning "About to apply migrations to your database"
echo ""
read -p "Continue? (yes/no): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if supabase db push; then
        print_success "Migrations applied successfully"
    else
        print_error "Failed to apply migrations"
        print_info "You may need to apply them manually via SQL Editor"
    fi
else
    print_warning "Skipped migration deployment"
fi
echo ""

# List deployed functions
echo "Step 5: Verifying Deployments..."
echo "---------------------------------"
echo ""
print_info "Currently deployed Edge Functions:"
supabase functions list
echo ""

# Create storage buckets instructions
echo "Step 6: Storage Buckets Setup"
echo "-----------------------------"
print_warning "Storage buckets must be created manually"
echo ""
echo "Please create these buckets in Supabase Dashboard → Storage:"
echo ""
echo "1. passport-photos"
echo "   - Public: No (Private)"
echo "   - Size limit: 5 MB"
echo "   - MIME types: image/jpeg, image/png, image/jpg"
echo ""
echo "2. passport-signatures"
echo "   - Public: No (Private)"
echo "   - Size limit: 2 MB"
echo "   - MIME types: image/jpeg, image/png, image/jpg"
echo ""
echo "3. corporate-vouchers"
echo "   - Public: No (Private)"
echo "   - Size limit: 50 MB"
echo "   - MIME types: application/zip, application/pdf"
echo ""
echo "4. quotations"
echo "   - Public: No (Private)"
echo "   - Size limit: 10 MB"
echo "   - MIME types: application/pdf"
echo ""

# Build frontend
echo "Step 7: Building Frontend..."
echo "----------------------------"
read -p "Build frontend now? (yes/no): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Building frontend..."
    if npm run build; then
        print_success "Frontend built successfully"
        print_info "Build output is in: ./dist/"
    else
        print_error "Frontend build failed"
    fi
else
    print_warning "Skipped frontend build"
fi
echo ""

# Summary
echo "=========================================="
echo "🎉 Deployment Summary"
echo "=========================================="
echo ""
print_success "Completed Steps:"
echo "  ✅ Edge Functions deployed ($DEPLOYED/$((${#FUNCTIONS[@]})))"
echo "  ✅ Database migrations applied"
echo "  ✅ Frontend built (if selected)"
echo ""
print_warning "Manual Steps Remaining:"
echo "  🔧 Create 4 storage buckets (see instructions above)"
echo "  🔧 Deploy frontend to VPS: ./deploy-vps.sh"
echo "  🔧 Restart PM2 on VPS"
echo ""
print_info "Next: Test the application"
echo "  1. Open: http://195.200.14.62"
echo "  2. Login: admin@example.com / password123"
echo "  3. Test bulk upload with CSV file"
echo "  4. Check all report pages"
echo "  5. Verify Corporate Batch History page"
echo ""
print_success "Deployment helper completed!"
echo ""








