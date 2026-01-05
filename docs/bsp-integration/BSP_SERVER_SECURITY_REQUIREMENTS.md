# BSP IPG Integration - Server Security Requirements

**Target Server:** greenpay.eywademo.cloud (165.22.52.100)
**Date:** December 19, 2024
**Compliance:** PCI-DSS, Banking Industry Standards

---

## 🏦 Banking IPG Integration - Server Requirements

When integrating with **BSP Bank's DOKU payment gateway**, your server infrastructure must meet specific security standards. Banks typically require **PCI-DSS compliance** for servers handling payment data.

---

## 1. 🔒 SSL/TLS Configuration

### Requirements:
- ✅ **TLS 1.2 or higher** (TLS 1.3 preferred)
- ✅ **Strong cipher suites only**
- ✅ **Valid SSL certificate** (not self-signed)
- ✅ **HSTS enabled** (HTTP Strict Transport Security)
- ❌ No SSLv3, TLS 1.0, or TLS 1.1

### Check Current Configuration:
```bash
# Test SSL/TLS configuration
openssl s_client -connect greenpay.eywademo.cloud:443 -tls1_2

# Check certificate validity
echo | openssl s_client -servername greenpay.eywademo.cloud -connect greenpay.eywademo.cloud:443 2>/dev/null | openssl x509 -noout -dates

# Scan SSL configuration
nmap --script ssl-enum-ciphers -p 443 greenpay.eywademo.cloud
```

### Required Nginx Configuration:
```nginx
# /etc/nginx/sites-available/greenpay.conf

server {
    listen 443 ssl http2;
    server_name greenpay.eywademo.cloud;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/greenpay.eywademo.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/greenpay.eywademo.cloud/privkey.pem;

    # TLS Version - Only 1.2 and 1.3
    ssl_protocols TLSv1.2 TLSv1.3;

    # Strong Cipher Suites (PCI-DSS compliant)
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;

    # SSL Session
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/greenpay.eywademo.cloud/chain.pem;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # CSP Header (adjust based on your needs)
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://staging.doku.com https://pay.doku.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://staging.doku.com https://pay.doku.com; frame-src https://staging.doku.com https://pay.doku.com;" always;

    # Disable server tokens
    server_tokens off;

    # API routes
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Security: Limit request body size
        client_max_body_size 10M;

        # Security: Request timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files
    location / {
        root /var/www/greenpay/dist;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name greenpay.eywademo.cloud;
    return 301 https://$server_name$request_uri;
}
```

### Test SSL Configuration:
```bash
# Use SSL Labs (highly recommended)
https://www.ssllabs.com/ssltest/analyze.html?d=greenpay.eywademo.cloud

# Or use testssl.sh
git clone https://github.com/drwetter/testssl.sh.git
cd testssl.sh
./testssl.sh https://greenpay.eywademo.cloud
```

**Target Score:** A+ on SSL Labs

---

## 2. 🔥 Firewall Configuration (UFW/iptables)

### Required Rules:

```bash
# Reset firewall
sudo ufw --force reset

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH (restrict to specific IPs if possible)
sudo ufw allow from YOUR_OFFICE_IP to any port 22 proto tcp comment 'SSH from office'

# HTTP/HTTPS (public)
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# DOKU Staging/Test IPs (notify webhook)
sudo ufw allow from 103.10.130.75 to any port 443 proto tcp comment 'DOKU Staging IP 1'
sudo ufw allow from 147.139.130.145 to any port 443 proto tcp comment 'DOKU Staging IP 2'

# DOKU Production IPs (for later)
# sudo ufw allow from 103.10.130.35 to any port 443 proto tcp comment 'DOKU Production IP 1'
# sudo ufw allow from 147.139.129.160 to any port 443 proto tcp comment 'DOKU Production IP 2'

# Database (PostgreSQL) - ONLY from localhost
sudo ufw deny 5432/tcp comment 'PostgreSQL - deny external'

# Node.js backend - ONLY from localhost/nginx
sudo ufw deny 3001/tcp comment 'Node.js - deny external'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status numbered
```

### Verify Firewall:
```bash
# Check UFW status
sudo ufw status verbose

# Check active connections
sudo netstat -tulpn | grep LISTEN

# Scan for open ports (from external machine)
nmap -sV greenpay.eywademo.cloud
```

**Critical:** Only ports 80, 443, and SSH should be accessible from internet.

---

## 3. 🛡️ Intrusion Detection/Prevention

### Install Fail2Ban:
```bash
# Install Fail2Ban
sudo apt-get update
sudo apt-get install fail2ban -y

# Create local config
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
```

### Configure Fail2Ban for Nginx and SSH:
```bash
# /etc/fail2ban/jail.local

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
bantime = 3600
findtime = 600

[nginx-botsearch]
enabled = true
filter = nginx-botsearch
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
bantime = 86400
findtime = 600
```

### Start Fail2Ban:
```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Check status
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

---

## 4. 🔐 SSH Hardening

### Secure SSH Configuration:
```bash
# /etc/ssh/sshd_config

# Disable root login
PermitRootLogin no

# Disable password authentication (use SSH keys only)
PasswordAuthentication no
PubkeyAuthentication yes

# Disable empty passwords
PermitEmptyPasswords no

# Disable X11 forwarding
X11Forwarding no

# Set idle timeout
ClientAliveInterval 300
ClientAliveCountMax 2

# Limit SSH access to specific users
AllowUsers your_username

# Use SSH Protocol 2 only
Protocol 2

# Restrict SSH to specific IPs (if possible)
# ListenAddress YOUR_OFFICE_IP
```

### Restart SSH:
```bash
sudo systemctl restart sshd
```

---

## 5. 🗄️ Database Security (PostgreSQL)

### Required Configuration:
```bash
# /etc/postgresql/*/main/postgresql.conf

# Listen only on localhost (CRITICAL)
listen_addresses = 'localhost'

# SSL Mode
ssl = on
ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'
ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'

# Log connections
log_connections = on
log_disconnections = on

# Log statements
log_statement = 'mod'  # Log all modifications
```

### PostgreSQL Host-Based Authentication:
```bash
# /etc/postgresql/*/main/pg_hba.conf

# TYPE  DATABASE        USER            ADDRESS                 METHOD

# Local connections only
local   all             all                                     peer
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256

# Deny all other connections
host    all             all             0.0.0.0/0               reject
```

### Secure Database Credentials:
```bash
# Create strong password
openssl rand -base64 32

# Update .env file permissions
chmod 600 /var/www/greenpay/.env
chown www-data:www-data /var/www/greenpay/.env
```

### Database Backup Encryption:
```bash
# Encrypted backup script
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="greenpay"

# Backup and encrypt
sudo -u postgres pg_dump $DB_NAME | gzip | \
  openssl enc -aes-256-cbc -salt -pbkdf2 -out "$BACKUP_DIR/greenpay_$DATE.sql.gz.enc"

# Keep only last 30 days
find $BACKUP_DIR -name "greenpay_*.sql.gz.enc" -mtime +30 -delete
```

---

## 6. 📊 Logging & Monitoring

### Application Logging:
```javascript
// backend/config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'greenpay-api' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: '/var/log/greenpay/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10
    }),
    // All logs
    new winston.transports.File({
      filename: '/var/log/greenpay/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 30
    })
  ]
});

module.exports = logger;
```

### Log Rotation:
```bash
# /etc/logrotate.d/greenpay

/var/log/greenpay/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
        pm2 reloadLogs
    endscript
}

/var/log/nginx/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}
```

### Security Event Monitoring:
```bash
# Install audit daemon
sudo apt-get install auditd -y

# Monitor payment webhook access
sudo auditctl -w /var/www/greenpay/backend/routes/payment-webhook-doku.js -p wa -k payment_webhook

# Monitor .env file
sudo auditctl -w /var/www/greenpay/.env -p wa -k env_file

# Monitor database config
sudo auditctl -w /etc/postgresql -p wa -k postgres_config

# List all audit rules
sudo auditctl -l
```

---

## 7. 🔄 System Updates & Patching

### Automatic Security Updates:
```bash
# Install unattended-upgrades
sudo apt-get install unattended-upgrades -y

# Configure automatic security updates
sudo dpkg-reconfigure -plow unattended-upgrades

# /etc/apt/apt.conf.d/50unattended-upgrades
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
};

Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Automatic-Reboot "false";
```

### Regular Updates:
```bash
# Weekly update script
#!/bin/bash
# /root/weekly-updates.sh

# Update package lists
apt-get update

# Upgrade security packages
apt-get upgrade -y

# Clean up
apt-get autoremove -y
apt-get autoclean

# Restart services if needed
needrestart -r a

# Log update
echo "$(date): System updated" >> /var/log/system-updates.log
```

---

## 8. 🚨 Security Monitoring Tools

### Install OSSEC (Host-based IDS):
```bash
# Download and install OSSEC
wget https://github.com/ossec/ossec-hids/archive/3.7.0.tar.gz
tar -xvzf 3.7.0.tar.gz
cd ossec-hids-3.7.0
sudo ./install.sh
```

### Install RKHunter (Rootkit detection):
```bash
sudo apt-get install rkhunter -y

# Update database
sudo rkhunter --update

# Run scan
sudo rkhunter --check --skip-keypress
```

### Install Lynis (Security auditing):
```bash
# Install Lynis
sudo apt-get install lynis -y

# Run audit
sudo lynis audit system

# Check score (target: 80+)
```

---

## 9. 📧 Security Alerts

### Email Notifications:
```bash
# Install mailutils
sudo apt-get install mailutils -y

# Configure email alerts for security events
# /etc/aliases
root: your-email@example.com

# Update aliases
sudo newaliases
```

### Monitoring Script:
```bash
#!/bin/bash
# /root/security-monitor.sh

# Check for failed login attempts
FAILED_LOGINS=$(grep "Failed password" /var/log/auth.log | wc -l)
if [ $FAILED_LOGINS -gt 10 ]; then
    echo "WARNING: $FAILED_LOGINS failed login attempts detected" | \
        mail -s "Security Alert: Failed Logins" your-email@example.com
fi

# Check for unauthorized access to payment webhook
WEBHOOK_BLOCKS=$(grep "SECURITY: Unauthorized IP" /var/log/greenpay/combined.log | wc -l)
if [ $WEBHOOK_BLOCKS -gt 0 ]; then
    echo "WARNING: $WEBHOOK_BLOCKS unauthorized webhook attempts" | \
        mail -s "Security Alert: Webhook Access" your-email@example.com
fi

# Check disk space
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "WARNING: Disk usage at $DISK_USAGE%" | \
        mail -s "Disk Space Alert" your-email@example.com
fi
```

### Cron Job:
```bash
# Run security monitor every hour
0 * * * * /root/security-monitor.sh
```

---

## 10. 📋 PCI-DSS Server Compliance Checklist

| Requirement | Status | Action |
|-------------|--------|--------|
| **1.1** Install firewall | [ ] | Configure UFW with DOKU IPs |
| **1.2** Restrict inbound traffic | [ ] | Allow only 80, 443, SSH |
| **2.1** Change vendor defaults | [ ] | No default passwords |
| **2.2** Disable unnecessary services | [ ] | Audit with `systemctl list-units` |
| **2.3** Encrypt non-console admin | [ ] | SSH keys only |
| **4.1** Use strong cryptography | [ ] | TLS 1.2+ only |
| **6.1** Security patches | [ ] | Enable unattended-upgrades |
| **8.1** Unique user IDs | [ ] | No shared accounts |
| **8.2** Strong authentication | [ ] | SSH keys + 2FA |
| **8.3** Multi-factor auth | [ ] | Google Authenticator for SSH |
| **10.1** Audit trails | [ ] | Enable auditd |
| **10.2** Audit logs | [ ] | Winston + logrotate |

---

## 11. 🔍 Pre-Deployment Security Audit

### Run Before BSP Testing:

```bash
# 1. SSL/TLS Test
testssl.sh https://greenpay.eywademo.cloud

# 2. Port Scan
nmap -sV greenpay.eywademo.cloud

# 3. Security Headers
curl -I https://greenpay.eywademo.cloud

# 4. Lynis Audit
sudo lynis audit system

# 5. Check for rootkits
sudo rkhunter --check

# 6. Verify firewall
sudo ufw status verbose

# 7. Check failed logins
sudo grep "Failed password" /var/log/auth.log | tail -20

# 8. Review open files
sudo lsof -i -P -n | grep LISTEN

# 9. Check process ownership
sudo ps aux | grep -E '(nginx|node|postgres)'

# 10. Verify file permissions
ls -la /var/www/greenpay/.env
ls -la /var/www/greenpay/backend/
```

---

## 12. 📞 Security Contacts

**For Server Security Issues:**
- System Administrator: your-admin@example.com
- Security Team: security@example.com
- BSP Bank: servicebsp@bsp.com.pg

**24/7 Monitoring:**
- Set up UptimeRobot or similar
- Configure PagerDuty alerts
- Monitor SSL certificate expiration

---

## 13. 🎯 Action Items

### Before BSP Testing:
- [ ] Review and apply all Nginx security headers
- [ ] Configure UFW firewall with DOKU IPs
- [ ] Enable Fail2Ban
- [ ] Harden SSH configuration
- [ ] Verify PostgreSQL is localhost-only
- [ ] Set up log rotation
- [ ] Install and configure auditd
- [ ] Enable automatic security updates
- [ ] Run Lynis security audit (target score: 80+)
- [ ] Test SSL configuration (target: A+ on SSL Labs)
- [ ] Set up security monitoring alerts
- [ ] Document incident response procedures

### Production Deployment:
- [ ] Switch to production DOKU IPs
- [ ] Enable rate limiting at Nginx level
- [ ] Set up database backup encryption
- [ ] Configure DDoS protection (Cloudflare)
- [ ] Enable Web Application Firewall (WAF)
- [ ] Set up 24/7 monitoring
- [ ] Complete PCI-DSS SAQ (Self-Assessment Questionnaire)

---

**Document Version:** 1.0
**Last Updated:** December 19, 2024
**Next Review:** Before production deployment
