# Security Audit and Backup Strategy for PNG Green Fees System

**Date:** 2025-12-08
**System:** PNG Green Fees - Passport & Voucher Management
**Sensitivity:** HIGH - Handles PII (Passport data, emails, phones, payment info)

---

## Executive Summary

This document provides a comprehensive security audit and backup strategy for the PNG Green Fees system. Given that the application processes sensitive personally identifiable information (PII) including passport numbers, names, dates of birth, gender, email addresses, phone numbers, and payment transactions, robust security and disaster recovery measures are **critical**.

---

## 1. Current Security Posture - AUDIT RESULTS

### ✅ **STRENGTHS**

1. **Password Security**
   - ✅ bcrypt hashing with salt rounds (10) for all passwords
   - ✅ Passwords never stored in plaintext
   - ✅ Located in: `backend/routes/auth.js`, `backend/routes/users.js`

2. **Authentication & Authorization**
   - ✅ JWT-based authentication with token expiry
   - ✅ Role-based access control (RBAC) with 4 roles
   - ✅ Middleware validation: `backend/middleware/auth.js`
   - ✅ Protected routes require valid JWT tokens
   - ✅ Token verification on every authenticated request

3. **Environment Variables**
   - ✅ Secrets stored in `.env` files (not hardcoded)
   - ✅ `.env` files properly excluded from git (`.gitignore`)
   - ✅ Example files provided (`.env.example`)

4. **Input Validation**
   - ✅ express-validator used for input sanitization
   - ✅ Parameterized SQL queries (prevents SQL injection)
   - ✅ Validation middleware in place: `backend/middleware/validator.js`

5. **Payment Security**
   - ✅ Stripe webhook signature verification
   - ✅ Raw body parsing for webhook validation
   - ✅ Test keys only (POC phase - production keys blocked)

6. **CORS Configuration**
   - ✅ CORS configured with allowed origins
   - ✅ Credentials support enabled
   - ✅ Proper headers configuration

---

### ⚠️ **CRITICAL VULNERABILITIES & GAPS**

#### 🔴 **CRITICAL - Immediate Action Required**

1. **NO DATA ENCRYPTION AT REST**
   - ❌ Passport numbers stored in plaintext in PostgreSQL
   - ❌ Email addresses unencrypted
   - ❌ Phone numbers unencrypted
   - ❌ **RISK:** Database breach exposes all PII directly
   - **Impact:** GDPR/Privacy violation, identity theft risk

2. **NO DATABASE BACKUPS**
   - ❌ No automated backup system configured
   - ❌ No backup retention policy
   - ❌ No disaster recovery plan
   - ❌ **RISK:** Data loss from hardware failure, corruption, or ransomware
   - **Impact:** Total system failure, revenue loss, legal liability

3. **WEAK JWT SECRET**
   - ❌ JWT_SECRET may be weak or default value
   - ❌ No secret rotation policy
   - ❌ **RISK:** Session hijacking, unauthorized access
   - **Impact:** Complete authentication bypass

4. **NO SSL/TLS FOR DATABASE**
   - ❌ Database connection does not enforce SSL
   - ❌ Credentials transmitted in plaintext over network
   - ❌ **RISK:** Man-in-the-middle attacks, credential theft
   - **Impact:** Database compromise

5. **SMTP CREDENTIALS IN ENVIRONMENT**
   - ❌ Gmail app password stored in plaintext `.env`
   - ❌ No secrets management system
   - ❌ **RISK:** Email account compromise
   - **Impact:** Phishing attacks using official email

#### 🟡 **HIGH PRIORITY**

6. **NO RATE LIMITING**
   - ⚠️ No brute-force protection on login
   - ⚠️ No API rate limiting
   - **RISK:** Credential stuffing attacks, DoS
   - **Impact:** Account takeover, service disruption

7. **NO AUDIT LOGGING**
   - ⚠️ No comprehensive audit trail for PII access
   - ⚠️ Login events tracked but not comprehensive
   - ⚠️ No logging of passport data views/modifications
   - **RISK:** Cannot detect or investigate breaches
   - **Impact:** Compliance violation, forensic blindness

8. **PUBLIC ROUTES WITH MINIMAL VALIDATION**
   - ⚠️ `/api/public-purchases/*` - no authentication required
   - ⚠️ Limited validation on public purchase endpoint
   - **RISK:** Spam, abuse, fraudulent transactions
   - **Impact:** Revenue loss, system abuse

9. **CORS CONFIGURED TOO PERMISSIVELY**
   - ⚠️ `ALLOWED_ORIGINS=*` in some configurations
   - ⚠️ Should be strict whitelist in production
   - **RISK:** CSRF attacks, unauthorized API access
   - **Impact:** Data exfiltration

10. **NO FILE UPLOAD VALIDATION**
    - ⚠️ CSV bulk uploads not thoroughly validated
    - ⚠️ No malware scanning
    - ⚠️ No file size limits enforced
    - **RISK:** Malicious file uploads, DoS
    - **Impact:** Server compromise, service disruption

#### 🟢 **MEDIUM PRIORITY**

11. **ERROR MESSAGES TOO VERBOSE**
    - Error messages may leak system information
    - Stack traces exposed in development mode
    - **RISK:** Information disclosure aids attackers

12. **NO SESSION TIMEOUT**
    - JWT tokens don't have aggressive timeout
    - No automatic logout on inactivity
    - **RISK:** Unattended sessions exploited

13. **NO TWO-FACTOR AUTHENTICATION**
    - High-privilege roles (Flex_Admin, Finance_Manager) lack 2FA
    - **RISK:** Compromised credentials = full access

14. **PAYMENT GATEWAY IN TEST MODE**
    - Still using Stripe test keys in production
    - Need BSP/Kina Bank integration for production
    - **RISK:** Cannot process real payments

---

## 2. COMPREHENSIVE BACKUP STRATEGY

### 2.1 Database Backup Plan

#### **Automated PostgreSQL Backups**

**Setup Script: `/scripts/setup-backups.sh`**

```bash
#!/bin/bash
# PostgreSQL Automated Backup System for PNG Green Fees

BACKUP_DIR="/var/backups/greenpay"
DB_NAME="greenpay"
DB_USER="postgres"
RETENTION_DAYS=30
S3_BUCKET="s3://png-greenpay-backups" # Optional cloud backup

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup script
cat > /usr/local/bin/greenpay-backup.sh <<'EOF'
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="greenpay_backup_${TIMESTAMP}.sql.gz"
BACKUP_PATH="/var/backups/greenpay/${BACKUP_FILE}"

# Full database dump with compression
pg_dump -U postgres -h localhost greenpay | gzip > ${BACKUP_PATH}

# Verify backup
if [ $? -eq 0 ]; then
  echo "✅ Backup created: ${BACKUP_FILE}"

  # Upload to cloud storage (optional)
  # aws s3 cp ${BACKUP_PATH} s3://png-greenpay-backups/daily/

  # Remove backups older than 30 days
  find /var/backups/greenpay -name "greenpay_backup_*.sql.gz" -mtime +30 -delete
else
  echo "❌ Backup FAILED!"
  exit 1
fi
EOF

chmod +x /usr/local/bin/greenpay-backup.sh

# Create cron job for daily backups at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/greenpay-backup.sh >> /var/log/greenpay-backup.log 2>&1") | crontab -

echo "✅ Backup system configured"
echo "   - Daily backups at 2:00 AM"
echo "   - Retention: 30 days"
echo "   - Location: /var/backups/greenpay/"
```

#### **Backup Types**

| Backup Type | Frequency | Retention | Location |
|-------------|-----------|-----------|----------|
| **Full DB Dump** | Daily 2 AM | 30 days | `/var/backups/greenpay/` |
| **Incremental (WAL)** | Continuous | 7 days | `/var/lib/postgresql/wal_archive/` |
| **Monthly Snapshot** | 1st of month | 12 months | S3/Cloud Storage |
| **Pre-deployment** | Before each deploy | 90 days | `/var/backups/greenpay/pre-deploy/` |

#### **Point-in-Time Recovery (PITR)**

Enable PostgreSQL Write-Ahead Logging (WAL) for continuous backup:

```sql
-- In postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/wal_archive/%f'
```

### 2.2 Application Files Backup

**Files to Backup:**
- Backend code: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/`
- Frontend dist: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/`
- Environment files: `.env` (encrypted storage only!)
- PM2 configuration
- Nginx configuration
- SSL certificates

**Backup Script:**

```bash
#!/bin/bash
# Application Files Backup

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/greenpay-files"
APP_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud"

mkdir -p $BACKUP_DIR

# Backup application files (exclude node_modules)
tar -czf "$BACKUP_DIR/app_backup_${TIMESTAMP}.tar.gz" \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  $APP_DIR

# Backup configuration
tar -czf "$BACKUP_DIR/config_backup_${TIMESTAMP}.tar.gz" \
  /etc/nginx/sites-available/greenpay.eywademo.cloud \
  /etc/letsencrypt/live/greenpay.eywademo.cloud

echo "✅ Application backup created: app_backup_${TIMESTAMP}.tar.gz"
```

**Weekly Schedule:** Every Sunday at 3 AM

### 2.3 Cloud Backup Strategy

**Recommended: AWS S3 or Backblaze B2**

```bash
# Install AWS CLI
apt-get install awscli

# Configure S3 sync
aws s3 sync /var/backups/greenpay/ s3://png-greenpay-backups/database/ --storage-class GLACIER

# Lifecycle policy: Move to Glacier after 30 days, delete after 365 days
```

**Alternative: Local NAS + Offsite**
- Primary: Daily to local NAS/external drive
- Secondary: Weekly to offsite location (different physical location)

### 2.4 Disaster Recovery Plan

**Recovery Time Objective (RTO):** 4 hours
**Recovery Point Objective (RPO):** 24 hours

#### **Full System Restore Procedure**

**1. Database Restore:**
```bash
# Stop backend service
pm2 stop greenpay-api

# Restore latest backup
gunzip -c /var/backups/greenpay/greenpay_backup_YYYYMMDD_HHMMSS.sql.gz | psql -U postgres greenpay

# Verify data
psql -U postgres greenpay -c "SELECT COUNT(*) FROM \"Passport\";"

# Restart service
pm2 start greenpay-api
```

**2. Application Restore:**
```bash
# Extract backup
tar -xzf /var/backups/greenpay-files/app_backup_YYYYMMDD_HHMMSS.tar.gz -C /

# Reinstall dependencies
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
npm install

# Restart services
pm2 restart all
nginx -s reload
```

**3. Verification Checklist:**
- [ ] Login page accessible
- [ ] User authentication working
- [ ] Database queries returning data
- [ ] Passport search functioning
- [ ] Payment gateway responding
- [ ] Email notifications sending

---

## 3. DATA ENCRYPTION STRATEGY

### 3.1 Encryption at Rest

**Implement Field-Level Encryption for PII:**

```javascript
// backend/utils/encryption.js
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32-byte key

function encrypt(text) {
  if (!text) return null;

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag.toString('hex')
  };
}

function decrypt(encryptedObject) {
  if (!encryptedObject) return null;

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(encryptedObject.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(encryptedObject.authTag, 'hex'));

  let decrypted = decipher.update(encryptedObject.encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = { encrypt, decrypt };
```

**Fields to Encrypt:**
- ✅ Passport numbers (passportNo)
- ✅ Email addresses
- ✅ Phone numbers
- ✅ Surnames
- ✅ Given names
- ⚠️ DOB (consider hashing for age verification)

**Database Schema Update:**
```sql
-- Add encrypted fields
ALTER TABLE "Passport" ADD COLUMN "passportNo_encrypted" JSONB;
ALTER TABLE "Passport" ADD COLUMN "email_encrypted" JSONB;
ALTER TABLE "Passport" ADD COLUMN "phone_encrypted" JSONB;

-- Migrate existing data (run once)
-- Keep plaintext temporarily for verification, remove after successful migration
```

### 3.2 Encryption in Transit

**Force SSL/TLS for All Connections:**

```javascript
// backend/config/database.js
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: true, // Force SSL
    ca: fs.readFileSync('/path/to/server-ca.pem').toString(),
    key: fs.readFileSync('/path/to/client-key.pem').toString(),
    cert: fs.readFileSync('/path/to/client-cert.pem').toString()
  }
});
```

**HTTPS Enforcement:**
- ✅ Already using SSL (greenpay.eywademo.cloud)
- ✅ Ensure HSTS headers enabled in Nginx
- ⚠️ Add redirect from HTTP to HTTPS

```nginx
# Nginx configuration
server {
    listen 80;
    server_name greenpay.eywademo.cloud;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name greenpay.eywademo.cloud;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

---

## 4. SECURITY HARDENING RECOMMENDATIONS

### Priority 1: Immediate (This Week)

1. **Setup Database Backups**
   - Run `setup-backups.sh` script
   - Verify first backup succeeds
   - Test restore procedure

2. **Strengthen JWT Secret**
   ```bash
   # Generate strong secret (64+ characters)
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   # Add to .env: JWT_SECRET=<generated_value>
   ```

3. **Enable Database SSL**
   - Configure PostgreSQL to require SSL connections
   - Update connection string in `.env`

4. **Implement Rate Limiting**
   ```javascript
   const rateLimit = require('express-rate-limit');

   // Login rate limiter
   const loginLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 5, // 5 attempts
     message: 'Too many login attempts, please try again later'
   });

   app.use('/api/auth/login', loginLimiter);
   ```

5. **Add Audit Logging**
   ```javascript
   // Log all PII access
   const auditLog = async (userId, action, resource, details) => {
     await db.query(
       `INSERT INTO audit_logs (user_id, action, resource, details, ip_address, timestamp)
        VALUES ($1, $2, $3, $4, $5, NOW())`,
       [userId, action, resource, JSON.stringify(details), req.ip]
     );
   };
   ```

### Priority 2: This Month

6. **Implement Field Encryption**
   - Deploy encryption utilities
   - Migrate existing PII to encrypted fields
   - Update queries to decrypt on read

7. **Add Security Headers**
   - Helmet.js middleware
   - CSP policy
   - CORS whitelist

8. **File Upload Security**
   - File size limits (10MB max)
   - MIME type validation
   - Virus scanning (ClamAV)

9. **Session Management**
   - Reduce JWT expiry to 1 hour
   - Implement refresh tokens
   - Add logout endpoint

### Priority 3: Next Quarter

10. **Two-Factor Authentication**
    - TOTP for Admin/Finance roles
    - SMS backup codes

11. **Security Monitoring**
    - Intrusion detection (Fail2Ban)
    - Log aggregation (ELK stack)
    - Alerting system

12. **Penetration Testing**
    - Hire external security audit
    - Fix identified vulnerabilities

---

## 5. COMPLIANCE & PRIVACY

### GDPR/Privacy Considerations

1. **Data Minimization**
   - Only collect necessary passport fields
   - Add retention policy (auto-delete after N years)

2. **Right to Erasure**
   - Implement data deletion endpoint
   - Anonymize instead of delete (for audit trail)

3. **Data Breach Notification**
   - Document breach response plan
   - Notification within 72 hours

4. **Privacy Policy**
   - Publish data handling policy
   - Cookie consent (if using analytics)

---

## 6. MONITORING & ALERTS

### Critical Alerts (Immediate Notification)

- Database connection failure
- Backup failure
- Failed login attempts > 10/hour
- API error rate > 5%
- Disk space < 10%
- SSL certificate expiring < 30 days

### Monitoring Tools

```bash
# Install monitoring
npm install pm2-slack
pm2 install pm2-server-monit

# Configure alerts
pm2 set pm2-slack:slack_url https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## 7. IMPLEMENTATION CHECKLIST

### Week 1
- [ ] Setup automated database backups
- [ ] Test restore procedure
- [ ] Generate strong JWT secret
- [ ] Enable database SSL
- [ ] Add rate limiting to login

### Week 2
- [ ] Implement audit logging
- [ ] Add security headers (Helmet.js)
- [ ] Configure CORS whitelist
- [ ] Setup monitoring alerts

### Week 3
- [ ] Deploy field-level encryption
- [ ] Migrate PII to encrypted storage
- [ ] File upload validation

### Week 4
- [ ] Session timeout implementation
- [ ] Security documentation
- [ ] Team training on security practices

---

## 8. BACKUP TESTING SCHEDULE

**Monthly:** Full restore test to staging environment
**Quarterly:** Disaster recovery drill with team
**Annually:** Third-party backup verification

---

## CONTACT & ESCALATION

**System Owner:** [Your Name/Team]
**Security Incidents:** security@greenpay.gov.pg
**Backup Issues:** it-support@greenpay.gov.pg
**Emergency Contact:** [Phone Number]

---

**Document Version:** 1.0
**Last Updated:** 2025-12-08
**Next Review:** 2025-01-08
