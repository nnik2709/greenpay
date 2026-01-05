# BSP Webhook Monitoring - Quick Reference

**Use this guide while testing BSP webhooks to monitor and debug issues in real-time**

---

## Quick Commands

### Monitor Webhook Activity (Real-Time)

```bash
# SSH to production server
ssh root@165.22.52.100

# Watch ALL backend logs
pm2 logs greenpay-api --lines 200

# Watch ONLY DOKU webhook logs
pm2 logs greenpay-api --lines 200 | grep -E "DOKU|webhook"

# Watch in raw format (no timestamps, easier to read)
pm2 logs greenpay-api --raw --lines 100
```

### Check Recent Webhook Calls

```bash
# Last 50 lines of logs, filter for DOKU
pm2 logs greenpay-api --lines 50 --nostream | grep DOKU

# Get ERROR logs only
pm2 logs greenpay-api --err --lines 100
```

### Check Database Updates

```bash
# Connect to database
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay

# Check recent transactions
SELECT
  id,
  session_id,
  amount,
  currency,
  status,
  created_at,
  completed_at
FROM payment_gateway_transactions
ORDER BY created_at DESC
LIMIT 10;

# Check specific transaction by session ID
SELECT * FROM payment_gateway_transactions
WHERE session_id = 'GreenPay_1234567890';

# Count by status
SELECT status, COUNT(*) FROM payment_gateway_transactions
GROUP BY status;
```

---

## Expected Log Patterns

### ✅ SUCCESSFUL Notify Webhook

```
[DOKU NOTIFY] Webhook received at: 2025-12-30T12:00:00.000Z
[DOKU NOTIFY] Client IP: 103.10.130.75
[DOKU NOTIFY] Transaction ID: GreenPay_1735564800000
[DOKU NOTIFY] Signature verified successfully
[DOKU NOTIFY] Processing transaction update
[DOKU NOTIFY] Session ID: GreenPay_1735564800000
[DOKU NOTIFY] Status: completed
[DOKU NOTIFY] Response Code: 0000
[DOKU NOTIFY] ✅ Transaction updated successfully
[DOKU NOTIFY] Record ID: 123
[DOKU NOTIFY] New status: completed
[DOKU NOTIFY] Responding with CONTINUE
```

### ✅ SUCCESSFUL Redirect Webhook

```
[DOKU REDIRECT] Webhook received at: 2025-12-30T12:00:05.000Z
[DOKU REDIRECT] Client IP: 103.10.130.75
[DOKU REDIRECT] Transaction ID: GreenPay_1735564800000
[DOKU REDIRECT] Status Code: 0000
[DOKU REDIRECT] Result: SUCCESS
[DOKU REDIRECT] ✅ Payment successful - redirecting to success page
```

### ❌ FAILED Payment Webhook

```
[DOKU NOTIFY] Webhook received at: 2025-12-30T12:00:00.000Z
[DOKU NOTIFY] Client IP: 103.10.130.75
[DOKU NOTIFY] Transaction ID: GreenPay_1735564800000
[DOKU NOTIFY] Signature verified successfully
[DOKU NOTIFY] Status: failed
[DOKU NOTIFY] Response Code: 5501
[DOKU NOTIFY] ✅ Transaction updated successfully (status=failed)
[DOKU REDIRECT] ❌ Payment failed - redirecting to failure page
```

### ⚠️ SECURITY: Signature Verification Failed

```
[DOKU NOTIFY] Webhook received at: 2025-12-30T12:00:00.000Z
[DOKU NOTIFY] Client IP: 103.10.130.75
[DOKU NOTIFY] Transaction ID: GreenPay_1735564800000
[DOKU NOTIFY] SECURITY: Signature verification failed: Invalid WORDS signature
[DOKU NOTIFY] Payload: {...}
```

**Action Required:**
- Verify BSP_DOKU_SHARED_KEY is correct in `.env`
- Check if BSP changed the shared key
- Contact BSP support if issue persists

### ⚠️ SECURITY: Unauthorized IP

```
[DOKU NOTIFY] Webhook received at: 2025-12-30T12:00:00.000Z
[DOKU NOTIFY] Client IP: 999.999.999.999
[DOKU NOTIFY] SECURITY: Unauthorized IP address: 999.999.999.999
```

**Action Required:**
- Check if BSP is using a new IP address
- Add new IP to `ALLOWED_DOKU_IPS` array if legitimate
- Could be attack attempt if unknown IP

### ⚠️ Database Update Failed

```
[DOKU NOTIFY] Signature verified successfully
[DOKU NOTIFY] ❌ Database update error: relation "payment_gateway_transactions" does not exist
```

**Action Required:**
- Table might not exist
- Run database migration
- Check database connection

---

## Troubleshooting Commands

### Check Environment Variables

```bash
# View BSP DOKU configuration (on server)
cat /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/.env | grep BSP_DOKU

# Should show:
# BSP_DOKU_MALL_ID=xxxxx
# BSP_DOKU_SHARED_KEY=xxxxx
# BSP_DOKU_MODE=test (or production)
```

### Check Backend Process

```bash
# Check if backend is running
pm2 status

# Expected output:
# greenpay-api  │ online  │ ...

# Restart if needed
pm2 restart greenpay-api
```

### Test Endpoint Manually

```bash
# From local machine - test notify endpoint
curl -X POST https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify \
  -H "Content-Type: application/json" \
  -d '{}'

# Should return: STOP (because invalid payload)
# This confirms endpoint is reachable
```

### Check SSL Certificate

```bash
# Verify SSL is valid
curl -vI https://greenpay.eywademo.cloud 2>&1 | grep -E "SSL|certificate|issuer"

# Should show valid certificate from Let's Encrypt or similar
```

---

## Testing Workflow

### Step 1: Start Monitoring (Before Payment)

```bash
# Terminal 1: Watch logs
ssh root@165.22.52.100
pm2 logs greenpay-api --lines 50

# Terminal 2: Watch database (optional)
# Keep psql connection open, ready to query
```

### Step 2: Make Test Payment

1. Go to: https://greenpay.eywademo.cloud/public/buy
2. Enter test passport details
3. Select "Pay with Credit Card (BSP DOKU)"
4. Complete payment on BSP page

### Step 3: Watch Logs for Webhooks

You should see (in order):

1. **Notify webhook** arrives (within 1-2 seconds of payment completion)
2. **Signature verification** succeeds
3. **Database update** succeeds
4. **Response "CONTINUE"** sent
5. **Redirect webhook** arrives (when customer redirected)
6. **Customer sees** success page

### Step 4: Verify Database

```sql
-- Check transaction was updated
SELECT * FROM payment_gateway_transactions
WHERE session_id = 'GreenPay_[transaction_id]';

-- Should show:
-- status: 'completed' (for success) or 'failed' (for failure)
-- completed_at: timestamp (for success)
-- gateway_response: JSON with DOKU response
```

### Step 5: Verify Customer Experience

1. Customer should see success page at:
   `https://greenpay.eywademo.cloud/payment/success?session=GreenPay_xxx`

2. Page should show:
   - Payment successful message
   - Transaction details
   - Download voucher button (if applicable)

---

## Common Issues & Solutions

| Issue | Logs Show | Solution |
|-------|-----------|----------|
| Webhook not arriving | No DOKU logs | Check BSP configured URLs correctly |
| Signature fails | "Signature verification failed" | Verify SHARED_KEY in .env |
| Wrong IP | "Unauthorized IP address" | Add BSP IP to whitelist |
| Database not updating | "Database update error" | Check table exists, connection OK |
| Slow response | Delays in logs | Check server performance, database load |

---

## Metrics to Track

### During Testing

- ✅ **Notify webhook arrival time**: Should be < 2 seconds after payment
- ✅ **Database update time**: Should be < 100ms
- ✅ **Total webhook processing**: Should be < 500ms
- ✅ **Signature verification**: Should succeed 100% of time (with correct key)
- ✅ **Customer redirect**: Should happen within 3 seconds

### Success Criteria

- [ ] Notify webhook received for every payment
- [ ] All signatures verify successfully
- [ ] Database updates correctly (100% of time)
- [ ] Correct "CONTINUE" response sent
- [ ] Customer redirected to correct page
- [ ] No errors in logs
- [ ] Payment status matches DOKU status

---

## Emergency Procedures

### If Webhooks Stop Working

1. **Check backend is running:**
   ```bash
   pm2 status greenpay-api
   ```

2. **Check logs for errors:**
   ```bash
   pm2 logs greenpay-api --err --lines 100
   ```

3. **Restart backend if needed:**
   ```bash
   pm2 restart greenpay-api
   ```

4. **Test webhook endpoint:**
   ```bash
   curl -X POST https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify -d '{}'
   ```

5. **Contact BSP** if issue is on their side

### If Database Not Updating

1. **Check database connection:**
   ```bash
   psql -h 165.22.52.100 -U greenpay -d greenpay -c "SELECT 1"
   ```

2. **Check table exists:**
   ```sql
   \dt payment_gateway_transactions
   ```

3. **Check permissions:**
   ```sql
   SELECT * FROM payment_gateway_transactions LIMIT 1;
   ```

---

**Save this file for quick reference during testing!**
