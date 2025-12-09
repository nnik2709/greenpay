#!/bin/bash

##############################################################################
# Application Files Backup Script for PNG Green Fees
#
# Backs up:
# - Backend source code
# - Frontend build
# - Configuration files
# - Nginx configuration
# - SSL certificates
# - PM2 configuration
#
# Usage: sudo ./backup-application-files.sh
##############################################################################

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   📦 PNG Green Fees - Application Files Backup            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/greenpay-files"
APP_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud"
RETENTION_DAYS=90

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root (use sudo)"
  exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

echo "📁 Backup directory: $BACKUP_DIR"
echo ""

# 1. Backup application code
echo "🔄 Backing up application code..."
if [ -d "$APP_DIR" ]; then
  tar -czf "$BACKUP_DIR/app_backup_${TIMESTAMP}.tar.gz" \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='.env' \
    -C "$(dirname $APP_DIR)" \
    "$(basename $APP_DIR)" 2>/dev/null

  APP_SIZE=$(du -h "$BACKUP_DIR/app_backup_${TIMESTAMP}.tar.gz" | cut -f1)
  echo "   ✅ Application backup: app_backup_${TIMESTAMP}.tar.gz ($APP_SIZE)"
else
  echo "   ⚠️  Application directory not found: $APP_DIR"
fi

# 2. Backup environment files (ENCRYPTED)
echo ""
echo "🔐 Backing up environment files (encrypted)..."
if [ -f "$APP_DIR/backend/.env" ]; then
  # Create encrypted backup of .env file
  tar -czf - "$APP_DIR/backend/.env" 2>/dev/null | \
    openssl enc -aes-256-cbc -salt -pbkdf2 -out "$BACKUP_DIR/env_backup_${TIMESTAMP}.tar.gz.enc"

  echo "   ✅ Environment backup (encrypted): env_backup_${TIMESTAMP}.tar.gz.enc"
  echo "   ⚠️  IMPORTANT: Save the encryption password securely!"
  echo "   Decrypt with: openssl enc -aes-256-cbc -d -pbkdf2 -in env_backup_${TIMESTAMP}.tar.gz.enc | tar -xzf -"
else
  echo "   ⚠️  .env file not found"
fi

# 3. Backup Nginx configuration
echo ""
echo "🔧 Backing up Nginx configuration..."
if [ -f "/etc/nginx/sites-available/greenpay.eywademo.cloud" ]; then
  mkdir -p "$BACKUP_DIR/nginx"
  cp /etc/nginx/sites-available/greenpay.eywademo.cloud \
     "$BACKUP_DIR/nginx/greenpay.eywademo.cloud_${TIMESTAMP}"
  echo "   ✅ Nginx config backed up"
else
  echo "   ⚠️  Nginx config not found"
fi

# 4. Backup SSL certificates
echo ""
echo "🔒 Backing up SSL certificates..."
if [ -d "/etc/letsencrypt/live/greenpay.eywademo.cloud" ]; then
  mkdir -p "$BACKUP_DIR/ssl"
  tar -czf "$BACKUP_DIR/ssl/ssl_certs_${TIMESTAMP}.tar.gz" \
    -C /etc/letsencrypt/live \
    greenpay.eywademo.cloud 2>/dev/null
  echo "   ✅ SSL certificates backed up"
else
  echo "   ⚠️  SSL certificates not found"
fi

# 5. Backup PM2 configuration
echo ""
echo "⚙️  Backing up PM2 configuration..."
if command -v pm2 &> /dev/null; then
  pm2 save --force >/dev/null 2>&1
  PM2_HOME="${PM2_HOME:-$HOME/.pm2}"
  if [ -f "$PM2_HOME/dump.pm2" ]; then
    mkdir -p "$BACKUP_DIR/pm2"
    cp "$PM2_HOME/dump.pm2" "$BACKUP_DIR/pm2/dump_${TIMESTAMP}.pm2"
    echo "   ✅ PM2 configuration backed up"
  fi
else
  echo "   ⚠️  PM2 not found"
fi

# 6. Create backup manifest
echo ""
echo "📝 Creating backup manifest..."
cat > "$BACKUP_DIR/manifest_${TIMESTAMP}.txt" <<MANIFEST
PNG Green Fees - Application Backup Manifest
============================================

Backup Date: $(date)
Hostname: $(hostname)
Backup ID: ${TIMESTAMP}

Included Files:
- Application code (excluding node_modules, dist, .git)
- Environment files (encrypted)
- Nginx configuration
- SSL certificates
- PM2 configuration

Application Info:
- App Directory: $APP_DIR
- Node Version: $(node --version 2>/dev/null || echo "N/A")
- NPM Version: $(npm --version 2>/dev/null || echo "N/A")
- PM2 Version: $(pm2 --version 2>/dev/null || echo "N/A")

Backup Files:
$(ls -lh $BACKUP_DIR/*${TIMESTAMP}* 2>/dev/null | awk '{print "- " $9 " (" $5 ")"}')

Restore Instructions:
===================

1. Stop services:
   pm2 stop all

2. Restore application:
   tar -xzf app_backup_${TIMESTAMP}.tar.gz -C /home/eywademo-greenpay/htdocs/

3. Restore environment (decrypt first):
   openssl enc -aes-256-cbc -d -pbkdf2 -in env_backup_${TIMESTAMP}.tar.gz.enc | tar -xzf -

4. Restore Nginx:
   cp nginx/greenpay.eywademo.cloud_${TIMESTAMP} /etc/nginx/sites-available/greenpay.eywademo.cloud
   nginx -t && nginx -s reload

5. Restore SSL:
   tar -xzf ssl/ssl_certs_${TIMESTAMP}.tar.gz -C /etc/letsencrypt/live/

6. Reinstall dependencies:
   cd $APP_DIR/backend && npm install

7. Restart services:
   pm2 restart all

MANIFEST

echo "   ✅ Manifest created: manifest_${TIMESTAMP}.txt"

# 7. Clean old backups
echo ""
echo "🧹 Cleaning old backups (older than $RETENTION_DAYS days)..."
DELETED_COUNT=$(find "$BACKUP_DIR" -maxdepth 1 -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
if [ "$DELETED_COUNT" -gt 0 ]; then
  echo "   Deleted $DELETED_COUNT old backup file(s)"
else
  echo "   No old backups to delete"
fi

# 8. Summary
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   ✅ APPLICATION BACKUP COMPLETED                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*${TIMESTAMP}* 2>/dev/null | wc -l)
echo "📊 Backup Summary:"
echo "   • Files backed up: $BACKUP_COUNT"
echo "   • Total size: $TOTAL_SIZE"
echo "   • Location: $BACKUP_DIR"
echo "   • Backup ID: $TIMESTAMP"
echo ""
echo "📋 Backed up files:"
ls -lh "$BACKUP_DIR"/*${TIMESTAMP}* 2>/dev/null | awk '{print "   • " $9 " (" $5 ")"}'
echo ""
echo "📄 View manifest: cat $BACKUP_DIR/manifest_${TIMESTAMP}.txt"
echo ""
