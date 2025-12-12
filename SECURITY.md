# Security Documentation - GreenPay Voucher System

## Overview
This document outlines the security measures implemented to protect the voucher validation and registration system from attacks.

## Threat Model

### Identified Threats
1. **Brute Force Enumeration** - Attackers trying thousands of voucher codes to find valid ones
2. **DDoS Attacks** - Overwhelming the API with requests to take it offline
3. **SQL Injection** - Injecting malicious SQL code through voucher codes or passport data
4. **XSS Attacks** - Cross-site scripting through user input fields
5. **Automated Scraping** - Bots harvesting voucher data
6. **Path Traversal** - Attempting to access unauthorized files
7. **Data Harvesting** - Collecting passport information from registered vouchers

## Security Measures Implemented

### 1. Rate Limiting (IP-based)

All public voucher endpoints are rate-limited per IP address:

#### Voucher Validation (`GET /api/vouchers/validate/:code`)
- **Limit**: 20 requests per 15 minutes
- **Purpose**: Prevents brute force guessing of voucher codes
- **Response**: HTTP 429 with retry-after header

#### Voucher Lookup (`GET /api/corporate-voucher-registration/voucher/:code`)
- **Limit**: 15 requests per 10 minutes
- **Purpose**: Prevents enumeration of corporate voucher codes
- **Response**: HTTP 429 with 10-minute lockout

#### Voucher Registration (`POST /api/corporate-voucher-registration/register`)
- **Limit**: 10 registrations per hour
- **Purpose**: Prevents mass registration attacks
- **Response**: HTTP 429 with 1-hour lockout

### 2. Suspicious Activity Detection

Middleware automatically blocks requests containing:

#### SQL Injection Patterns
```
- OR statements: "OR 1=1"
- UNION SELECT queries
- DROP TABLE commands
- INSERT INTO statements
```

#### XSS Patterns
```
- <script> tags
- javascript: protocols
- onerror= handlers
```

#### Path Traversal
```
- ../ sequences
- Attempts to access parent directories
```

#### Command Injection
```
- Shell metacharacters: ; & | ` $
```

**Response**: HTTP 403 Forbidden + Security alert logged

### 3. Input Validation

All inputs are validated before database queries:

```javascript
// Voucher codes
- Minimum length: 5 characters
- Maximum length: 50 characters
- Trimmed of whitespace
- No special characters allowed in certain fields

// Passport data
- Required fields: passport_number, surname, givenName
- Date validation for birth/expiry dates
- Nationality validation
```

### 4. Database Protection

```javascript
// All queries use parameterized statements
db.query('SELECT * FROM vouchers WHERE code = $1', [code]);

// NO string concatenation
❌ db.query(`SELECT * FROM vouchers WHERE code = '${code}'`);
```

### 5. Logging & Monitoring

All security events are logged:

```javascript
⚠️  Rate limit exceeded for IP: 192.168.1.1 on /api/vouchers/validate/TEST
🚨 SECURITY ALERT: Suspicious activity from IP: 10.0.0.5, Path: /api/vouchers/validate
⚠️  Registration rate limit exceeded for IP: 172.16.0.10
```

## Security Configuration

### Rate Limit Settings (`middleware/rateLimiter.js`)

```javascript
// Validation endpoint
windowMs: 15 * 60 * 1000,  // 15 minutes
max: 20,                    // 20 requests per window

// Registration endpoint
windowMs: 60 * 60 * 1000,   // 1 hour
max: 10,                     // 10 registrations

// Lookup endpoint
windowMs: 10 * 60 * 1000,   // 10 minutes
max: 15,                     // 15 lookups
```

### Adjusting Rate Limits

To modify rate limits, edit `middleware/rateLimiter.js`:

```javascript
// Example: Increase validation limit for high-traffic periods
const voucherValidationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Increased from 20 to 50
  ...
});
```

## Attack Response Procedures

### If Rate Limiting is Triggered

1. **Check logs** for the source IP:
   ```bash
   pm2 logs greenpay-backend | grep "Rate limit"
   ```

2. **Analyze patterns**:
   - Is it a legitimate user or automated attack?
   - Is the IP making sequential or random requests?

3. **Action**:
   - Legitimate user: Contact them to explain rate limits
   - Attacker: Consider IP ban at firewall level

### If Suspicious Activity Detected

1. **Review security alert**:
   ```bash
   pm2 logs greenpay-backend | grep "SECURITY ALERT"
   ```

2. **Check request details** (logged with alert):
   - IP address
   - Request path
   - Query parameters
   - Request body

3. **Action**:
   - Serious threat: Block IP at firewall
   - Add to blacklist if persistent

### If DDoS Attack Suspected

1. **Symptoms**:
   - High CPU/memory usage
   - Many rate limit errors
   - Slow response times

2. **Immediate action**:
   ```bash
   # Check active connections
   netstat -an | grep :3001 | wc -l

   # Restart service if overwhelmed
   pm2 restart greenpay-backend
   ```

3. **Enable firewall-level protection**:
   - Use fail2ban
   - Configure iptables rules
   - Enable Cloudflare DDoS protection

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Rate Limit Hits**
   ```bash
   pm2 logs greenpay-backend | grep "Rate limit" | wc -l
   ```

2. **Security Alerts**
   ```bash
   pm2 logs greenpay-backend | grep "SECURITY ALERT" | wc -l
   ```

3. **Failed Validations**
   ```bash
   pm2 logs greenpay-backend | grep "Voucher code not found" | wc -l
   ```

### Recommended Alerts

Set up alerts for:
- More than 10 rate limit hits per hour
- Any security alerts (SQL injection, XSS attempts)
- More than 100 failed validations per hour
- Unusual traffic spikes (>5x normal)

## Database Security Queries

### Find Suspicious Registration Patterns

```sql
-- Multiple registrations from same passport
SELECT passport_number, COUNT(*) as voucher_count
FROM corporate_vouchers
WHERE passport_number IS NOT NULL
GROUP BY passport_number
HAVING COUNT(*) > 5
ORDER BY voucher_count DESC;

-- Rapid registrations (potential automation)
SELECT
  DATE_TRUNC('hour', registered_at) as hour,
  COUNT(*) as registrations
FROM corporate_vouchers
WHERE registered_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
HAVING COUNT(*) > 20
ORDER BY hour DESC;

-- Failed lookup attempts (not logged in DB, check app logs)
```

### Audit Trail

```sql
-- View recent registrations
SELECT
  voucher_code,
  passport_number,
  registered_at,
  registered_by
FROM corporate_vouchers
WHERE registered_at IS NOT NULL
ORDER BY registered_at DESC
LIMIT 50;

-- Check voucher status distribution
SELECT status, COUNT(*) as count
FROM corporate_vouchers
GROUP BY status;
```

## Best Practices

### For Developers

1. **Never disable rate limiting** in production
2. **Always use parameterized queries** for SQL
3. **Validate all user input** before processing
4. **Log security events** with sufficient detail
5. **Test with malicious input** during development

### For Administrators

1. **Monitor logs regularly** for suspicious activity
2. **Keep rate limits tuned** to balance security and usability
3. **Update dependencies** to patch security vulnerabilities
4. **Use HTTPS only** for all API endpoints
5. **Implement IP whitelisting** for admin endpoints

### For Corporate Customers

1. **Keep voucher codes confidential**
2. **Report lost voucher codes immediately**
3. **Use unique passport data** (don't share registrations)
4. **Verify voucher details** before registration
5. **Contact support** if rate limited legitimately

## Incident Response

### Security Incident Workflow

1. **Detection**: Monitor alerts and logs
2. **Analysis**: Identify attack type and source
3. **Containment**: Block IP, rate limit, or disable endpoint
4. **Eradication**: Remove malicious data, fix vulnerability
5. **Recovery**: Restore service, notify affected users
6. **Lessons**: Update security measures, document incident

### Contact Information

**Security Issues**: Report to [SECURITY_EMAIL]
**DDoS Attacks**: Contact hosting provider
**Data Breach**: Follow data breach protocol
**Vulnerability Disclosure**: [SECURITY_CONTACT]

## Testing Security Measures

### Manual Testing

```bash
# Test rate limiting
for i in {1..25}; do
  curl http://localhost:3001/api/vouchers/validate/TEST$i
  echo "Request $i"
done

# Expected: First 20 succeed, next 5 return 429

# Test SQL injection detection
curl http://localhost:3001/api/vouchers/validate/"TEST' OR '1'='1"

# Expected: HTTP 403 Forbidden

# Test XSS detection
curl -X POST http://localhost:3001/api/corporate-voucher-registration/register \
  -H "Content-Type: application/json" \
  -d '{"voucherCode":"TEST","passportNumber":"<script>alert(1)</script>"}'

# Expected: HTTP 403 Forbidden
```

### Automated Testing

```javascript
// security.test.js
describe('Rate Limiting', () => {
  it('should block after 20 validation requests', async () => {
    for (let i = 0; i < 21; i++) {
      const res = await request(app).get(`/api/vouchers/validate/TEST${i}`);
      if (i < 20) expect(res.status).not.toBe(429);
      else expect(res.status).toBe(429);
    }
  });
});

describe('SQL Injection Protection', () => {
  it('should block SQL injection attempts', async () => {
    const res = await request(app).get('/api/vouchers/validate/TEST OR 1=1');
    expect(res.status).toBe(403);
  });
});
```

## Compliance & Regulations

- **GDPR**: Rate limiting helps prevent data harvesting
- **PCI DSS**: Not applicable (no card data stored)
- **OWASP Top 10**: Mitigates injection, broken access control, security misconfiguration
- **PNG Data Protection**: Ensures passport data is not mass-extractable

## Future Enhancements

### Planned Security Features

1. **CAPTCHA** for registration form (prevent bots)
2. **IP Geolocation** blocking (restrict to PNG only)
3. **JWT tokens** for authenticated users (avoid rate limits)
4. **Anomaly detection** (machine learning for suspicious patterns)
5. **WAF integration** (Web Application Firewall)
6. **Honeypot fields** (detect automated form submissions)

### Security Roadmap

- Q1 2026: Implement CAPTCHA
- Q2 2026: Add IP geolocation
- Q3 2026: Deploy WAF
- Q4 2026: ML-based anomaly detection

---

**Last Updated**: December 12, 2025
**Version**: 1.0
**Maintainer**: GreenPay Security Team
