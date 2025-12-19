#!/bin/bash

###############################################################################
# BSP DOKU Integration - Server Security Audit Script
#
# This script audits the server against BSP banking security requirements
# Server: greenpay.eywademo.cloud (165.22.52.100)
#
# Usage: Run this script ON THE SERVER:
#   ssh root@165.22.52.100
#   wget https://raw.githubusercontent.com/nnik2709/greenpay/main/server-security-audit.sh
#   chmod +x server-security-audit.sh
#   ./server-security-audit.sh > security-audit-report.txt
###############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
    echo ""
}

print_check() {
    echo -e "${BLUE}CHECK:${NC} $1"
}

print_pass() {
    echo -e "${GREEN}✓ PASS:${NC} $1"
}

print_fail() {
    echo -e "${RED}✗ FAIL:${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}⚠ WARN:${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ INFO:${NC} $1"
}

###############################################################################
# START AUDIT
###############################################################################

echo "=========================================="
echo "BSP DOKU Server Security Audit"
echo "=========================================="
echo "Date: $(date)"
echo "Server: $(hostname)"
echo "IP: $(hostname -I | awk '{print $1}')"
echo ""

###############################################################################
# 1. SSL/TLS CERTIFICATE CHECK
###############################################################################
print_header "1. SSL/TLS Certificate"

print_check "Checking SSL certificate..."
if command -v openssl &> /dev/null; then
    CERT_INFO=$(echo | openssl s_client -servername greenpay.eywademo.cloud -connect localhost:443 2>/dev/null | openssl x509 -noout -dates -subject -issuer 2>/dev/null)

    if [ -n "$CERT_INFO" ]; then
        print_pass "SSL certificate found"
        echo "$CERT_INFO"

        # Check expiry
        EXPIRY=$(echo | openssl s_client -servername greenpay.eywademo.cloud -connect localhost:443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
        EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$EXPIRY" +%s 2>/dev/null)
        NOW_EPOCH=$(date +%s)
        DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

        if [ $DAYS_LEFT -lt 30 ]; then
            print_warn "Certificate expires in $DAYS_LEFT days - renewal needed soon"
        else
            print_pass "Certificate valid for $DAYS_LEFT days"
        fi
    else
        print_fail "No SSL certificate found or unable to read"
    fi
else
    print_warn "openssl not installed - cannot check certificate"
fi

###############################################################################
# 2. NGINX CONFIGURATION
###############################################################################
print_header "2. Nginx Configuration"

print_check "Checking Nginx installation..."
if command -v nginx &> /dev/null; then
    print_pass "Nginx installed: $(nginx -v 2>&1)"

    print_check "Checking Nginx configuration files..."
    if [ -f /etc/nginx/sites-available/greenpay.conf ] || [ -f /etc/nginx/sites-available/greenpay ]; then
        print_pass "Nginx config file found"

        # Check for security headers
        print_check "Checking security headers in Nginx config..."
        NGINX_CONF=$(find /etc/nginx/sites-* -name "*greenpay*" 2>/dev/null | head -1)

        if [ -n "$NGINX_CONF" ]; then
            echo "Config file: $NGINX_CONF"

            if grep -q "Strict-Transport-Security" "$NGINX_CONF"; then
                print_pass "HSTS header configured"
            else
                print_fail "HSTS header missing"
            fi

            if grep -q "X-Frame-Options" "$NGINX_CONF"; then
                print_pass "X-Frame-Options configured"
            else
                print_fail "X-Frame-Options missing"
            fi

            if grep -q "X-Content-Type-Options" "$NGINX_CONF"; then
                print_pass "X-Content-Type-Options configured"
            else
                print_fail "X-Content-Type-Options missing"
            fi

            if grep -q "TLSv1.2\|TLSv1.3" "$NGINX_CONF"; then
                print_pass "TLS 1.2+ configured"
            else
                print_warn "Cannot verify TLS version in config"
            fi
        else
            print_warn "Could not find Nginx config file to check headers"
        fi
    else
        print_fail "Nginx config file not found"
    fi

    # Check if Nginx is running
    if systemctl is-active --quiet nginx; then
        print_pass "Nginx is running"
    else
        print_fail "Nginx is not running"
    fi
else
    print_fail "Nginx not installed"
fi

###############################################################################
# 3. FIREWALL STATUS (UFW)
###############################################################################
print_header "3. Firewall Configuration (UFW)"

print_check "Checking firewall status..."
if command -v ufw &> /dev/null; then
    print_pass "UFW installed"

    UFW_STATUS=$(ufw status 2>/dev/null | head -1)
    if echo "$UFW_STATUS" | grep -q "active"; then
        print_pass "Firewall is ACTIVE"
        echo ""
        echo "Firewall Rules:"
        ufw status numbered
        echo ""

        # Check for DOKU IPs
        print_check "Checking DOKU IP whitelisting..."
        if ufw status | grep -q "103.10.130.75"; then
            print_pass "DOKU Staging IP 1 (103.10.130.75) whitelisted"
        else
            print_fail "DOKU Staging IP 1 (103.10.130.75) NOT whitelisted"
        fi

        if ufw status | grep -q "147.139.130.145"; then
            print_pass "DOKU Staging IP 2 (147.139.130.145) whitelisted"
        else
            print_fail "DOKU Staging IP 2 (147.139.130.145) NOT whitelisted"
        fi
    else
        print_fail "Firewall is INACTIVE - CRITICAL SECURITY ISSUE"
    fi
else
    print_fail "UFW not installed"
fi

###############################################################################
# 4. OPEN PORTS CHECK
###############################################################################
print_header "4. Open Ports / Listening Services"

print_check "Checking listening ports..."
if command -v netstat &> /dev/null; then
    echo "Listening TCP ports:"
    netstat -tulpn | grep LISTEN | grep -v "127.0.0.1\|::1"
    echo ""

    # Check specific ports
    if netstat -tulpn | grep ":5432" | grep -v "127.0.0.1\|::1" &> /dev/null; then
        print_fail "PostgreSQL (5432) exposed to network - SECURITY RISK"
    else
        print_pass "PostgreSQL listening on localhost only"
    fi

    if netstat -tulpn | grep ":3001" | grep -v "127.0.0.1\|::1" &> /dev/null; then
        print_warn "Node.js backend (3001) might be exposed"
    else
        print_pass "Node.js backend on localhost only"
    fi

    if netstat -tulpn | grep ":443" &> /dev/null; then
        print_pass "HTTPS (443) listening"
    else
        print_warn "HTTPS (443) not listening"
    fi

    if netstat -tulpn | grep ":80" &> /dev/null; then
        print_pass "HTTP (80) listening"
    else
        print_warn "HTTP (80) not listening"
    fi
else
    print_warn "netstat not available, trying ss..."
    if command -v ss &> /dev/null; then
        echo "Listening TCP ports:"
        ss -tulpn | grep LISTEN | grep -v "127.0.0.1\|::1"
    else
        print_fail "Cannot check open ports - install net-tools or iproute2"
    fi
fi

###############################################################################
# 5. FAIL2BAN STATUS
###############################################################################
print_header "5. Fail2Ban (Intrusion Prevention)"

print_check "Checking Fail2Ban installation..."
if command -v fail2ban-client &> /dev/null; then
    print_pass "Fail2Ban installed"

    if systemctl is-active --quiet fail2ban; then
        print_pass "Fail2Ban is running"
        echo ""
        echo "Fail2Ban Status:"
        fail2ban-client status
        echo ""

        # Check SSH jail
        if fail2ban-client status sshd &> /dev/null; then
            print_pass "SSH jail active"
            echo ""
            fail2ban-client status sshd
        else
            print_warn "SSH jail not active"
        fi
    else
        print_fail "Fail2Ban installed but not running"
    fi
else
    print_fail "Fail2Ban not installed - recommended for banking applications"
fi

###############################################################################
# 6. SSH CONFIGURATION
###############################################################################
print_header "6. SSH Security Configuration"

print_check "Checking SSH configuration..."
if [ -f /etc/ssh/sshd_config ]; then
    SSHD_CONFIG="/etc/ssh/sshd_config"

    # Check root login
    if grep -q "^PermitRootLogin no" "$SSHD_CONFIG"; then
        print_pass "Root login disabled"
    elif grep -q "^PermitRootLogin yes" "$SSHD_CONFIG"; then
        print_fail "Root login ENABLED - security risk"
    else
        print_warn "Root login setting not explicitly configured"
    fi

    # Check password authentication
    if grep -q "^PasswordAuthentication no" "$SSHD_CONFIG"; then
        print_pass "Password authentication disabled (key-based only)"
    elif grep -q "^PasswordAuthentication yes" "$SSHD_CONFIG"; then
        print_warn "Password authentication enabled - consider key-based auth only"
    else
        print_info "Password authentication setting not explicitly configured"
    fi

    # Check SSH protocol
    if grep -q "^Protocol 2" "$SSHD_CONFIG"; then
        print_pass "SSH Protocol 2 enforced"
    else
        print_info "SSH Protocol not explicitly set (defaults to 2 in modern SSH)"
    fi
else
    print_fail "SSH config file not found"
fi

###############################################################################
# 7. POSTGRESQL SECURITY
###############################################################################
print_header "7. PostgreSQL Security"

print_check "Checking PostgreSQL installation..."
if command -v psql &> /dev/null; then
    print_pass "PostgreSQL installed: $(psql --version)"

    # Check if PostgreSQL is running
    if systemctl is-active --quiet postgresql; then
        print_pass "PostgreSQL is running"

        # Check listening address
        PG_CONF=$(find /etc/postgresql -name "postgresql.conf" 2>/dev/null | head -1)
        if [ -n "$PG_CONF" ]; then
            if grep -q "^listen_addresses.*'localhost'" "$PG_CONF"; then
                print_pass "PostgreSQL listening on localhost only"
            else
                print_warn "Check PostgreSQL listen_addresses configuration"
            fi
        fi
    else
        print_warn "PostgreSQL not running"
    fi
else
    print_warn "PostgreSQL client not found"
fi

###############################################################################
# 8. FILE PERMISSIONS
###############################################################################
print_header "8. Critical File Permissions"

print_check "Checking .env file permissions..."
ENV_FILES=$(find /var/www /home -name ".env" 2>/dev/null)

if [ -n "$ENV_FILES" ]; then
    for ENV_FILE in $ENV_FILES; do
        PERMS=$(stat -c %a "$ENV_FILE" 2>/dev/null || stat -f %A "$ENV_FILE" 2>/dev/null)
        echo "File: $ENV_FILE"
        echo "Permissions: $PERMS"

        if [ "$PERMS" = "600" ] || [ "$PERMS" = "400" ]; then
            print_pass "Secure permissions ($PERMS)"
        else
            print_fail "Insecure permissions ($PERMS) - should be 600 or 400"
        fi
        echo ""
    done
else
    print_warn "No .env files found"
fi

###############################################################################
# 9. SYSTEM UPDATES
###############################################################################
print_header "9. System Updates & Security Patches"

print_check "Checking for available updates..."
if command -v apt-get &> /dev/null; then
    apt-get update -qq 2>/dev/null
    UPDATES=$(apt-get -s upgrade | grep -P '^\d+ upgraded' | cut -d" " -f1)

    if [ "$UPDATES" = "0" ]; then
        print_pass "System is up to date"
    else
        print_warn "$UPDATES updates available"
    fi

    # Check for security updates
    SECURITY_UPDATES=$(apt-get -s upgrade | grep -i security | wc -l)
    if [ "$SECURITY_UPDATES" -gt 0 ]; then
        print_warn "$SECURITY_UPDATES security updates available - apply immediately"
    else
        print_pass "No pending security updates"
    fi

    # Check if unattended-upgrades is installed
    if dpkg -l | grep -q unattended-upgrades; then
        print_pass "Automatic security updates configured"
    else
        print_fail "Automatic security updates NOT configured"
    fi
fi

###############################################################################
# 10. PM2 / NODE.JS APPLICATION
###############################################################################
print_header "10. PM2 / Node.js Application"

print_check "Checking PM2 status..."
if command -v pm2 &> /dev/null; then
    print_pass "PM2 installed: $(pm2 --version)"

    echo ""
    echo "PM2 Applications:"
    pm2 list
    echo ""

    # Check for greenpay-api
    if pm2 list | grep -q "greenpay-api"; then
        if pm2 list | grep "greenpay-api" | grep -q "online"; then
            print_pass "greenpay-api is running"
        else
            print_fail "greenpay-api is NOT running"
        fi
    else
        print_warn "greenpay-api not found in PM2"
    fi
else
    print_fail "PM2 not installed"
fi

###############################################################################
# 11. DISK SPACE
###############################################################################
print_header "11. Disk Space"

print_check "Checking disk usage..."
df -h / | tail -1
echo ""

DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 70 ]; then
    print_pass "Disk usage: $DISK_USAGE% (healthy)"
elif [ "$DISK_USAGE" -lt 85 ]; then
    print_warn "Disk usage: $DISK_USAGE% (monitor)"
else
    print_fail "Disk usage: $DISK_USAGE% (critical - cleanup needed)"
fi

###############################################################################
# 12. SECURITY TOOLS
###############################################################################
print_header "12. Security Tools Installation"

# Check for various security tools
print_check "Checking security tools..."

if command -v rkhunter &> /dev/null; then
    print_pass "rkhunter installed (rootkit detection)"
else
    print_info "rkhunter not installed (recommended)"
fi

if command -v lynis &> /dev/null; then
    print_pass "Lynis installed (security auditing)"
else
    print_info "Lynis not installed (recommended for full audit)"
fi

if command -v auditd &> /dev/null; then
    print_pass "auditd installed (audit daemon)"
    if systemctl is-active --quiet auditd; then
        print_pass "auditd is running"
    else
        print_warn "auditd installed but not running"
    fi
else
    print_info "auditd not installed (recommended for PCI-DSS)"
fi

###############################################################################
# 13. RECENT SECURITY EVENTS
###############################################################################
print_header "13. Recent Security Events"

print_check "Checking for failed login attempts..."
if [ -f /var/log/auth.log ]; then
    FAILED_LOGINS=$(grep "Failed password" /var/log/auth.log | tail -5 | wc -l)
    if [ "$FAILED_LOGINS" -gt 0 ]; then
        print_warn "Recent failed login attempts found:"
        grep "Failed password" /var/log/auth.log | tail -5
    else
        print_pass "No recent failed login attempts"
    fi
else
    print_info "Auth log not found"
fi

echo ""
print_check "Checking for webhook security events..."
if [ -d /var/log/greenpay ]; then
    WEBHOOK_BLOCKS=$(grep "SECURITY" /var/log/greenpay/*.log 2>/dev/null | wc -l)
    if [ "$WEBHOOK_BLOCKS" -gt 0 ]; then
        print_warn "$WEBHOOK_BLOCKS webhook security events found"
        grep "SECURITY" /var/log/greenpay/*.log 2>/dev/null | tail -10
    else
        print_pass "No webhook security events"
    fi
else
    print_info "GreenPay logs not found"
fi

###############################################################################
# 14. SSL LABS TEST (if online)
###############################################################################
print_header "14. SSL Labs Test Recommendation"

print_info "Run SSL Labs test manually:"
echo "https://www.ssllabs.com/ssltest/analyze.html?d=greenpay.eywademo.cloud"
echo ""
print_info "Target: A+ rating"

###############################################################################
# SUMMARY
###############################################################################
print_header "AUDIT SUMMARY"

echo "Critical Issues to Address:"
echo "1. Ensure DOKU IPs are whitelisted in firewall"
echo "2. Verify all security headers in Nginx"
echo "3. Enable Fail2Ban if not running"
echo "4. Secure .env file permissions (chmod 600)"
echo "5. Apply pending security updates"
echo "6. Configure automatic security updates"
echo ""

echo "Recommended Actions:"
echo "1. Run full Lynis audit: sudo lynis audit system"
echo "2. Test SSL configuration on SSL Labs"
echo "3. Enable auditd for PCI-DSS compliance"
echo "4. Set up security monitoring alerts"
echo "5. Review Nginx security headers configuration"
echo ""

echo "For BSP Testing:"
echo "1. Add DOKU staging IPs to firewall:"
echo "   sudo ufw allow from 103.10.130.75 to any port 443 proto tcp"
echo "   sudo ufw allow from 147.139.130.145 to any port 443 proto tcp"
echo ""
echo "2. Verify webhook routes are accessible"
echo "3. Monitor logs during BSP testing"
echo ""

print_header "AUDIT COMPLETE"
echo "Report generated: $(date)"
echo "Next audit recommended: Weekly"
echo ""
