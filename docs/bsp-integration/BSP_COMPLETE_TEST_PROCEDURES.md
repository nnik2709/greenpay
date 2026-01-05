# BSP DOKU Complete Test Procedures - Phases 2-10

**Date:** 2025-12-31
**Purpose:** Comprehensive testing procedures (automated + manual) for production readiness
**Status:** Ready to execute

---

## Test Execution Guide

**Automated Tests:** Run using scripts in `scripts/` directory
**Manual Tests:** Follow step-by-step procedures below
**Database Tests:** Run SQL queries on production database
**Playwright Tests:** Located in `tests/bsp-payment/`

---

# PHASE 2: Security Testing (AUTOMATED + MANUAL)

## 2.1 Webhook Security Tests - AUTOMATED ✅

**Script:** `scripts/test-webhook-security.sh`

**Execute:**
```bash
cd /Users/nikolay/github/greenpay
./scripts/test-webhook-security.sh
```

**Tests Included:**
- ✅ Test 1: Invalid WORDS signature → Expects "STOP"
- ✅ Test 2: Missing WORDS field → Expects "STOP"
- ✅ Test 3: Empty WORDS field → Expects "STOP"
- ✅ Test 4: SQL injection attempt → Expects safe handling
- ✅ Test 5: XSS attempt → Expects escaping
- ✅ Test 6: Malformed JSON → Expects "STOP" or empty response

**Verify Results:**
```bash
# Check PM2 logs for security warnings
ssh root@165.22.52.100 'pm2 logs greenpay-api --lines 100 | grep -E "STOP|signature|security"'

# Verify database integrity (no changes from test webhooks)
ssh root@165.22.52.100 'PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay -d greenpay -c "
SELECT COUNT(*) FROM individual_purchases
WHERE voucher_code LIKE \"%TEST%\" OR voucher_code LIKE \"%SECURITY%\";"'
```

**Expected Results:**
- All tests should return "STOP" for invalid signatures
- No vouchers created from malicious webhooks
- Security warnings logged in PM2

---

## 2.2 Replay Attack Test - MANUAL

**Objective:** Verify duplicate webhooks don't create duplicate vouchers

**Procedure:**

1. **Capture Successful Webhook:**
```bash
# Monitor PM2 logs during a test payment
ssh root@165.22.52.100 'pm2 logs greenpay-api --lines 50 | grep "DOKU WEBHOOK"'

# Copy the webhook payload when you see it
# Look for lines like:
# [DOKU WEBHOOK] Received: {...}
```

2. **Create Test Script:**
```bash
cat > test-replay-attack.sh << 'EOF'
#!/bin/bash
# Replace {...} with actual webhook payload from step 1
WEBHOOK_PAYLOAD='{
  "MALLID": "11170",
  "CHAINMERCHANT": "NA",
  "AMOUNT": "5000",
  "TRANSIDMERCHANT": "PGKO-1234567890-ACTUAL_SESSION_ID",
  "RESULTCODE": "0000",
  "WORDS": "ACTUAL_SIGNATURE_FROM_LOG",
  "RESPONSECODE": "0000",
  "APPROVALCODE": "ACTUAL_APPROVAL",
  "PAYMENTCHANNEL": "02",
  "PAYMENTCODE": ""
}'

echo "Sending first webhook..."
curl -X POST https://greenpay.eywademo.cloud/api/payment-webhook-doku \
  -H "Content-Type: application/json" \
  -d "${WEBHOOK_PAYLOAD}"

echo ""
echo "Waiting 10 seconds..."
sleep 10

echo "Sending duplicate webhook..."
curl -X POST https://greenpay.eywademo.cloud/api/payment-webhook-doku \
  -H "Content-Type: application/json" \
  -d "${WEBHOOK_PAYLOAD}"
EOF

chmod +x test-replay-attack.sh
./test-replay-attack.sh
```

3. **Verify in Database:**
```sql
-- Check for duplicate vouchers with same session_id
SELECT session_id, COUNT(*) as voucher_count,
       STRING_AGG(voucher_code, ', ') as vouchers
FROM individual_purchases ip
JOIN purchase_sessions ps ON ps.id = ip.purchase_session_id
WHERE ps.reference_number = 'PGKO-1234567890-ACTUAL_SESSION_ID'
GROUP BY session_id
HAVING COUNT(*) > 1;

-- Should return 0 rows (no duplicates)
```

**Expected Results:**
- Second webhook processes without error
- Only ONE voucher created
- PM2 logs show duplicate webhook detected
- Response is "CONTINUE" (idempotent)

---

## 2.3 IP Whitelist Test - MANUAL (Production Only)

**⚠️ NOTE:** Only applies when `BSP_DOKU_MODE=production`

**Setup Required:**
```javascript
// Add to backend/routes/payment-webhook-doku.js (if not already there)

const BSP_PRODUCTION_IPS = [
  // Get these from BSP
  '203.128.xx.xx',
  '203.128.yy.yy'
];

router.post('/payment-webhook-doku', (req, res, next) => {
  const mode = process.env.BSP_DOKU_MODE || 'test';

  if (mode === 'production') {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (!BSP_PRODUCTION_IPS.includes(clientIP)) {
      console.error(`[SECURITY] Unauthorized webhook from IP: ${clientIP}`);
      return res.send('STOP');
    }
  }

  next();
});
```

**Test Procedure:**
```bash
# Test from your laptop (should be rejected in production mode)
curl -X POST https://greenpay.eywademo.cloud/api/payment-webhook-doku \
  -H "Content-Type: application/json" \
  -d '{"MALLID": "PROD_MALL_ID", "TRANSIDMERCHANT": "TEST", "RESULTCODE": "0000"}'

# Expected: STOP (if in production mode)
# Expected: Processes normally (if in test mode)
```

**Verify:**
```bash
# Check PM2 logs for security warning
ssh root@165.22.52.100 'pm2 logs greenpay-api --lines 50 | grep "Unauthorized webhook"'
```

---

# PHASE 3: Performance Testing

## 3.1 Database Query Performance - MANUAL SQL

**Execute on Production Database:**

```sql
-- Test 1: Voucher lookup by code (should use index)
EXPLAIN ANALYZE
SELECT * FROM individual_purchases
WHERE voucher_code = 'WJK84Z0Y';
-- Expected: Index Scan on individual_purchases_voucher_code_idx
-- Execution time: < 5ms

-- Test 2: Passport lookup (should use index)
EXPLAIN ANALYZE
SELECT * FROM passports
WHERE passport_number = 'TEST123456';
-- Expected: Index Scan on passports_passport_number_idx
-- Execution time: < 5ms

-- Test 3: Session lookup (should use index)
EXPLAIN ANALYZE
SELECT * FROM payment_gateway_transactions
WHERE session_id = 'PGKO-1767190923769-TEST';
-- Expected: Index Scan on payment_gateway_transactions_session_id_idx
-- Execution time: < 5ms

-- Test 4: Recent transactions (should be fast)
EXPLAIN ANALYZE
SELECT * FROM individual_purchases
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 100;
-- Expected: Index Scan or Bitmap Index Scan
-- Execution time: < 50ms
```

**Performance Criteria:**
- ✅ All queries use indexes (no Sequential Scan)
- ✅ Execution times under threshold
- ✅ No table locks or blocking queries

---

## 3.2 Webhook Response Time Test - AUTOMATED (Already Passing)

**Evidence from Tests:**
```
✅ Voucher found in 801ms (Test 1.1)
✅ Voucher found in 810ms (Test 1.2)
✅ Voucher found in 806ms (Test 1.3)
✅ Voucher found in 800ms (Test 1.4)
✅ Voucher found in 812ms (Test 1.5)
✅ Voucher found in 801ms (Test 1.6)
```

**Target:** < 2 seconds from payment to voucher creation
**Actual:** ~800ms average ✅ EXCELLENT

---

## 3.3 Load Testing - MANUAL (Optional - Use K6 or Artillery)

**Simple Load Test Script (using K6):**

```bash
# Install K6 (if not installed)
brew install k6  # macOS
# or download from https://k6.io/

# Create load test script
cat > load-test-bsp.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 10 },  // Ramp up to 10 users
    { duration: '3m', target: 10 },  // Stay at 10 users
    { duration: '1m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
  },
};

export default function () {
  // Simulate browsing buy-online page
  let res = http.get('https://greenpay.eywademo.cloud/buy-online');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(3); // User think time
}
EOF

# Run load test
k6 run load-test-bsp.js
```

**⚠️ WARNING:** Do not run load tests against BSP staging without coordination!

**Alternative:** Monitor performance during real usage in first week

---

# PHASE 4: Reliability Testing

## 4.1 Network Resilience - MANUAL

### Test 1: Slow Network Simulation

**Using Chrome DevTools:**
```
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Set throttling to "Slow 3G"
4. Complete full payment flow
5. Monitor for timeouts or errors
```

**Expected Behavior:**
- Payment completes (may take longer)
- No timeout errors
- Webhook still processes within limits
- User sees loading indicators

---

### Test 2: Payment Abandonment

**Procedure:**
```
1. Start payment flow
2. Fill passport details
3. Click "Pay with Credit Card"
4. On BSP page, close browser tab immediately
5. Wait 5 minutes
6. Check database for orphaned session
```

**Database Check:**
```sql
SELECT session_id, status, created_at,
       NOW() - created_at as age
FROM payment_gateway_transactions
WHERE status = 'pending'
AND created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;
```

**Expected Results:**
- Session exists with status='pending'
- No voucher created
- No emails sent

**Cleanup Query (for old abandoned sessions):**
```sql
-- Mark abandoned sessions (> 2 hours old, still pending)
UPDATE payment_gateway_transactions
SET status = 'abandoned', updated_at = NOW()
WHERE status = 'pending'
AND created_at < NOW() - INTERVAL '2 hours';
```

---

## 4.2 Data Integrity Tests - DATABASE

**Test 1: Referential Integrity**

```sql
-- Check orphaned purchases (passport doesn't exist)
SELECT COUNT(*) as orphaned_purchases
FROM individual_purchases ip
WHERE NOT EXISTS (
  SELECT 1 FROM passports p
  WHERE p.passport_number = ip.passport_number
);
-- Expected: 0

-- Check orphaned sessions (no voucher for completed payment)
SELECT COUNT(*) as orphaned_sessions
FROM purchase_sessions ps
WHERE payment_status = 'completed'
AND NOT EXISTS (
  SELECT 1 FROM individual_purchases ip
  WHERE ip.purchase_session_id = ps.id
);
-- Expected: 0

-- Check mismatched transaction statuses
SELECT COUNT(*) as status_mismatches
FROM payment_gateway_transactions pgt
WHERE status = 'completed'
AND NOT EXISTS (
  SELECT 1 FROM individual_purchases ip
  JOIN purchase_sessions ps ON ps.id = ip.purchase_session_id
  WHERE ps.reference_number LIKE '%' || pgt.session_id || '%'
);
-- Expected: 0
```

**Test 2: Duplicate Prevention**

```sql
-- Check for duplicate voucher codes
SELECT voucher_code, COUNT(*) as count
FROM individual_purchases
GROUP BY voucher_code
HAVING COUNT(*) > 1;
-- Expected: 0 rows

-- Check for duplicate session IDs
SELECT session_id, COUNT(*) as count
FROM payment_gateway_transactions
GROUP BY session_id
HAVING COUNT(*) > 1;
-- Expected: 0 rows
```

---

# PHASE 5: PNG-Specific Testing

## 5.1 Currency Testing - AUTOMATED (Already Passing)

**Evidence:**
- All payments used PGK 50.00 successfully
- BSP receives currency code 598 (PGK)
- Database stores correct amounts

**Manual Verification:**
```sql
-- Check currency consistency
SELECT DISTINCT amount, currency_code
FROM individual_purchases
ORDER BY created_at DESC
LIMIT 10;
-- Should show: 50.00, PGK (or null if not stored)
```

---

## 5.2 PNG Network Testing - MANUAL

### Test on Slow Connection

**Simulate PNG 3G Network:**

**Method 1: Chrome DevTools**
```
1. Open DevTools → Network tab
2. Set throttling to "Slow 3G" (400ms RTT, 400kbps down, 400kbps up)
3. Complete full payment flow
4. Verify all works (just slower)
```

**Method 2: Network Link Conditioner (macOS)**
```
1. Download Network Link Conditioner from Apple
2. Set profile to "3G" or "Very Bad Network"
3. Test payment flow
4. Monitor for timeouts
```

**Expected Results:**
- ✅ Payment completes (may take 5-10 minutes)
- ✅ No timeout errors
- ✅ Progress indicators show
- ✅ Voucher created successfully

---

## 5.3 Mobile Device Testing - MANUAL

**Devices to Test:**
- iPhone (Safari)
- Android (Chrome)
- Tablet (iPad/Android)

**Test Procedure:**
```
1. Open https://greenpay.eywademo.cloud/buy-online on mobile
2. Fill passport form
3. Click "Pay with Credit Card"
4. Complete BSP payment on mobile
5. Verify responsive design
6. Check voucher PDF downloads
```

**Checklist:**
- [ ] Form fields accessible on mobile
- [ ] Text readable without zoom
- [ ] Buttons large enough to tap
- [ ] BSP payment page works on mobile
- [ ] Success page responsive
- [ ] PDF downloads/opens correctly
- [ ] Email arrives on mobile device

---

## 5.4 PNG Time Zone Test - MANUAL

**Verify PNG Time (UTC+10):**

```sql
-- Check if timestamps are correct for PNG
SELECT
  voucher_code,
  created_at,
  created_at AT TIME ZONE 'Pacific/Port_Moresby' as png_time,
  EXTRACT(HOUR FROM created_at AT TIME ZONE 'Pacific/Port_Moresby') as png_hour
FROM individual_purchases
ORDER BY created_at DESC
LIMIT 5;

-- Verify valid_from/valid_until dates
SELECT
  voucher_code,
  valid_from,
  valid_until,
  valid_until - valid_from as validity_period
FROM individual_purchases
ORDER BY created_at DESC
LIMIT 5;
-- Should show 1 year validity
```

---

# PHASE 6: User Experience Testing

## 6.1 Customer Journey Test - MANUAL

**Full End-to-End User Flow:**

**Time Target:** < 5 minutes total

**Procedure:**
```
START TIMER

Step 1: Navigate (15 seconds)
- Go to https://greenpay.eywademo.cloud/buy-online
- Page loads

Step 2: Fill Passport Form (60 seconds)
- Passport Number: TEST-UX-001
- Surname: Customer
- Given Name: Test
- Email: [your-email]@gmail.com
- Click "Pay with Credit Card"

Step 3: BSP Payment (120 seconds)
- Wait for BSP page load
- Fill card: 4889750100103462
- Expiry: 04/27
- CVV: 921
- Phone: 71234567
- Click Pay
- Wait for OTP page
- Enter OTP from page
- Submit

Step 4: Success Page (30 seconds)
- Wait for redirect
- See voucher code
- Click "Download PDF"
- PDF downloads

Step 5: Email (60 seconds)
- Wait for email
- Open email
- Click voucher link
- Verify PDF attachment

STOP TIMER

Expected Total Time: 4-5 minutes
```

**Document Results:**
```
Total Time: _____ minutes
Issues Found:
- [ ] None
- [ ] Slow loading: _____
- [ ] Confusing UI: _____
- [ ] Error messages: _____
```

---

## 6.2 Mobile Experience Test - MANUAL

**Test on Multiple Devices:**

| Device | OS | Browser | Result | Issues |
|--------|----|---------| -------|--------|
| iPhone 12 | iOS 17 | Safari | ⏸️ | |
| Samsung Galaxy | Android 13 | Chrome | ⏸️ | |
| iPad | iPadOS 17 | Safari | ⏸️ | |

**Specific Mobile Checks:**
- [ ] Passport form scrolls properly
- [ ] Keyboard doesn't hide fields
- [ ] Date picker works on mobile
- [ ] Email input shows email keyboard
- [ ] BSP page renders correctly
- [ ] OTP easy to see and copy
- [ ] Success page shows voucher clearly
- [ ] PDF opens in mobile browser
- [ ] Share button works (if available)

---

## 6.3 Email Delivery Test - MANUAL

**Test Different Email Providers:**

| Email Provider | Address | Received? | In Spam? | Time to Arrive |
|----------------|---------|-----------|----------|----------------|
| Gmail | test@gmail.com | ⏸️ | ⏸️ | ___ seconds |
| Outlook | test@outlook.com | ⏸️ | ⏸️ | ___ seconds |
| Yahoo | test@yahoo.com | ⏸️ | ⏸️ | ___ seconds |
| Corporate | test@company.com | ⏸️ | ⏸️ | ___ seconds |

**Email Content Checks:**
- [ ] Subject line clear and professional
- [ ] Voucher code visible in email body
- [ ] PDF attachment present
- [ ] PDF attachment opens correctly
- [ ] Links work (if any)
- [ ] Images display (if any)
- [ ] Mobile-friendly format
- [ ] No broken formatting

**Spam Score Check:**
```
1. Forward email to: mail-tester.com
2. Get spam score
3. Target: 8/10 or higher
4. Fix issues if score low
```

---

# PHASE 7: Integration Testing

## 7.1 BSP Integration Verification - MANUAL

**Coordinate with BSP for Official Test:**

**Pre-Test Checklist:**
```
Contact BSP:
- [ ] Email sent to servicebsp@bsp.com.pg
- [ ] Test date/time scheduled (PNG business hours)
- [ ] BSP contact person assigned
- [ ] Both parties ready to monitor
```

**Test Execution:**
```
1. BSP Monitoring:
   - BSP watches their payment gateway logs
   - BSP watches webhook delivery
   - BSP confirms amounts and currency

2. Your Monitoring:
   ssh root@165.22.52.100 'pm2 logs greenpay-api --lines 100 -f'
   - Watch for webhook arrival
   - Watch for voucher creation
   - Watch for email sending

3. Make Test Payment:
   - Use BSP test card
   - Amount: PGK 50.00
   - Complete full flow

4. Verification:
   - BSP confirms payment received
   - BSP confirms webhook sent
   - You confirm webhook received within 2 seconds
   - You confirm voucher created
   - You confirm email sent
```

**Sign-Off Form:**
```
BSP INTEGRATION TEST SIGN-OFF

Date: _____________
Time: _____________ (PNG Time)

BSP Confirmation:
[ ] Payment received: PGK 50.00
[ ] Webhook sent successfully
[ ] Transaction ID: _____________

Your Confirmation:
[ ] Webhook received within 2 seconds
[ ] Voucher created: _____________
[ ] Email sent successfully
[ ] No errors in logs

BSP Representative: _____________ Signature: _______
Your Representative: _____________ Signature: _______

INTEGRATION APPROVED: YES / NO
```

---

## 7.2 BSP Error Code Testing - MANUAL

**Get Complete Error Code List from BSP:**

**Common BSP Error Codes:**

| Code | Meaning | Test Procedure |
|------|---------|----------------|
| 0000 | Success | ✅ Already tested (all vouchers created) |
| 5501 | Transaction Failed | Need BSP test card |
| 5511 | Transaction Pending | Monitor extended processing |
| 5001 | Insufficient Funds | Need BSP test card |
| 5002 | Invalid Card | Test with wrong card format |
| 5003 | Expired Card | Test with expired date |

**Request from BSP:**
```
Dear BSP Team,

Please provide:
1. Complete list of RESULTCODE values
2. Meaning of each code
3. Test cards for each error scenario (if available)
4. Expected system behavior for each code

Current handling:
- 0000: Create voucher and send email ✅
- Non-0000: Mark as failed, no voucher ✅

We want to ensure proper handling of all possible codes.
```

---

# PHASE 8: Monitoring & Logging

## 8.1 Log Verification - AUTOMATED (Already Passing)

**Evidence from Tests:**
```
✅ Payment session created (logged)
✅ Webhook received (logged with full payload)
✅ Signature verified (logged)
✅ Transaction updated (logged)
✅ Voucher created (logged with code)
✅ Email sent (logged with message ID)
```

**Manual Verification:**
```bash
# Check audit trail for recent payment
ssh root@165.22.52.100 'pm2 logs greenpay-api --lines 500 | grep "PGKO-1767190923769"'

# Should see complete flow:
# 1. Session created
# 2. Webhook received
# 3. Signature verified
# 4. Voucher created
# 5. Email sent
```

---

## 8.2 Error Logging Test - MANUAL

**Trigger Various Errors and Verify Logging:**

```bash
# Test 1: Invalid webhook (check error logged)
curl -X POST https://greenpay.eywademo.cloud/api/payment-webhook-doku \
  -H "Content-Type: application/json" \
  -d '{"MALLID": "11170", "WORDS": "INVALID"}'

# Check logs
ssh root@165.22.52.100 'pm2 logs greenpay-api --lines 50 --err'

# Test 2: Database error simulation (check stack trace)
# Temporarily break database connection, trigger webhook, restore

# Test 3: Email sending failure
# Use invalid SMTP credentials temporarily, check error logged
```

**Verify:**
- [ ] All errors logged with timestamps
- [ ] Stack traces captured for debugging
- [ ] No sensitive data in logs (no card numbers, full passwords)
- [ ] Error severity levels appropriate (ERROR, WARN, INFO)

---

## 8.3 PM2 Monitoring Setup - SERVER CONFIGURATION

**Execute on Server:**

```bash
ssh root@165.22.52.100

# 1. Check PM2 status
pm2 status
pm2 describe greenpay-api

# 2. Enable PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true

# 3. Set up PM2 startup script (auto-restart on reboot)
pm2 startup
# Follow the command it provides

# 4. Save PM2 configuration
pm2 save

# 5. Monitor resources in real-time
pm2 monit
# Press Ctrl+C to exit

# 6. Check memory/CPU usage
pm2 show greenpay-api
```

**Create Monitoring Alert Script:**

```bash
cat > /root/greenpay-backups/check-pm2-health.sh << 'EOF'
#!/bin/bash
# PM2 Health Check Script
# Run via cron every 5 minutes

APP_NAME="greenpay-api"

# Check if app is running
STATUS=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status")

if [ "$STATUS" != "online" ]; then
  echo "[$(date)] ERROR: $APP_NAME is $STATUS" >> /root/greenpay-backups/health.log
  pm2 restart $APP_NAME
  echo "[$(date)] Restarted $APP_NAME" >> /root/greenpay-backups/health.log
fi

# Check memory usage (restart if over 1GB)
MEMORY=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .monit.memory")
MAX_MEMORY=1073741824  # 1GB in bytes

if [ "$MEMORY" -gt "$MAX_MEMORY" ]; then
  echo "[$(date)] WARNING: High memory usage: $MEMORY bytes" >> /root/greenpay-backups/health.log
  pm2 restart $APP_NAME
fi
EOF

chmod +x /root/greenpay-backups/check-pm2-health.sh

# Add to cron (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /root/greenpay-backups/check-pm2-health.sh") | crontab -
```

---

# PHASE 9: Production Readiness

## 9.1 Environment Configuration - MANUAL

**See:** `BSP_CRITICAL_PRODUCTION_READINESS.md` (already created)

**Quick Checklist:**
- [ ] Production .env variables configured
- [ ] SSL certificate valid (> 30 days)
- [ ] Webhook URL accessible from BSP IPs
- [ ] Database backups configured (cron job)
- [ ] PM2 auto-restart enabled
- [ ] Log rotation configured
- [ ] IP whitelist enabled (production mode)

---

## 9.2 Security Hardening Checklist - SERVER

```bash
ssh root@165.22.52.100

# 1. Firewall check
ufw status
# Should show: 80/tcp, 443/tcp ALLOW, everything else DENY

# 2. Database not exposed to internet
netstat -tuln | grep 5432
# Should show: 127.0.0.1:5432 or ::1:5432 (localhost only)

# 3. Check for security updates
apt update
apt list --upgradable

# 4. Verify SSL
curl -vI https://greenpay.eywademo.cloud 2>&1 | grep -E "SSL|TLS"

# 5. Check file permissions
ls -la /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env
# Should be: -rw------- (600) - readable only by owner
```

---

# PHASE 10: User Acceptance Testing (UAT)

## 10.1 Counter Agent Workflow Test - MANUAL

**Participants:** Real counter agent staff

**Procedure:**
```
Scenario: Customer walks in to purchase green fee voucher

Step 1: Greet Customer
- Counter agent opens: https://greenpay.eywademo.cloud/buy-online
- Asks customer for passport

Step 2: Data Entry (< 2 minutes)
- Enter passport details from physical passport
- Enter customer email address
- Click "Pay with Credit Card"

Step 3: Payment Processing (< 3 minutes)
- BSP page loads
- Enter payment card details (customer provides)
- Complete OTP verification
- Wait for success page

Step 4: Deliver Voucher (< 1 minute)
- Success page shows voucher code
- Click "Download PDF"
- Print voucher for customer
- Hand to customer

Step 5: Confirmation
- Customer receives voucher
- Email sent to customer's address
- Total time: < 5 minutes

FEEDBACK FORM:
Was the process clear? YES / NO
Any confusing steps? _____
Technical issues? _____
Suggestions for improvement? _____
```

---

## 10.2 Finance Manager Review - MANUAL

**Participants:** Finance Manager

**Procedure:**
```
Step 1: Database Access
- SSH to server or use database client
- Connect to greenpay database

Step 2: Review Transactions (Last 24 hours)
SELECT
  pgt.session_id,
  pgt.amount / 100.0 as amount_pgk,
  pgt.status,
  pgt.created_at,
  ip.voucher_code
FROM payment_gateway_transactions pgt
LEFT JOIN purchase_sessions ps ON ps.reference_number LIKE '%' || pgt.session_id || '%'
LEFT JOIN individual_purchases ip ON ip.purchase_session_id = ps.id
WHERE pgt.created_at > NOW() - INTERVAL '24 hours'
ORDER BY pgt.created_at DESC;

Step 3: Reconciliation
- Count total transactions
- Sum total amounts
- Verify all successful payments have vouchers
- Check for any failed/abandoned payments

Step 4: BSP Statement Comparison
- Download BSP daily settlement report
- Compare transaction IDs
- Compare amounts
- Verify all match

CHECKLIST:
[ ] All transactions accounted for
[ ] Amounts match BSP statement
[ ] No missing vouchers
[ ] Failed payments properly recorded
[ ] Ready to approve for production
```

---

## 10.3 BSP Settlement Reconciliation - MANUAL

**Daily Reconciliation Procedure:**

```sql
-- Daily Settlement Report
SELECT
  DATE(pgt.created_at) as transaction_date,
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN pgt.status = 'completed' THEN 1 END) as successful,
  COUNT(CASE WHEN pgt.status = 'failed' THEN 1 END) as failed,
  COUNT(CASE WHEN pgt.status = 'pending' THEN 1 END) as pending,
  SUM(CASE WHEN pgt.status = 'completed' THEN pgt.amount ELSE 0 END) / 100.0 as total_amount_pgk
FROM payment_gateway_transactions pgt
WHERE DATE(pgt.created_at) = CURRENT_DATE
GROUP BY DATE(pgt.created_at);

-- Detailed Transaction List for BSP Comparison
SELECT
  pgt.session_id as greenpay_transaction_id,
  pgt.amount / 100.0 as amount_pgk,
  pgt.status,
  pgt.created_at as timestamp,
  pgt.gateway_response->>'APPROVALCODE' as bsp_approval_code,
  ip.voucher_code
FROM payment_gateway_transactions pgt
LEFT JOIN purchase_sessions ps ON ps.reference_number LIKE '%' || pgt.session_id || '%'
LEFT JOIN individual_purchases ip ON ip.purchase_session_id = ps.id
WHERE DATE(pgt.created_at) = CURRENT_DATE
AND pgt.status = 'completed'
ORDER BY pgt.created_at;
```

**Reconciliation Checklist:**
- [ ] Transaction counts match BSP report
- [ ] Total amounts match BSP report
- [ ] All approval codes found in BSP report
- [ ] No discrepancies found
- [ ] Any differences documented and explained

---

# TESTING EXECUTION SUMMARY

## Automated Tests (Ready to Run)

1. **Security Tests:** `./scripts/test-webhook-security.sh`
2. **Database Performance:** Run SQL queries above
3. **Webhook Response Time:** Already verified (800ms avg)

## Manual Tests (Follow Procedures)

1. **Replay Attack:** Capture webhook, replay, verify no duplicate
2. **Network Resilience:** Test with slow connection
3. **Mobile Devices:** Test on iPhone, Android, tablet
4. **Email Delivery:** Test multiple email providers
5. **BSP Coordination:** Schedule official test with BSP
6. **Counter Agent UAT:** Real staff workflow test
7. **Finance Reconciliation:** Daily settlement comparison

## Server Configuration

1. **Database Backups:** Deploy `scripts/backup-greenpay-db.sh`, configure cron
2. **PM2 Monitoring:** Enable log rotation, health checks
3. **Security Hardening:** Verify firewall, SSL, permissions

---

**Total Estimated Time:** 2-3 days for all manual tests + ongoing monitoring

---

*Document Created: 2025-12-31*
*All automated scripts ready, manual procedures documented*
