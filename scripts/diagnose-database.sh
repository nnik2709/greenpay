#!/bin/bash

##############################################################################
# Database Diagnostic Script
# Detects PostgreSQL installation and configuration
##############################################################################

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   🔍 PNG Green Fees - Database Diagnostic                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

BACKEND_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

# 1. Check .env configuration
echo "1️⃣  Checking backend configuration..."
if [ -f "$BACKEND_DIR/.env" ]; then
  echo "   ✅ Found .env file"
  echo ""
  echo "   Database configuration from .env:"
  grep -E "^DB_HOST=|^DB_PORT=|^DB_NAME=|^DB_USER=" "$BACKEND_DIR/.env" | while read line; do
    echo "      $line"
  done
  echo ""

  DB_HOST=$(grep "^DB_HOST=" "$BACKEND_DIR/.env" | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
  DB_NAME=$(grep "^DB_NAME=" "$BACKEND_DIR/.env" | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)

  if [ "$DB_HOST" = "localhost" ] || [ -z "$DB_HOST" ]; then
    echo "   📍 Database is LOCAL (localhost)"
    DB_TYPE="local"
  else
    echo "   📍 Database is REMOTE ($DB_HOST)"
    DB_TYPE="remote"
  fi
else
  echo "   ❌ .env file not found"
  exit 1
fi

echo ""

# 2. Check PostgreSQL installation
echo "2️⃣  Checking PostgreSQL installation..."

if command -v psql &> /dev/null; then
  PSQL_VERSION=$(psql --version)
  echo "   ✅ psql client installed: $PSQL_VERSION"
else
  echo "   ❌ psql client NOT installed"
fi

if command -v pg_dump &> /dev/null; then
  PG_DUMP_VERSION=$(pg_dump --version)
  echo "   ✅ pg_dump installed: $PG_DUMP_VERSION"
else
  echo "   ❌ pg_dump NOT installed"
fi

echo ""

# 3. Check PostgreSQL service (if local)
if [ "$DB_TYPE" = "local" ]; then
  echo "3️⃣  Checking PostgreSQL service..."

  if systemctl list-units --type=service | grep -q postgresql; then
    echo "   ✅ PostgreSQL service found"

    if systemctl is-active --quiet postgresql; then
      echo "   ✅ PostgreSQL is RUNNING"
      PG_RUNNING=true
    else
      echo "   ⚠️  PostgreSQL is NOT running"
      echo "   💡 Try: sudo systemctl start postgresql"
      PG_RUNNING=false
    fi
  else
    echo "   ❌ PostgreSQL service NOT found"
    echo "   💡 PostgreSQL may not be installed"
    PG_RUNNING=false
  fi
else
  echo "3️⃣  Skipping service check (remote database)"
  PG_RUNNING=true
fi

echo ""

# 4. Check database connectivity
echo "4️⃣  Testing database connection..."

if [ -f "$BACKEND_DIR/.env" ]; then
  DB_HOST=$(grep "^DB_HOST=" "$BACKEND_DIR/.env" | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
  DB_PORT=$(grep "^DB_PORT=" "$BACKEND_DIR/.env" | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
  DB_NAME=$(grep "^DB_NAME=" "$BACKEND_DIR/.env" | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
  DB_USER=$(grep "^DB_USER=" "$BACKEND_DIR/.env" | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
  DB_PASSWORD=$(grep "^DB_PASSWORD=" "$BACKEND_DIR/.env" | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)

  DB_HOST="${DB_HOST:-localhost}"
  DB_PORT="${DB_PORT:-5432}"

  export PGPASSWORD="$DB_PASSWORD"

  if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &>/dev/null; then
    echo "   ✅ Database connection SUCCESSFUL"
    echo "   📊 Database info:"

    # Get table count
    TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
    echo "      Tables: $TABLE_COUNT"

    # Get some row counts
    PASSPORT_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c 'SELECT COUNT(*) FROM "Passport";' 2>/dev/null | xargs)
    USER_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c 'SELECT COUNT(*) FROM "User";' 2>/dev/null | xargs)

    if [ -n "$PASSPORT_COUNT" ]; then
      echo "      Passports: $PASSPORT_COUNT"
    fi
    if [ -n "$USER_COUNT" ]; then
      echo "      Users: $USER_COUNT"
    fi

    DB_CONNECTED=true
  else
    echo "   ❌ Database connection FAILED"
    echo "   💡 Check credentials in .env file"
    DB_CONNECTED=false
  fi

  unset PGPASSWORD
fi

echo ""
echo "══════════════════════════════════════════════════════════════"
echo "📋 Summary"
echo "══════════════════════════════════════════════════════════════"
echo ""

if [ "$DB_TYPE" = "local" ]; then
  echo "Database Type: LOCAL PostgreSQL"
  echo ""

  if [ "$PG_RUNNING" = true ] && [ "$DB_CONNECTED" = true ]; then
    echo "✅ Everything looks good!"
    echo ""
    echo "Next step: Run backup setup"
    echo "   sudo /tmp/setup-backups-supabase.sh"
  else
    echo "⚠️  Issues detected:"
    echo ""

    if [ "$PG_RUNNING" = false ]; then
      echo "   • PostgreSQL service not running"
      echo "     Fix: sudo systemctl start postgresql"
      echo "     Auto-start: sudo systemctl enable postgresql"
      echo ""
    fi

    if [ "$DB_CONNECTED" = false ]; then
      echo "   • Cannot connect to database"
      echo "     Check: $BACKEND_DIR/.env"
      echo "     Verify: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME"
      echo ""
    fi
  fi
else
  echo "Database Type: REMOTE PostgreSQL"
  echo "   Host: $DB_HOST"
  echo ""

  if [ "$DB_CONNECTED" = true ]; then
    echo "✅ Everything looks good!"
    echo ""
    echo "Next step: Run backup setup"
    echo "   sudo /tmp/setup-backups-supabase.sh"
  else
    echo "⚠️  Cannot connect to remote database"
    echo ""
    echo "   Check credentials in: $BACKEND_DIR/.env"
    echo "   Verify firewall/security groups allow connection"
    echo ""
  fi
fi

echo "══════════════════════════════════════════════════════════════"
