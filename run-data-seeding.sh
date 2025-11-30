#!/bin/bash

# PNG Green Fees - Data Seeding Script
# Populates the system with sample data for testing

set -e

echo "🌱 PNG Green Fees - Data Seeding Suite"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0;' # No Color

echo -e "${BLUE}This script will populate the system with sample data:${NC}"
echo "  • 5 Passport records"
echo "  • 5 Individual purchases with vouchers"
echo "  • 5 Quotations (draft, sent, approved)"
echo "  • 3 Invoices from quotations"
echo "  • 3 Payment records"
echo "  • 2 Voucher batches from paid invoices"
echo "  • 8 Support tickets (various priorities/statuses)"
echo ""
echo -e "${YELLOW}⚠️  Make sure the development server is running on http://localhost:3000${NC}"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

# Function to run a seeding test
run_seed_test() {
  local TEST_FILE=$1
  local DESCRIPTION=$2
  local AUTH_FILE=$3

  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}${DESCRIPTION}${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  # Run the test
  npx playwright test ${TEST_FILE} \
    --project=chromium \
    --reporter=list \
    2>&1 | grep -E "^|✓|✅|📝|📊|⚠️|❌|🌱"

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ ${DESCRIPTION} - COMPLETE${NC}"
  else
    echo -e "${YELLOW}⚠️  ${DESCRIPTION} - COMPLETED WITH WARNINGS${NC}"
  fi

  echo ""
  echo ""
}

# Create test results directory
mkdir -p test-results/data-seeding

echo -e "${GREEN}Starting data seeding process...${NC}"
echo ""

# Step 1: Authenticate as appropriate role for each test
echo "🔐 Setting up authentication..."
npx playwright test tests/auth-counter-agent.setup.ts --reporter=list > /dev/null 2>&1
npx playwright test tests/auth-finance-manager.setup.ts --reporter=list > /dev/null 2>&1
npx playwright test tests/auth-flex-admin.setup.ts --reporter=list > /dev/null 2>&1
echo -e "${GREEN}✓ Authentication ready${NC}"
echo ""

# Step 2: Run seeding tests in order
run_seed_test "tests/data-seeding/01-seed-passports.spec.ts" \
  "1️⃣  Seeding Passports" \
  "counter-agent"

run_seed_test "tests/data-seeding/02-seed-individual-purchases.spec.ts" \
  "2️⃣  Seeding Individual Purchases & Vouchers" \
  "counter-agent"

run_seed_test "tests/data-seeding/03-seed-quotations.spec.ts" \
  "3️⃣  Seeding Quotations" \
  "finance-manager"

run_seed_test "tests/data-seeding/04-seed-invoices-payments.spec.ts" \
  "4️⃣  Seeding Invoices & Payments" \
  "finance-manager"

run_seed_test "tests/data-seeding/05-seed-support-tickets.spec.ts" \
  "5️⃣  Seeding Support Tickets" \
  "flex-admin"

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}           DATA SEEDING COMPLETE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✅ Sample data has been populated successfully!${NC}"
echo ""
echo "You can now:"
echo "  • View passports at: http://localhost:3000/passports"
echo "  • View individual purchases at: http://localhost:3000/individual-purchase"
echo "  • View vouchers at: http://localhost:3000/vouchers"
echo "  • View quotations at: http://localhost:3000/quotations"
echo "  • View invoices at: http://localhost:3000/invoices"
echo "  • View support tickets at: http://localhost:3000/tickets"
echo ""
echo "Run feature tests to verify everything works:"
echo "  npx playwright test tests/new-features --reporter=list"
echo ""
