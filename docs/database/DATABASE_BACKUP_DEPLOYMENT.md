# Database Backup Deployment Guide

**Purpose:** Deploy automated PostgreSQL database backups for GreenPay production database

**Requirements:**
- SSH access to production server (165.22.52.100)
- Root privileges
- PostgreSQL installed with pg_dump available

---

## Step 1: Upload Backup Script to Server

Since you don't have automated deployment, you'll need to manually upload the script using CloudPanel File Manager or copy-paste.

### Option A: Copy-Paste Method (Recommended)

**Paste these commands in your SSH terminal:**

```bash
# 1. Create backup directory
mkdir -p /root/greenpay-backups

# 2. Create the backup script file
cat > /root/greenpay-backups/backup-greenpay-db.sh << 'SCRIPT_EOF'
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
DB_NAME="greenpay"
DB_USER="greenpay"
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
SCRIPT_EOF

# 3. Make the script executable
chmod +x /root/greenpay-backups/backup-greenpay-db.sh

# 4. Verify script was created correctly
echo ""
echo "=========================================="
echo "Verification: Script file created"
echo "=========================================="
ls -lh /root/greenpay-backups/backup-greenpay-db.sh
echo ""
echo "File type:"
file /root/greenpay-backups/backup-greenpay-db.sh
echo ""
echo "First 10 lines:"
head -10 /root/greenpay-backups/backup-greenpay-db.sh
```

---

## Step 2: Test the Backup Script

**Run a manual test backup:**

```bash
# Run the backup script manually
/root/greenpay-backups/backup-greenpay-db.sh
```

**Expected output:**
```
[2025-12-31 ...] ==========================================
[2025-12-31 ...] Starting GreenPay database backup
[2025-12-31 ...] Database: greenpay
[2025-12-31 ...] Backup file: greenpay_backup_2025-12-31_XX-XX-XX.sql
[2025-12-31 ...] Creating database backup...
[2025-12-31 ...] ✅ Backup created successfully
[2025-12-31 ...] Original size: 150M (approximately)
[2025-12-31 ...] Compressing backup...
[2025-12-31 ...] ✅ Backup compressed: greenpay_backup_2025-12-31_XX-XX-XX.sql.gz
[2025-12-31 ...] Compressed size: 15M (approximately)
[2025-12-31 ...] Total backups: 1
[2025-12-31 ...] ✅ BACKUP COMPLETED SUCCESSFULLY
```

**Verify backup file was created:**

```bash
# List backup files
ls -lh /root/greenpay-backups/greenpay_backup_*.sql.gz

# Check backup size
du -sh /root/greenpay-backups/
```

---

## Step 3: Verify Backup Integrity

**Test that the backup can be restored (optional but recommended):**

```bash
# Create a test database
PGPASSWORD="GreenPay2025!Secure#PG" createdb -h localhost -U greenpay greenpay_backup_test

# Find the latest backup file
LATEST_BACKUP=$(ls -t /root/greenpay-backups/greenpay_backup_*.sql.gz | head -1)

# Restore to test database
gunzip -c ${LATEST_BACKUP} | PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay greenpay_backup_test

# Verify table count matches
echo "Production tables:"
PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay -d greenpay -c "\dt" | grep "public" | wc -l

echo "Backup tables:"
PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay -d greenpay_backup_test -c "\dt" | grep "public" | wc -l

# Verify record counts match
echo "Production individual_purchases count:"
PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay -d greenpay -c "SELECT COUNT(*) FROM individual_purchases;"

echo "Backup individual_purchases count:"
PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay -d greenpay_backup_test -c "SELECT COUNT(*) FROM individual_purchases;"

# Clean up test database
PGPASSWORD="GreenPay2025!Secure#PG" dropdb -h localhost -U greenpay greenpay_backup_test

echo "✅ Backup integrity verified - safe to delete test database"
```

---

## Step 4: Configure Automated Daily Backups (Cron)

**Set up cron job to run backups daily at 2:00 AM:**

```bash
# Open crontab editor
crontab -e
```

**Add this line to the crontab file:**
```
0 2 * * * /root/greenpay-backups/backup-greenpay-db.sh >> /root/greenpay-backups/backup.log 2>&1
```

**Explanation:**
- `0 2 * * *` = Run at 2:00 AM every day
- `>>` = Append output to log file
- `2>&1` = Capture both stdout and stderr

**Save and exit** (in vi/vim: press ESC, type `:wq`, press ENTER)

**Verify cron job was added:**

```bash
# List current cron jobs
crontab -l

# Check cron service is running
systemctl status cron
```

---

## Step 5: Monitor Backup Logs

**Check backup log after first automated run:**

```bash
# View backup log (shows all backup runs)
tail -100 /root/greenpay-backups/backup.log

# Monitor log in real-time
tail -f /root/greenpay-backups/backup.log
```

**Check for errors:**

```bash
# Search for error messages
grep -i "error\|failed" /root/greenpay-backups/backup.log
```

**List all backups:**

```bash
# Show all backup files with sizes
ls -lht /root/greenpay-backups/greenpay_backup_*.sql.gz

# Show total backup storage used
du -sh /root/greenpay-backups/
```

---

## Backup Configuration Details

### Retention Policy
- **Retention Period:** 30 days
- **Automatic Cleanup:** Yes (deletes backups older than 30 days)
- **Storage Location:** `/root/greenpay-backups/`

### Backup Schedule
- **Frequency:** Daily
- **Time:** 2:00 AM (UTC+10 PNG time)
- **Expected Duration:** 2-5 minutes (depends on database size)

### Expected Backup Sizes
- **Uncompressed:** ~150-200 MB (depends on data volume)
- **Compressed (gzip):** ~15-20 MB (10:1 compression ratio)
- **30 days retention:** ~450-600 MB total storage

### Backup File Naming
- **Format:** `greenpay_backup_YYYY-MM-DD_HH-MM-SS.sql.gz`
- **Example:** `greenpay_backup_2025-12-31_02-00-05.sql.gz`

---

## Restoring from Backup

**If you ever need to restore the database from backup:**

### Full Database Restore (CAUTION: Overwrites all data)

```bash
# STEP 1: Stop the application
pm2 stop greenpay-api

# STEP 2: Find the backup file to restore
ls -lht /root/greenpay-backups/greenpay_backup_*.sql.gz

# STEP 3: Drop existing database (CAUTION!)
PGPASSWORD="GreenPay2025!Secure#PG" dropdb -h localhost -U greenpay greenpay

# STEP 4: Create fresh database
PGPASSWORD="GreenPay2025!Secure#PG" createdb -h localhost -U greenpay greenpay

# STEP 5: Restore from backup
BACKUP_FILE="/root/greenpay-backups/greenpay_backup_2025-12-31_02-00-05.sql.gz"
gunzip -c ${BACKUP_FILE} | PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay greenpay

# STEP 6: Verify restoration
PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay -d greenpay -c "SELECT COUNT(*) FROM individual_purchases;"

# STEP 7: Restart application
pm2 start greenpay-api
```

### Partial Restore (Single Table)

```bash
# Extract and restore only specific tables
BACKUP_FILE="/root/greenpay-backups/greenpay_backup_2025-12-31_02-00-05.sql.gz"

# Restore only individual_purchases table
gunzip -c ${BACKUP_FILE} | PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay greenpay --table=individual_purchases
```

---

## Troubleshooting

### Issue: Backup script fails with permission error

```bash
# Check script permissions
ls -l /root/greenpay-backups/backup-greenpay-db.sh

# Make sure it's executable
chmod +x /root/greenpay-backups/backup-greenpay-db.sh
```

### Issue: pg_dump command not found

```bash
# Find pg_dump location
which pg_dump

# If not found, install PostgreSQL client tools
apt-get update
apt-get install postgresql-client
```

### Issue: Authentication failed for user greenpay

```bash
# Verify database credentials
PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay -d greenpay -c "SELECT version();"

# Check pg_hba.conf authentication method
cat /etc/postgresql/*/main/pg_hba.conf | grep greenpay
```

### Issue: Disk space running out

```bash
# Check available disk space
df -h

# Check backup directory size
du -sh /root/greenpay-backups/

# Manually clean up old backups
find /root/greenpay-backups/ -name "greenpay_backup_*.sql.gz" -mtime +30 -type f -delete
```

### Issue: Cron job not running

```bash
# Check cron service status
systemctl status cron

# Start cron if stopped
systemctl start cron

# Check cron logs
grep CRON /var/log/syslog | tail -20

# Verify crontab entry
crontab -l
```

---

## Backup Best Practices

1. **Test Restore Regularly** - Test backup restoration monthly to ensure backups are valid

2. **Monitor Backup Logs** - Check backup.log weekly for errors

3. **Off-Site Backups** - Consider copying backups to off-site storage (AWS S3, Google Cloud Storage, etc.)

4. **Pre-Upgrade Backups** - Always run manual backup before system upgrades:
   ```bash
   /root/greenpay-backups/backup-greenpay-db.sh
   ```

5. **Document Restore Procedures** - Keep this guide accessible for emergency restoration

6. **Monitor Disk Space** - Set up alerts for low disk space on `/root` partition

---

## Security Considerations

1. **Backup File Permissions** - Backups contain sensitive data
   ```bash
   # Ensure only root can read backups
   chmod 600 /root/greenpay-backups/greenpay_backup_*.sql.gz
   ```

2. **Password in Script** - Database password is stored in backup script
   - Only root has access to `/root/` directory
   - Consider using PostgreSQL .pgpass file for passwordless authentication

3. **Backup Encryption** - For additional security, encrypt backups:
   ```bash
   # Encrypt backup file
   gpg --symmetric --cipher-algo AES256 greenpay_backup_2025-12-31.sql.gz
   ```

---

## Post-Deployment Checklist

- [ ] Backup script deployed to `/root/greenpay-backups/backup-greenpay-db.sh`
- [ ] Script is executable (`chmod +x`)
- [ ] Manual test backup completed successfully
- [ ] Backup file created and compressed
- [ ] Backup integrity verified (optional but recommended)
- [ ] Cron job configured for daily 2 AM backups
- [ ] Cron job verified with `crontab -l`
- [ ] Backup log location confirmed: `/root/greenpay-backups/backup.log`
- [ ] First automated backup successful (check after 2 AM next day)
- [ ] Restore procedure documented and tested
- [ ] Team notified of backup configuration

---

## Support Information

**Backup Script Location:** `scripts/backup-greenpay-db.sh` (local repository)

**Server Deployment Location:** `/root/greenpay-backups/backup-greenpay-db.sh`

**Backup Storage:** `/root/greenpay-backups/`

**Log File:** `/root/greenpay-backups/backup.log`

**Cron Schedule:** Daily at 2:00 AM PNG time

**Retention:** 30 days

---

**Deployment Date:** 2025-12-31
**Deployed By:** Claude Code
**Documentation Version:** 1.0
