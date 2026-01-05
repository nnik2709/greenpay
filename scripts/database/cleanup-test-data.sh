#!/bin/bash

# Database Test Data Cleanup Script
# This script cleans up test data from the database to prepare for a new testing round

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧹 Database Test Data Cleanup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLEANUP_SQL="$SCRIPT_DIR/cleanup-test-data.sql"

# Check if SQL file exists
if [ ! -f "$CLEANUP_SQL" ]; then
    echo -e "${RED}❌ Error: cleanup-test-data.sql not found at $CLEANUP_SQL${NC}"
    exit 1
fi

# Database connection settings (defaults, can be overridden via environment)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-greenpay_db}"
DB_USER="${DB_USER:-greenpay_user}"

# Check if password is set
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${YELLOW}⚠️  DB_PASSWORD not set. Using environment or .pgpass file.${NC}"
    echo ""
fi

echo -e "${BLUE}Database Connection:${NC}"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Confirm before proceeding
echo -e "${YELLOW}⚠️  This will delete test data from the database!${NC}"
echo -e "${YELLOW}The following will be cleaned:${NC}"
echo "  • Test passports (P1234567, P2345678, etc.)"
echo "  • Test individual purchase vouchers"
echo "  • Test corporate vouchers"
echo "  • Test invoices"
echo "  • Test quotations"
echo "  • Test bulk uploads"
echo "  • Test cash reconciliations"
echo "  • Old login events (keeping last 100)"
echo ""
echo -e "${YELLOW}Production data and test users will NOT be affected.${NC}"
echo ""

read -p "Continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${RED}Cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}Running cleanup SQL script...${NC}"
echo ""

# Run the SQL script
if [ -z "$DB_PASSWORD" ]; then
    # Use psql without password in command line (relies on .pgpass or environment)
    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -f "$CLEANUP_SQL"
else
    # Use password from environment
    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -f "$CLEANUP_SQL"
fi

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Database cleanup completed successfully!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}You can now start a new round of testing.${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ Cleanup failed with exit code: $EXIT_CODE${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    exit $EXIT_CODE
fi

