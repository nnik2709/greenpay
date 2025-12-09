# Security & Backup Quick Reference Card

**PNG Green Fees System - Emergency Reference**

---

## 🚨 Emergency Contacts

- **Security Breach:** security@greenpay.gov.pg
- **System Down:** it-support@greenpay.gov.pg
- **Database Issues:** dba@greenpay.gov.pg

---

## 🔥 Emergency Procedures

### Database Crashed - Restore Immediately

```bash
ssh root@72.61.208.79
sudo /usr/local/bin/greenpay-restore.sh $(ls -t /var/backups/greenpay/greenpay_backup_*.sql.gz | head -1)
```

### System Compromised - Lock Down

```bash
# 1. Stop backend immediately
ssh root@72.61.208.79 "pm2 stop greenpay-api"

# 2. Block all traffic (Nginx)
ssh root@72.61.208.79 "sudo systemctl stop nginx"

# 3. Create forensic backup
ssh root@72.61.208.79 "sudo /usr/local/bin/greenpay-backup.sh"

# 4. Review audit logs
ssh root@72.61.208.79 "sudo -u postgres psql greenpay -c 'SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100;'"

# 5. Contact security team
```

### Rate Limit False Positive - Reset

```bash
# Restart backend to clear in-memory rate limits
ssh root@72.61.208.79 "pm2 restart greenpay-api"

# OR if using Redis
ssh root@72.61.208.79 "redis-cli FLUSHDB"
```

---

## 📋 Daily Operations

### Check Backup Status

```bash
ssh root@72.61.208.79
tail -50 /var/log/greenpay-backup.log
ls -lh /var/backups/greenpay/ | tail -10
```

### Manual Backup Before Deployment

```bash
ssh root@72.61.208.79
sudo /usr/local/bin/greenpay-pre-deploy-backup.sh
```

### View Audit Logs (PII Access)

```sql
-- Last 24 hours of passport access
SELECT
  u.name as user_name,
  al.action,
  al.resource,
  al.resource_id,
  al.ip_address,
  al.timestamp
FROM audit_logs al
LEFT JOIN "User" u ON al.user_id = u.id
WHERE al.resource = 'Passport'
  AND al.timestamp > NOW() - INTERVAL '24 hours'
ORDER BY al.timestamp DESC;
```

### Check System Health

```bash
ssh root@72.61.208.79

# Backend status
pm2 status greenpay-api
pm2 logs greenpay-api --lines 50

# Database status
sudo -u postgres psql -c "SELECT version();"
sudo -u postgres psql greenpay -c "SELECT COUNT(*) FROM \"Passport\";"

# Disk space
df -h /var/backups

# SSL certificate expiry
echo | openssl s_client -servername greenpay.eywademo.cloud -connect greenpay.eywademo.cloud:443 2>/dev/null | openssl x509 -noout -dates
```

---

## 🔐 Security Incidents

### Suspected Brute Force Attack

```bash
# Check failed login attempts
ssh root@72.61.208.79
sudo -u postgres psql greenpay -c "
  SELECT
    details->>'email' as attempted_email,
    ip_address,
    COUNT(*) as attempts,
    MAX(timestamp) as last_attempt
  FROM audit_logs
  WHERE action = 'LOGIN_FAILED'
    AND timestamp > NOW() - INTERVAL '1 hour'
  GROUP BY details->>'email', ip_address
  HAVING COUNT(*) > 3
  ORDER BY attempts DESC;
"

# Block IP in firewall (if confirmed malicious)
ssh root@72.61.208.79 "sudo ufw deny from <IP_ADDRESS>"
```

### Unauthorized Data Access

```bash
# Find who accessed specific passport
ssh root@72.61.208.79
sudo -u postgres psql greenpay -c "
  SELECT
    u.name,
    u.email,
    al.action,
    al.ip_address,
    al.timestamp,
    al.details
  FROM audit_logs al
  JOIN \"User\" u ON al.user_id = u.id
  WHERE al.resource = 'Passport'
    AND al.resource_id = <PASSPORT_ID>
  ORDER BY al.timestamp DESC;
"
```

### Data Breach - Rotate Keys

```bash
# 1. Generate new JWT secret
NEW_JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# 2. Update .env on server
ssh root@72.61.208.79
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
nano .env  # Update JWT_SECRET

# 3. Restart (will invalidate all sessions)
pm2 restart greenpay-api

# 4. Force all users to re-login
# 5. Review audit logs for suspicious activity
```

---

## 📊 Monitoring Commands

### Real-time Logs

```bash
# Backend logs
ssh root@72.61.208.79 "pm2 logs greenpay-api --lines 100"

# Backup logs
ssh root@72.61.208.79 "tail -f /var/log/greenpay-backup.log"

# Nginx access logs
ssh root@72.61.208.79 "tail -f /var/log/nginx/access.log | grep greenpay"

# Nginx error logs
ssh root@72.61.208.79 "tail -f /var/log/nginx/error.log"
```

### Performance Metrics

```bash
ssh root@72.61.208.79

# Database connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'greenpay';"

# Database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('greenpay'));"

# Backup size trend
du -sh /var/backups/greenpay/

# API response time (from PM2)
pm2 monit
```

---

## 🔧 Maintenance Tasks

### Weekly (Every Monday)

- [ ] Review backup logs: `tail -100 /var/log/greenpay-backup.log`
- [ ] Check disk space: `df -h /var/backups`
- [ ] Review audit logs for anomalies
- [ ] Check SSL certificate expiry (30 days warning)

### Monthly (First Day)

- [ ] Test database restore procedure
- [ ] Review rate limiting effectiveness
- [ ] Analyze audit logs for patterns
- [ ] Update dependencies: `npm audit fix`
- [ ] Review and clean old backups

### Quarterly

- [ ] Rotate JWT_SECRET
- [ ] Full security audit
- [ ] Disaster recovery drill
- [ ] Review user access permissions

---

## 🛠️ Common Issues & Solutions

### Issue: Backup Failed

```bash
# Check disk space
df -h /var/backups

# Check PostgreSQL running
sudo systemctl status postgresql

# Check permissions
ls -la /var/backups/greenpay

# Manual backup
sudo -u postgres pg_dump greenpay | gzip > /tmp/manual_backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Issue: API Slow/Unresponsive

```bash
# Check CPU/Memory
ssh root@72.61.208.79 "top -b -n 1 | head -20"

# Check database connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity WHERE datname = 'greenpay';"

# Restart if needed
pm2 restart greenpay-api
```

### Issue: Rate Limit Too Aggressive

```javascript
// Temporarily increase limits (backend/middleware/rateLimiter.js)
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,  // Increased from 5
  // ...
});
```

### Issue: Encryption Errors

```bash
# Test encryption key
ssh root@72.61.208.79
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
node utils/encryption.js

# Check ENCRYPTION_KEY set
grep ENCRYPTION_KEY .env
```

---

## 📱 Quick Commands Cheatsheet

```bash
# === Backups ===
# Manual DB backup
sudo /usr/local/bin/greenpay-backup.sh

# Pre-deployment backup
sudo /usr/local/bin/greenpay-pre-deploy-backup.sh

# Restore database
sudo /usr/local/bin/greenpay-restore.sh /var/backups/greenpay/greenpay_backup_*.sql.gz

# List backups
ls -lht /var/backups/greenpay/ | head -10

# === Logs ===
# View backup log
tail -f /var/log/greenpay-backup.log

# View API logs
pm2 logs greenpay-api

# View all PM2 processes
pm2 status

# === Database ===
# Connect to database
sudo -u postgres psql greenpay

# Database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('greenpay'));"

# Active connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'greenpay';"

# === Security ===
# Check audit logs
sudo -u postgres psql greenpay -c "SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 20;"

# Failed logins
sudo -u postgres psql greenpay -c "SELECT * FROM audit_logs WHERE action = 'LOGIN_FAILED' AND timestamp > NOW() - INTERVAL '24 hours';"

# === System ===
# Restart backend
pm2 restart greenpay-api

# Stop backend
pm2 stop greenpay-api

# Start backend
pm2 start greenpay-api

# Nginx reload
sudo nginx -s reload

# Check disk space
df -h

# === SSL ===
# Check certificate
echo | openssl s_client -servername greenpay.eywademo.cloud -connect greenpay.eywademo.cloud:443 2>/dev/null | openssl x509 -noout -dates
```

---

## 📞 Escalation Matrix

| Issue | Severity | Response Time | Contact |
|-------|----------|---------------|---------|
| Data Breach | CRITICAL | Immediate | Security Team + Management |
| Database Down | CRITICAL | 15 minutes | DBA + IT Support |
| Backup Failed | HIGH | 2 hours | IT Support |
| API Slow | MEDIUM | 4 hours | DevOps |
| SSL Expiring | MEDIUM | 7 days | IT Support |
| Rate Limit Issues | LOW | 24 hours | Support Team |

---

**Keep this document accessible for emergency reference!**

**Last Updated:** 2025-12-08
**Review:** Monthly
