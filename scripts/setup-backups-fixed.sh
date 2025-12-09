#!/bin/bash

##############################################################################
# PostgreSQL Automated Backup System for PNG Green Fees
# Fixed version - Auto-detects PostgreSQL user
#
# Usage: sudo ./setup-backups-fixed.sh
##############################################################################

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   📦 PNG Green Fees - Backup System Setup                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
BACKUP_DIR="/var/backups/greenpay"
DB_NAME="greenpay"
DB_HOST="localhost"
RETENTION_DAYS=30
LOG_FILE="/var/log/greenpay-backup.log"
NOTIFICATION_EMAIL="${NOTIFICATION_EMAIL:-admin@greenpay.gov.pg}"

# Auto-detect PostgreSQL user
echo "🔍 Detecting PostgreSQL configuration..."
if id postgres &>/dev/null; then
  PG_USER="postgres"
  PG_GROUP="postgres"
elif id postgresql &>/dev/null; then
  PG_USER="postgresql"
  PG_GROUP="postgresql"
else
  # Try to find from running process
  PG_USER=$(ps aux | grep postgres | grep -v grep | head -1 | awk '{print $1}')
  PG_GROUP=$PG_USER
fi

if [ -z "$PG_USER" ]; then
  echo "❌ Could not detect PostgreSQL user"
  echo "   Please specify manually or check PostgreSQL installation"
  exit 1
fi

echo "   Found PostgreSQL user: $PG_USER"
echo "   Found PostgreSQL group: $PG_GROUP"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root (use sudo)"
  exit 1
fi

# Detect current user (who called sudo)
ACTUAL_USER="${SUDO_USER:-$USER}"
echo "   Running as: $ACTUAL_USER (sudo)"

# Create backup directory
echo ""
echo "📁 Creating backup directory..."
mkdir -p "$BACKUP_DIR"
chmod 755 "$BACKUP_DIR"
# Don't change ownership - keep as root
echo "   ✅ Created: $BACKUP_DIR"

# Create pre-deployment backup directory
mkdir -p "$BACKUP_DIR/pre-deploy"
chmod 755 "$BACKUP_DIR/pre-deploy"

# Create monthly backup directory
mkdir -p "$BACKUP_DIR/monthly"
chmod 755 "$BACKUP_DIR/monthly"

# Create backup script
echo ""
echo "📝 Creating backup script..."
cat > /usr/local/bin/greenpay-backup.sh <<BACKUP_SCRIPT
#!/bin/bash
##############################################################################
# Daily Backup Script for PNG Green Fees Database
# Auto-generated with PostgreSQL user: $PG_USER
##############################################################################

TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
DATE=\$(date +%Y-%m-%d)
BACKUP_FILE="greenpay_backup_\${TIMESTAMP}.sql.gz"
BACKUP_PATH="/var/backups/greenpay/\${BACKUP_FILE}"
DB_NAME="greenpay"
DB_USER="$PG_USER"
DB_HOST="localhost"
RETENTION_DAYS=30
LOG_FILE="/var/log/greenpay-backup.log"

# Log function
log() {
  echo "[\$(date +'%Y-%m-%d %H:%M:%S')] \$1" | tee -a "\$LOG_FILE"
}

log "========================================="
log "🚀 Starting database backup..."
log "   Database: \$DB_NAME"
log "   File: \$BACKUP_FILE"

# Create backup with compression
if sudo -u $PG_USER pg_dump -h "\$DB_HOST" "\$DB_NAME" 2>/dev/null | gzip > "\${BACKUP_PATH}"; then
  # Get backup size
  BACKUP_SIZE=\$(du -h "\${BACKUP_PATH}" | cut -f1)
  log "✅ Backup created successfully"
  log "   Size: \$BACKUP_SIZE"
  log "   Location: \${BACKUP_PATH}"

  # Verify backup is not empty
  if [ -f "\${BACKUP_PATH}" ]; then
    BACKUP_BYTES=\$(stat -c%s "\${BACKUP_PATH}" 2>/dev/null || stat -f%z "\${BACKUP_PATH}" 2>/dev/null)
    if [ "\$BACKUP_BYTES" -lt 1000 ]; then
      log "❌ ERROR: Backup file is too small (\${BACKUP_BYTES} bytes)"
      exit 1
    fi
  fi

  # Monthly backup (first day of month)
  if [ "\$(date +%d)" == "01" ]; then
    MONTHLY_BACKUP="/var/backups/greenpay/monthly/greenpay_monthly_\$(date +%Y%m).sql.gz"
    cp "\${BACKUP_PATH}" "\$MONTHLY_BACKUP"
    log "📅 Monthly backup created: \$(basename \$MONTHLY_BACKUP)"
  fi

  # Clean old backups (keep last 30 days)
  log "🧹 Cleaning old backups (older than \$RETENTION_DAYS days)..."
  DELETED_COUNT=\$(find /var/backups/greenpay -maxdepth 1 -name "greenpay_backup_*.sql.gz" -mtime +\$RETENTION_DAYS -delete -print 2>/dev/null | wc -l)
  if [ "\$DELETED_COUNT" -gt 0 ]; then
    log "   Deleted \$DELETED_COUNT old backup(s)"
  else
    log "   No old backups to delete"
  fi

  # Keep monthly backups for 12 months
  find /var/backups/greenpay/monthly -name "greenpay_monthly_*.sql.gz" -mtime +365 -delete 2>/dev/null

  # Log current backup status
  TOTAL_BACKUPS=\$(find /var/backups/greenpay -maxdepth 1 -name "greenpay_backup_*.sql.gz" 2>/dev/null | wc -l)
  TOTAL_SIZE=\$(du -sh /var/backups/greenpay 2>/dev/null | cut -f1)
  log "📊 Backup Status:"
  log "   Total backups: \$TOTAL_BACKUPS"
  log "   Total size: \$TOTAL_SIZE"

  log "✅ Backup completed successfully"
  log "========================================="

else
  log "❌ BACKUP FAILED!"
  log "========================================="
  exit 1
fi
BACKUP_SCRIPT

chmod +x /usr/local/bin/greenpay-backup.sh
chown root:root /usr/local/bin/greenpay-backup.sh
echo "   ✅ Created: /usr/local/bin/greenpay-backup.sh"

# Create pre-deployment backup script
echo ""
echo "📝 Creating pre-deployment backup script..."
cat > /usr/local/bin/greenpay-pre-deploy-backup.sh <<PREDEPLOY_SCRIPT
#!/bin/bash
##############################################################################
# Pre-Deployment Backup Script
# Run this before every deployment to create a restore point
##############################################################################

TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="greenpay_pre_deploy_\${TIMESTAMP}.sql.gz"
BACKUP_PATH="/var/backups/greenpay/pre-deploy/\${BACKUP_FILE}"
DB_NAME="greenpay"
DB_USER="$PG_USER"

echo "🔒 Creating pre-deployment backup..."

if sudo -u $PG_USER pg_dump -h localhost "\$DB_NAME" 2>/dev/null | gzip > "\${BACKUP_PATH}"; then
  BACKUP_SIZE=\$(du -h "\${BACKUP_PATH}" | cut -f1)
  echo "✅ Pre-deployment backup created"
  echo "   File: \${BACKUP_FILE}"
  echo "   Size: \${BACKUP_SIZE}"
  echo ""
  echo "🎯 Safe to proceed with deployment"
  echo "   Restore command: gunzip -c \${BACKUP_PATH} | sudo -u $PG_USER psql \${DB_NAME}"

  # Keep only last 10 pre-deployment backups
  ls -t /var/backups/greenpay/pre-deploy/greenpay_pre_deploy_*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm

  exit 0
else
  echo "❌ Pre-deployment backup FAILED!"
  echo "⚠️  DO NOT PROCEED with deployment"
  exit 1
fi
PREDEPLOY_SCRIPT

chmod +x /usr/local/bin/greenpay-pre-deploy-backup.sh
chown root:root /usr/local/bin/greenpay-pre-deploy-backup.sh
echo "   ✅ Created: /usr/local/bin/greenpay-pre-deploy-backup.sh"

# Create restore script
echo ""
echo "📝 Creating restore script..."
cat > /usr/local/bin/greenpay-restore.sh <<RESTORE_SCRIPT
#!/bin/bash
##############################################################################
# Database Restore Script
# Usage: sudo greenpay-restore.sh [backup_file.sql.gz]
##############################################################################

if [ "\$EUID" -ne 0 ]; then
  echo "❌ Please run as root (use sudo)"
  exit 1
fi

BACKUP_FILE="\$1"
DB_NAME="greenpay"
DB_USER="$PG_USER"

if [ -z "\$BACKUP_FILE" ]; then
  echo "📋 Available backups:"
  echo ""
  ls -lh /var/backups/greenpay/greenpay_backup_*.sql.gz 2>/dev/null | tail -10 || echo "No backups found"
  echo ""
  echo "Usage: sudo greenpay-restore.sh /var/backups/greenpay/greenpay_backup_YYYYMMDD_HHMMSS.sql.gz"
  exit 1
fi

if [ ! -f "\$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: \$BACKUP_FILE"
  exit 1
fi

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   ⚠️  DATABASE RESTORE - DESTRUCTIVE OPERATION            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "This will REPLACE the current database with:"
echo "   \$(basename \$BACKUP_FILE)"
echo "   \$(ls -lh \$BACKUP_FILE | awk '{print \$5, \$6, \$7, \$8}')"
echo ""
read -p "Are you sure? Type 'YES' to continue: " CONFIRM

if [ "\$CONFIRM" != "YES" ]; then
  echo "❌ Restore cancelled"
  exit 1
fi

echo ""
echo "🛑 Stopping backend service..."
pm2 stop greenpay-api 2>/dev/null || echo "Backend not running"

echo ""
echo "💾 Creating safety backup before restore..."
SAFETY_BACKUP="/var/backups/greenpay/before_restore_\$(date +%Y%m%d_%H%M%S).sql.gz"
sudo -u $PG_USER pg_dump -h localhost "\$DB_NAME" 2>/dev/null | gzip > "\$SAFETY_BACKUP"
echo "   ✅ Safety backup: \$(basename \$SAFETY_BACKUP)"

echo ""
echo "🗑️  Dropping existing database..."
sudo -u $PG_USER psql -c "DROP DATABASE IF EXISTS \$DB_NAME;" 2>/dev/null

echo ""
echo "🆕 Creating fresh database..."
sudo -u $PG_USER psql -c "CREATE DATABASE \$DB_NAME;" 2>/dev/null

echo ""
echo "📥 Restoring from backup..."
gunzip -c "\$BACKUP_FILE" | sudo -u $PG_USER psql "\$DB_NAME" 2>/dev/null

if [ \$? -eq 0 ]; then
  echo ""
  echo "✅ Database restored successfully!"
  echo ""
  echo "🔍 Verifying data..."
  PASSPORT_COUNT=\$(sudo -u $PG_USER psql -d "\$DB_NAME" -t -c 'SELECT COUNT(*) FROM "Passport";' 2>/dev/null | xargs)
  USER_COUNT=\$(sudo -u $PG_USER psql -d "\$DB_NAME" -t -c 'SELECT COUNT(*) FROM "User";' 2>/dev/null | xargs)
  echo "   Passports: \$PASSPORT_COUNT"
  echo "   Users: \$USER_COUNT"

  echo ""
  echo "🚀 Restarting backend service..."
  pm2 restart greenpay-api 2>/dev/null || echo "Start backend manually"

  echo ""
  echo "✅ Restore completed successfully!"
  echo "   Safety backup available: \$SAFETY_BACKUP"
else
  echo ""
  echo "❌ Restore FAILED!"
  echo "   Attempting to restore safety backup..."
  gunzip -c "\$SAFETY_BACKUP" | sudo -u $PG_USER psql "\$DB_NAME" 2>/dev/null
  pm2 restart greenpay-api 2>/dev/null
  exit 1
fi
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

# Remove existing cron job if any
crontab -l 2>/dev/null | grep -v "greenpay-backup.sh" | crontab - 2>/dev/null || true

# Add new cron job (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/greenpay-backup.sh >> $LOG_FILE 2>&1") | crontab -

echo "   ✅ Cron job configured: Daily at 2:00 AM"

# Test backup immediately
echo ""
echo "🧪 Running initial backup test..."
/usr/local/bin/greenpay-backup.sh

if [ $? -eq 0 ]; then
  echo ""
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║   ✅ BACKUP SYSTEM SETUP COMPLETE                         ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo ""
  echo "📋 Summary:"
  echo "   • PostgreSQL user: $PG_USER"
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
  echo "   Check PostgreSQL connection and permissions"
  echo "   Log file: $LOG_FILE"
  exit 1
fi
