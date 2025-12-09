#!/bin/bash

##############################################################################
# Supabase Database Backup System for PNG Green Fees
#
# For remote Supabase PostgreSQL database
# Uses pg_dump with connection string
#
# Usage: sudo ./setup-backups-supabase.sh
##############################################################################

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   📦 PNG Green Fees - Supabase Backup System Setup        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
BACKUP_DIR="/var/backups/greenpay"
RETENTION_DAYS=30
LOG_FILE="/var/log/greenpay-backup.log"
BACKEND_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root (use sudo)"
  exit 1
fi

# Detect current user
ACTUAL_USER="${SUDO_USER:-$USER}"
echo "🔍 Running as: $ACTUAL_USER (sudo)"
echo ""

# Check if backend .env exists
if [ ! -f "$BACKEND_DIR/.env" ]; then
  echo "❌ Backend .env file not found at: $BACKEND_DIR/.env"
  exit 1
fi

# Extract database connection info
echo "🔍 Reading database configuration..."
DB_HOST=$(grep "^DB_HOST=" "$BACKEND_DIR/.env" | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
DB_PORT=$(grep "^DB_PORT=" "$BACKEND_DIR/.env" | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
DB_NAME=$(grep "^DB_NAME=" "$BACKEND_DIR/.env" | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
DB_USER=$(grep "^DB_USER=" "$BACKEND_DIR/.env" | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
DB_PASSWORD=$(grep "^DB_PASSWORD=" "$BACKEND_DIR/.env" | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)

# Set defaults if not found
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-greenpay}"

if [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
  echo "❌ Database credentials not found in .env"
  echo "   Please ensure DB_USER and DB_PASSWORD are set"
  exit 1
fi

echo "   Database: $DB_NAME"
echo "   Host: $DB_HOST:$DB_PORT"
echo "   User: $DB_USER"
echo ""

# Check if pg_dump is installed
if ! command -v pg_dump &> /dev/null; then
  echo "❌ pg_dump not found. Installing PostgreSQL client..."
  apt-get update -qq
  apt-get install -y postgresql-client
  echo "   ✅ PostgreSQL client installed"
  echo ""
fi

# Create backup directory
echo "📁 Creating backup directory..."
mkdir -p "$BACKUP_DIR"
chmod 755 "$BACKUP_DIR"
echo "   ✅ Created: $BACKUP_DIR"

# Create subdirectories
mkdir -p "$BACKUP_DIR/pre-deploy"
mkdir -p "$BACKUP_DIR/monthly"
chmod 755 "$BACKUP_DIR/pre-deploy" "$BACKUP_DIR/monthly"

# Create environment file for backup scripts (secure credentials)
echo ""
echo "🔐 Creating secure credentials file..."
cat > /root/.greenpay_backup_env <<ENV_FILE
# Greenpay Backup Credentials
# Auto-generated - DO NOT EDIT MANUALLY
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
ENV_FILE

chmod 600 /root/.greenpay_backup_env
chown root:root /root/.greenpay_backup_env
echo "   ✅ Created: /root/.greenpay_backup_env (secure)"

# Create backup script
echo ""
echo "📝 Creating backup script..."
cat > /usr/local/bin/greenpay-backup.sh <<'BACKUP_SCRIPT'
#!/bin/bash
##############################################################################
# Daily Backup Script for PNG Green Fees Database (Supabase)
##############################################################################

# Load credentials
source /root/.greenpay_backup_env

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE=$(date +%Y-%m-%d)
BACKUP_FILE="greenpay_backup_${TIMESTAMP}.sql.gz"
BACKUP_PATH="/var/backups/greenpay/${BACKUP_FILE}"
RETENTION_DAYS=30
LOG_FILE="/var/log/greenpay-backup.log"

# Set PostgreSQL password environment variable
export PGPASSWORD="$DB_PASSWORD"

# Log function
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "========================================="
log "🚀 Starting database backup..."
log "   Database: $DB_NAME"
log "   Host: $DB_HOST:$DB_PORT"
log "   File: $BACKUP_FILE"

# Create backup with compression
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl 2>/dev/null | gzip > "${BACKUP_PATH}"; then
  # Get backup size
  BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
  log "✅ Backup created successfully"
  log "   Size: $BACKUP_SIZE"
  log "   Location: ${BACKUP_PATH}"

  # Verify backup is not empty
  if [ -f "${BACKUP_PATH}" ]; then
    BACKUP_BYTES=$(stat -c%s "${BACKUP_PATH}" 2>/dev/null || stat -f%z "${BACKUP_PATH}" 2>/dev/null)
    if [ "$BACKUP_BYTES" -lt 1000 ]; then
      log "❌ ERROR: Backup file is too small (${BACKUP_BYTES} bytes)"
      exit 1
    fi
  fi

  # Monthly backup (first day of month)
  if [ "$(date +%d)" == "01" ]; then
    MONTHLY_BACKUP="/var/backups/greenpay/monthly/greenpay_monthly_$(date +%Y%m).sql.gz"
    cp "${BACKUP_PATH}" "$MONTHLY_BACKUP"
    log "📅 Monthly backup created: $(basename $MONTHLY_BACKUP)"
  fi

  # Clean old backups (keep last 30 days)
  log "🧹 Cleaning old backups (older than $RETENTION_DAYS days)..."
  DELETED_COUNT=$(find /var/backups/greenpay -maxdepth 1 -name "greenpay_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print 2>/dev/null | wc -l)
  if [ "$DELETED_COUNT" -gt 0 ]; then
    log "   Deleted $DELETED_COUNT old backup(s)"
  else
    log "   No old backups to delete"
  fi

  # Keep monthly backups for 12 months
  find /var/backups/greenpay/monthly -name "greenpay_monthly_*.sql.gz" -mtime +365 -delete 2>/dev/null

  # Log current backup status
  TOTAL_BACKUPS=$(find /var/backups/greenpay -maxdepth 1 -name "greenpay_backup_*.sql.gz" 2>/dev/null | wc -l)
  TOTAL_SIZE=$(du -sh /var/backups/greenpay 2>/dev/null | cut -f1)
  log "📊 Backup Status:"
  log "   Total backups: $TOTAL_BACKUPS"
  log "   Total size: $TOTAL_SIZE"

  log "✅ Backup completed successfully"
  log "========================================="

else
  log "❌ BACKUP FAILED!"
  log "   Check database connection and credentials"
  log "========================================="
  exit 1
fi

# Unset password
unset PGPASSWORD
BACKUP_SCRIPT

chmod +x /usr/local/bin/greenpay-backup.sh
chown root:root /usr/local/bin/greenpay-backup.sh
echo "   ✅ Created: /usr/local/bin/greenpay-backup.sh"

# Create pre-deployment backup script
echo ""
echo "📝 Creating pre-deployment backup script..."
cat > /usr/local/bin/greenpay-pre-deploy-backup.sh <<'PREDEPLOY_SCRIPT'
#!/bin/bash
##############################################################################
# Pre-Deployment Backup Script
##############################################################################

# Load credentials
source /root/.greenpay_backup_env

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="greenpay_pre_deploy_${TIMESTAMP}.sql.gz"
BACKUP_PATH="/var/backups/greenpay/pre-deploy/${BACKUP_FILE}"

export PGPASSWORD="$DB_PASSWORD"

echo "🔒 Creating pre-deployment backup..."

if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl 2>/dev/null | gzip > "${BACKUP_PATH}"; then
  BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
  echo "✅ Pre-deployment backup created"
  echo "   File: ${BACKUP_FILE}"
  echo "   Size: ${BACKUP_SIZE}"
  echo ""
  echo "🎯 Safe to proceed with deployment"

  # Keep only last 10 pre-deployment backups
  ls -t /var/backups/greenpay/pre-deploy/greenpay_pre_deploy_*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm

  unset PGPASSWORD
  exit 0
else
  echo "❌ Pre-deployment backup FAILED!"
  echo "⚠️  DO NOT PROCEED with deployment"
  unset PGPASSWORD
  exit 1
fi
PREDEPLOY_SCRIPT

chmod +x /usr/local/bin/greenpay-pre-deploy-backup.sh
chown root:root /usr/local/bin/greenpay-pre-deploy-backup.sh
echo "   ✅ Created: /usr/local/bin/greenpay-pre-deploy-backup.sh"

# Create restore script
echo ""
echo "📝 Creating restore script..."
cat > /usr/local/bin/greenpay-restore.sh <<'RESTORE_SCRIPT'
#!/bin/bash
##############################################################################
# Database Restore Script (Supabase)
##############################################################################

if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root (use sudo)"
  exit 1
fi

# Load credentials
source /root/.greenpay_backup_env

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "📋 Available backups:"
  echo ""
  ls -lh /var/backups/greenpay/greenpay_backup_*.sql.gz 2>/dev/null | tail -10 || echo "No backups found"
  echo ""
  echo "Usage: sudo greenpay-restore.sh /var/backups/greenpay/greenpay_backup_YYYYMMDD_HHMMSS.sql.gz"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   ⚠️  DATABASE RESTORE - DESTRUCTIVE OPERATION            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "This will REPLACE the current database with:"
echo "   $(basename $BACKUP_FILE)"
echo ""
read -p "Are you sure? Type 'YES' to continue: " CONFIRM

if [ "$CONFIRM" != "YES" ]; then
  echo "❌ Restore cancelled"
  exit 1
fi

export PGPASSWORD="$DB_PASSWORD"

echo ""
echo "🛑 Stopping backend service..."
pm2 stop greenpay-api 2>/dev/null || echo "Backend not running"

echo ""
echo "💾 Creating safety backup before restore..."
SAFETY_BACKUP="/var/backups/greenpay/before_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl 2>/dev/null | gzip > "$SAFETY_BACKUP"
echo "   ✅ Safety backup: $(basename $SAFETY_BACKUP)"

echo ""
echo "📥 Restoring from backup..."
echo "   (This may show some warnings - they are usually safe to ignore)"
gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" 2>&1 | grep -v "ERROR.*already exists" || true

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Database restored successfully!"

  echo ""
  echo "🚀 Restarting backend service..."
  pm2 restart greenpay-api 2>/dev/null || echo "Start backend manually"

  echo ""
  echo "✅ Restore completed!"
  echo "   Safety backup available: $SAFETY_BACKUP"
else
  echo ""
  echo "❌ Restore may have had issues"
  echo "   Check if system is working, or restore safety backup"
  pm2 restart greenpay-api 2>/dev/null
fi

unset PGPASSWORD
RESTORE_SCRIPT

chmod +x /usr/local/bin/greenpay-restore.sh
chown root:root /usr/local/bin/greenpay-restore.sh
echo "   ✅ Created: /usr/local/bin/greenpay-restore.sh"

# Create log file
touch "$LOG_FILE"
chmod 644 "$LOG_FILE"

# Setup cron job for daily backups
echo ""
echo "⏰ Configuring daily backup schedule..."
crontab -l 2>/dev/null | grep -v "greenpay-backup.sh" | crontab - 2>/dev/null || true
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/greenpay-backup.sh >> $LOG_FILE 2>&1") | crontab -
echo "   ✅ Cron job configured: Daily at 2:00 AM"

# Test backup immediately
echo ""
echo "🧪 Running initial backup test..."
/usr/local/bin/greenpay-backup.sh

if [ $? -eq 0 ]; then
  echo ""
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║   ✅ SUPABASE BACKUP SYSTEM SETUP COMPLETE                ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo ""
  echo "📋 Summary:"
  echo "   • Database: $DB_NAME @ $DB_HOST"
  echo "   • Daily backups: 2:00 AM (automatic)"
  echo "   • Retention: 30 days"
  echo "   • Location: $BACKUP_DIR"
  echo "   • Log file: $LOG_FILE"
  echo ""
  echo "📝 Available commands:"
  echo "   • Manual backup:        sudo /usr/local/bin/greenpay-backup.sh"
  echo "   • Pre-deploy backup:    sudo /usr/local/bin/greenpay-pre-deploy-backup.sh"
  echo "   • Restore database:     sudo /usr/local/bin/greenpay-restore.sh [backup_file]"
  echo "   • View backup logs:     tail -f $LOG_FILE"
  echo "   • List backups:         ls -lh $BACKUP_DIR"
  echo ""
else
  echo ""
  echo "❌ Initial backup test failed!"
  echo "   Check database connection and credentials in .env"
  echo "   Log file: $LOG_FILE"
  exit 1
fi
