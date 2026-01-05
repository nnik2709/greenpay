#!/bin/bash

# GreenPay Database Backup Script
# ==================================
# This script creates a backup of the GreenPay database
# Run manually or via cron for automated backups
#
# IMPORTANT: This script should be deployed to the server at:
# /root/greenpay-backups/backup-greenpay-db.sh
#
# Setup instructions:
# 1. SSH to server: ssh root@165.22.52.100
# 2. Create backup directory: mkdir -p /root/greenpay-backups
# 3. Copy this script to /root/greenpay-backups/backup-greenpay-db.sh
# 4. Make executable: chmod +x /root/greenpay-backups/backup-greenpay-db.sh
# 5. Test: /root/greenpay-backups/backup-greenpay-db.sh
# 6. Set up cron: crontab -e
#    Add line: 0 2 * * * /root/greenpay-backups/backup-greenpay-db.sh >> /root/greenpay-backups/backup.log 2>&1

# Configuration
BACKUP_DIR="/root/greenpay-backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="greenpay_backup_${DATE}.sql"
DB_NAME="greenpay_db"
DB_USER="greenpay_user"
DB_PASSWORD="GreenPay2025!Secure#PG"
RETENTION_DAYS=30

# Ensure backup directory exists
mkdir -p ${BACKUP_DIR}

# Log start
echo "[$(date)] =========================================="
echo "[$(date)] Starting GreenPay database backup"
echo "[$(date)] Database: ${DB_NAME}"
echo "[$(date)] Backup file: ${BACKUP_FILE}"

# Create backup
echo "[$(date)] Creating database backup..."
PGPASSWORD="${DB_PASSWORD}" pg_dump -h localhost -U ${DB_USER} ${DB_NAME} > ${BACKUP_DIR}/${BACKUP_FILE}

# Check if backup successful
if [ $? -eq 0 ]; then
  echo "[$(date)] ✅ Backup created successfully"

  # Get original size
  ORIGINAL_SIZE=$(ls -lh ${BACKUP_DIR}/${BACKUP_FILE} | awk '{print $5}')
  echo "[$(date)] Original size: ${ORIGINAL_SIZE}"

  # Compress backup
  echo "[$(date)] Compressing backup..."
  gzip ${BACKUP_DIR}/${BACKUP_FILE}

  if [ $? -eq 0 ]; then
    COMPRESSED_SIZE=$(ls -lh ${BACKUP_DIR}/${BACKUP_FILE}.gz | awk '{print $5}')
    echo "[$(date)] ✅ Backup compressed: ${BACKUP_FILE}.gz"
    echo "[$(date)] Compressed size: ${COMPRESSED_SIZE}"

    # Delete backups older than retention period
    echo "[$(date)] Cleaning up old backups (older than ${RETENTION_DAYS} days)..."
    DELETED_COUNT=$(find ${BACKUP_DIR} -name "greenpay_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -type f | wc -l)

    if [ ${DELETED_COUNT} -gt 0 ]; then
      find ${BACKUP_DIR} -name "greenpay_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -type f -delete
      echo "[$(date)] ✅ Deleted ${DELETED_COUNT} old backup(s)"
    else
      echo "[$(date)] No old backups to delete"
    fi

    # Show current backups
    TOTAL_BACKUPS=$(find ${BACKUP_DIR} -name "greenpay_backup_*.sql.gz" -type f | wc -l)
    TOTAL_SIZE=$(du -sh ${BACKUP_DIR} | awk '{print $1}')
    echo "[$(date)] Total backups: ${TOTAL_BACKUPS}"
    echo "[$(date)] Total backup size: ${TOTAL_SIZE}"

    # List recent backups
    echo "[$(date)] Recent backups:"
    ls -lht ${BACKUP_DIR}/greenpay_backup_*.sql.gz | head -5

    echo "[$(date)] ✅ BACKUP COMPLETED SUCCESSFULLY"
    echo "[$(date)] =========================================="
    exit 0
  else
    echo "[$(date)] ❌ ERROR: Compression failed!"
    echo "[$(date)] =========================================="
    exit 1
  fi
else
  echo "[$(date)] ❌ ERROR: Database backup failed!"
  echo "[$(date)] =========================================="
  exit 1
fi
