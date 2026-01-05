# BSP DOKU Server Security - Required Fixes

**Date:** December 19, 2024
**Server:** greenpay.eywademo.cloud (165.22.52.100)
**Based on:** Security Audit Results

---

## CRITICAL FIXES - Do Immediately

### 1. Secure .env File Permissions ⚠️ HIGH PRIORITY

**Issue:** .env file has permissions 644 (world-readable)
**Risk:** Database credentials and API keys exposed to any user on server

```bash
ssh root@165.22.52.100

# Fix permissions
chmod 600 /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env
chown eywademo-greenpay:eywademo-greenpay /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env

# Verify
ls -la /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env
```

Expected output: `-rw------- 1 eywademo-greenpay eywademo-greenpay`

---

### 2. Apply Security Updates ⚠️ HIGH PRIORITY

**Issue:** 44 pending security updates
**Risk:** Known vulnerabilities unpatched

```bash
ssh root@165.22.52.100

# Update package lists
sudo apt-get update

# Apply all security updates
sudo apt-get upgrade -y

# Reboot if kernel was updated
sudo needrestart -r a
```

**Time Required:** 10-15 minutes
**Downtime:** Possible 2-3 minute restart if kernel updated

---

### 3. Disable Root SSH Login ⚠️ HIGH PRIORITY

**Issue:** Root login enabled via SSH
**Risk:** Direct root access attack vector

**IMPORTANT:** First ensure you have a non-root user with sudo access!

```bash
ssh root@165.22.52.100

# Create non-root admin user (if not exists)
adduser adminuser
usermod -aG sudo adminuser

# Test sudo access
su - adminuser
sudo ls /root  # Should work

# Exit back to root
exit

# Disable root login
nano /etc/ssh/sshd_config

# Change this line:
# FROM: PermitRootLogin yes
# TO:   PermitRootLogin no

# Restart SSH
systemctl restart sshd
```

**WARNING:** Test non-root user login BEFORE logging out of root session!

---

### 4. Restrict Node.js Backend to Localhost ⚠️ MEDIUM PRIORITY

**Issue:** Node.js port 3001 exposed to network
**Risk:** Direct backend access bypassing Nginx

**Check PM2 Configuration:**

```bash
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Check how backend is started
pm2 show greenpay-api

# Look for server.js or app.js
cat server.js | grep -A 5 "listen"
```

**Expected:** Backend should listen on `127.0.0.1:3001` not `0.0.0.0:3001`

**Fix in server.js:**

```javascript
// BEFORE (unsafe):
app.listen(3001, () => {
  console.log('Server running on port 3001');
});

// AFTER (secure):
app.listen(3001, '127.0.0.1', () => {
  console.log('Server running on localhost:3001');
});
```

Then restart:
```bash
pm2 restart greenpay-api
netstat -tulpn | grep 3001  # Should show 127.0.0.1:3001
```

---

## RECOMMENDED FIXES - Do Soon

### 5. Disable SSH Password Authentication

**Benefit:** Force SSH key-based authentication only
**Risk if not done:** Password brute-force attacks

```bash
ssh root@165.22.52.100

# Ensure you have SSH keys set up first!
cat ~/.ssh/authorized_keys  # Should show your public key

# Edit SSH config
nano /etc/ssh/sshd_config

# Change:
# FROM: PasswordAuthentication yes
# TO:   PasswordAuthentication no

# Restart SSH
systemctl restart sshd
```

**WARNING:** Test SSH key login works before disabling passwords!

---

### 6. Install Security Tools

**Tools needed for PCI-DSS compliance:**

```bash
ssh root@165.22.52.100

# Install Lynis (security auditing)
sudo apt-get install lynis -y

# Install rkhunter (rootkit detection)
sudo apt-get install rkhunter -y
sudo rkhunter --update

# Install auditd (audit logging)
sudo apt-get install auditd -y
sudo systemctl enable auditd
sudo systemctl start auditd

# Run Lynis audit
sudo lynis audit system

# Target: Score 80+
```

---

### 7. Configure Nginx Security Headers

**Issue:** Nginx config not found in expected location
**Need:** Verify security headers are configured

```bash
ssh root@165.22.52.100

# Find actual Nginx config
find /etc/nginx -name "*greenpay*"
find /etc/nginx -name "*.conf" | xargs grep "greenpay.eywademo.cloud"

# Or check CloudPanel config (seems to be used)
ls -la /etc/nginx/sites-available/
ls -la /etc/nginx/sites-enabled/
```

Once found, verify these headers exist:

```nginx
add_header Strict-Transport-Security "max-age=63072000" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

Test after changes:
```bash
curl -I https://greenpay.eywademo.cloud | grep -E "Strict-Transport|X-Frame|X-Content"
```

---

### 8. Set Up Audit Logging for Payment Webhooks

**For PCI-DSS compliance:**

```bash
ssh root@165.22.52.100

# Monitor webhook file access
sudo auditctl -w /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/payment-webhook-doku.js -p wa -k payment_webhook

# Monitor .env access
sudo auditctl -w /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env -p wa -k env_file

# List audit rules
sudo auditctl -l

# Make rules persistent
sudo sh -c 'auditctl -l > /etc/audit/rules.d/greenpay.rules'
```

---

### 9. Address Failed Login Attempts

**Observation:** Failed login attempts from 139.59.186.26

```bash
ssh root@165.22.52.100

# Check if IP is already banned
sudo fail2ban-client status sshd

# Manually ban persistent attacker (if needed)
sudo fail2ban-client set sshd banip 139.59.186.26

# Check banned IPs
sudo fail2ban-client status sshd
```

Fail2Ban is working correctly - 67 IPs banned so far.

---

### 10. SSL Labs Test

**Verify SSL configuration:**

1. Visit: https://www.ssllabs.com/ssltest/analyze.html?d=greenpay.eywademo.cloud
2. Target grade: **A+**
3. Check for:
   - TLS 1.2+ only
   - Strong cipher suites
   - HSTS enabled
   - Certificate chain valid

---

## OPTIONAL IMPROVEMENTS

### 11. Set Up Monitoring Alerts

```bash
#!/bin/bash
# /root/security-monitor.sh

# Email on security events
ADMIN_EMAIL="your-email@example.com"

# Check failed logins
FAILED=$(grep "Failed password" /var/log/auth.log | tail -1h | wc -l)
if [ $FAILED -gt 20 ]; then
    echo "ALERT: $FAILED failed logins in last hour" | mail -s "Security Alert" $ADMIN_EMAIL
fi

# Check webhook blocks
BLOCKS=$(grep "SECURITY: Unauthorized IP" /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/logs/*.log 2>/dev/null | wc -l)
if [ $BLOCKS -gt 0 ]; then
    echo "ALERT: $BLOCKS unauthorized webhook attempts" | mail -s "Webhook Security Alert" $ADMIN_EMAIL
fi
```

Add to cron:
```bash
crontab -e
# Add: 0 * * * * /root/security-monitor.sh
```

---

### 12. Database Backup with Encryption

```bash
#!/bin/bash
# /root/backup-database.sh

BACKUP_DIR="/var/backups/greenpay-db"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="greenpay_db"

mkdir -p $BACKUP_DIR

# Backup and encrypt
sudo -u postgres pg_dump $DB_NAME | gzip | \
  openssl enc -aes-256-cbc -salt -pbkdf2 -out "$BACKUP_DIR/greenpay_$DATE.sql.gz.enc"

# Keep last 30 days only
find $BACKUP_DIR -name "greenpay_*.sql.gz.enc" -mtime +30 -delete

echo "Backup completed: greenpay_$DATE.sql.gz.enc"
```

Add to cron:
```bash
crontab -e
# Add: 0 2 * * * /root/backup-database.sh
```

---

## Priority Order

### Do Today:
1. ✓ Fix .env permissions (2 minutes)
2. ✓ Apply security updates (15 minutes)
3. ✓ Restrict Node.js to localhost (5 minutes)

### Do This Week:
4. Disable root SSH login (10 minutes - requires user setup)
5. Install security tools (10 minutes)
6. Verify Nginx security headers (15 minutes)

### Do Before Production:
7. Disable SSH password auth (5 minutes)
8. Set up audit logging (10 minutes)
9. Run SSL Labs test (5 minutes)
10. Configure monitoring alerts (30 minutes)

---

## Verification Commands

After applying fixes, run these to verify:

```bash
# 1. Check .env permissions
ls -la /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env

# 2. Check for updates
sudo apt-get update && apt-get -s upgrade | grep -P '^\d+ upgraded'

# 3. Check Node.js binding
netstat -tulpn | grep 3001

# 4. Check SSH config
grep "PermitRootLogin\|PasswordAuthentication" /etc/ssh/sshd_config

# 5. Check security headers
curl -I https://greenpay.eywademo.cloud

# 6. Check firewall
sudo ufw status | grep -E "103.10.130|147.139.130"

# 7. Check Fail2Ban
sudo fail2ban-client status sshd

# 8. Re-run full audit
./server-security-audit.sh > security-audit-after-fixes.txt
```

---

## BSP Testing Readiness

Before contacting BSP for testing:

- [x] DOKU IPs whitelisted ✓
- [ ] .env file secured (600)
- [ ] Security updates applied
- [ ] Node.js localhost-only
- [ ] Root login disabled
- [ ] Security headers verified
- [ ] SSL Labs grade A+
- [ ] Audit logging enabled

---

**Document Version:** 1.0
**Created:** December 19, 2024
**Next Review:** After applying critical fixes
