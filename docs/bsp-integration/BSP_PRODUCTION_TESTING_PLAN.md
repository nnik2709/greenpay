# BSP DOKU Production Testing Plan - PNG Environment

**Status**: ✅ Staging Working
**Next**: Production Readiness Testing
**Environment**: Papua New Guinea

---

## Phase 1: Functional Testing (Staging)

### 1.1 Happy Path Tests ✅

**Test 1: Successful Payment Flow**
- [ ] Enter valid passport data
- [ ] Complete payment with test card
- [ ] Verify webhook arrives within 2 seconds
- [ ] Verify voucher created in database
- [ ] Verify success page shows voucher immediately (1-2 seconds)
- [ ] Verify email sent to customer
- [ ] Verify voucher has valid barcode/QR code

**Test 2: Multiple Sequential Payments**
- [ ] Make 5 payments in a row (different passports)
- [ ] Verify all vouchers created correctly
- [ ] Verify no duplicate vouchers
- [ ] Check database for data integrity

**Test 3: Concurrent Payments**
- [ ] Open 3 browser tabs
- [ ] Start payment in all tabs simultaneously
- [ ] Verify all 3 vouchers created
- [ ] Check for race conditions or duplicate codes

### 1.2 Error Handling Tests

**Test 4: Failed Payment**
- [ ] Start payment but cancel/fail on BSP page
- [ ] Verify no voucher created
- [ ] Verify transaction marked as 'failed'
- [ ] Verify customer redirected to failure page
- [ ] Verify no email sent

**Test 5: Insufficient Funds**
- [ ] Use test card with insufficient funds
- [ ] Verify payment rejected by BSP
- [ ] Verify no voucher created
- [ ] Verify proper error message shown

**Test 6: Invalid Card Details**
- [ ] Enter invalid card number
- [ ] Verify BSP rejects payment
- [ ] Verify proper error handling

### 1.3 Data Validation Tests

**Test 7: Special Characters in Names**
- [ ] Test name: O'Brien, José, François, Müller
- [ ] Verify passport created correctly
- [ ] Verify voucher displays names properly

**Test 8: Long Names**
- [ ] Test very long surname (50+ chars)
- [ ] Test very long given name
- [ ] Verify truncation or proper handling

**Test 9: Missing Optional Fields**
- [ ] Skip nationality
- [ ] Skip date of birth
- [ ] Skip expiry date
- [ ] Verify voucher still created with NULL values

**Test 10: Existing Passport**
- [ ] Make payment with passport that already exists
- [ ] Verify new voucher created
- [ ] Verify existing passport reused (not duplicated)

---

## Phase 2: Security Testing

### 2.1 Webhook Security

**Test 11: Invalid Webhook Signature**
- [ ] Send webhook with wrong WORDS signature
- [ ] Verify request rejected (STOP response)
- [ ] Verify transaction NOT updated
- [ ] Verify no voucher created
- [ ] Check logs for security warning

**Test 12: Replay Attack**
- [ ] Capture valid webhook payload
- [ ] Resend same webhook 5 minutes later
- [ ] Verify idempotency (no duplicate voucher)
- [ ] Verify proper handling

**Test 13: Unauthorized IP Address**
- [ ] Send webhook from non-BSP IP (use curl from your laptop)
- [ ] Verify request rejected in production mode
- [ ] Verify security logged

**Test 14: Malformed Webhook Payload**
- [ ] Send webhook with missing required fields
- [ ] Send webhook with invalid JSON
- [ ] Send webhook with SQL injection attempt
- [ ] Verify all rejected safely

### 2.2 Payment Security

**Test 15: Session Tampering**
- [ ] Modify session ID in URL manually
- [ ] Try to access someone else's voucher
- [ ] Verify proper authorization check

**Test 16: Amount Tampering**
- [ ] Try to modify payment amount in browser
- [ ] Verify BSP validates actual amount
- [ ] Verify voucher created with correct amount

---

## Phase 3: Performance Testing

### 3.1 Load Testing

**Test 17: Peak Load Simulation**
- [ ] Simulate 50 concurrent users
- [ ] All making payments simultaneously
- [ ] Verify all webhooks processed
- [ ] Verify no timeouts
- [ ] Check database connection pool

**Test 18: Database Performance**
```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM individual_purchases WHERE voucher_code = 'TESTCODE';
EXPLAIN ANALYZE SELECT * FROM passports WHERE passport_number = 'ABC123';
EXPLAIN ANALYZE SELECT * FROM payment_gateway_transactions WHERE session_id = 'PGKO-xxx';

-- Verify indexes are used
-- Should show "Index Scan" not "Seq Scan"
```

**Test 19: Webhook Response Time**
- [ ] Measure time from payment to voucher creation
- [ ] Target: < 2 seconds
- [ ] Check PM2 logs for processing times

### 3.2 Scalability Testing

**Test 20: Daily Volume Test**
- [ ] Process 500 test payments
- [ ] Verify all successful
- [ ] Check database size growth
- [ ] Monitor server resources (CPU, memory, disk)

---

## Phase 4: Reliability Testing

### 4.1 Network Resilience

**Test 21: Slow Network**
- [ ] Simulate slow connection (throttle browser)
- [ ] Complete payment
- [ ] Verify webhook still processed
- [ ] Verify timeout handling

**Test 22: BSP Downtime Simulation**
- [ ] What happens if BSP is down?
- [ ] Verify proper error message
- [ ] Verify no partial transactions

**Test 23: Database Failover**
- [ ] Simulate database connection loss
- [ ] Verify proper error handling
- [ ] Verify webhook responds correctly (CONTINUE to avoid retries)

### 4.2 Data Integrity

**Test 24: Transaction Atomicity**
- [ ] Kill backend during voucher creation
- [ ] Restart and check database
- [ ] Verify no orphaned records
- [ ] Verify transaction rolled back properly

**Test 25: Duplicate Prevention**
- [ ] Try to create same voucher code twice
- [ ] Verify database constraint prevents it
- [ ] Verify proper error handling

---

## Phase 5: PNG-Specific Testing

### 5.1 Currency & Amount Testing

**Test 26: PGK Currency**
- [ ] Verify amount shown as "PGK 50.00"
- [ ] Verify BSP receives correct currency code (598)
- [ ] Verify database stores correct amount
- [ ] Test different amounts: 50, 100, 150, 200

**Test 27: Currency Formatting**
- [ ] Verify PNG currency format (K 50.00)
- [ ] Check voucher PDF shows correct format
- [ ] Check email shows correct format

### 5.2 PNG Network Conditions

**Test 28: Slow PNG Internet**
- [ ] Simulate 3G/slow connection (common in PNG)
- [ ] Complete full payment flow
- [ ] Verify everything works (may be slow but functional)
- [ ] Check timeout settings are adequate

**Test 29: Mobile Network**
- [ ] Test on PNG mobile network (if available)
- [ ] Test on 3G
- [ ] Test on 4G
- [ ] Verify responsive design works

### 5.3 Local Payment Methods

**Test 30: PNG Issued Cards**
- [ ] Test with BSP-issued card
- [ ] Test with other PNG bank cards
- [ ] Test with international cards (Visa/MC)
- [ ] Verify all accepted

### 5.4 Time Zone Testing

**Test 31: PNG Time Zone (UTC+10)**
- [ ] Make payment at different times
- [ ] Verify timestamps correct in database
- [ ] Verify valid_from/valid_until dates correct
- [ ] Check email timestamps

---

## Phase 6: User Experience Testing

### 6.1 End-User Testing

**Test 32: Customer Journey**
- [ ] Customer enters passport manually
- [ ] Customer receives voucher instantly
- [ ] Customer downloads PDF
- [ ] Customer receives email
- [ ] Customer can print voucher
- [ ] Measure total time (should be < 5 minutes)

**Test 33: Mobile Experience**
- [ ] Test on iPhone
- [ ] Test on Android
- [ ] Test on tablet
- [ ] Verify payment page responsive
- [ ] Verify success page responsive

**Test 34: Email Delivery**
- [ ] Test with Gmail
- [ ] Test with corporate email
- [ ] Test with PNG local email providers
- [ ] Verify email not in spam
- [ ] Verify email formatting correct

### 6.2 Error Recovery

**Test 35: Customer Confusion Scenarios**
- [ ] Customer closes browser during payment
- [ ] Customer clicks back button
- [ ] Customer refreshes success page
- [ ] Verify proper handling

---

## Phase 7: Integration Testing

### 7.1 BSP Bank Integration

**Test 36: BSP Callback Verification**
- [ ] Verify WORDS signature algorithm matches BSP spec
- [ ] Verify response format matches BSP spec
- [ ] Verify webhook URL accessible from BSP IPs
- [ ] Get BSP confirmation of successful test

**Test 37: BSP Error Codes**
- [ ] Test each BSP error code:
  - 0000: Success
  - 5501: Failed
  - 5511: Pending
  - Others as per BSP documentation
- [ ] Verify proper handling of each

### 7.2 Database Integration

**Test 38: Database Consistency**
```sql
-- Check referential integrity
SELECT COUNT(*) FROM individual_purchases ip
WHERE NOT EXISTS (SELECT 1 FROM passports p WHERE p.passport_number = ip.passport_number);
-- Should return 0

-- Check orphaned sessions
SELECT COUNT(*) FROM purchase_sessions ps
WHERE payment_status = 'completed'
AND NOT EXISTS (SELECT 1 FROM individual_purchases ip WHERE ip.purchase_session_id = ps.id);
-- Should return 0

-- Check transaction consistency
SELECT COUNT(*) FROM payment_gateway_transactions pgt
WHERE status = 'completed'
AND NOT EXISTS (SELECT 1 FROM individual_purchases ip WHERE ip.purchase_session_id = pgt.session_id);
-- Should return 0
```

---

## Phase 8: Monitoring & Logging

### 8.1 Log Verification

**Test 39: Audit Trail**
- [ ] Make test payment
- [ ] Verify complete audit trail in logs:
  - Payment session created
  - Webhook received
  - Signature verified
  - Transaction updated
  - Voucher created
  - Email sent
- [ ] Verify all logs have timestamps
- [ ] Verify session IDs traceable

**Test 40: Error Logging**
- [ ] Trigger various errors
- [ ] Verify all logged with proper severity
- [ ] Verify stack traces captured
- [ ] Verify no sensitive data in logs (card numbers, etc.)

### 8.2 Monitoring Setup

**Test 41: PM2 Monitoring**
```bash
# Check process health
pm2 status
pm2 describe greenpay-api

# Monitor resources
pm2 monit

# Check logs
pm2 logs greenpay-api --lines 1000
```

**Test 42: Database Monitoring**
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'greenpay_db';

-- Slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC LIMIT 10;

-- Table sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Phase 9: Production Readiness

### 9.1 Environment Configuration

**Test 43: Production Environment Variables**
```bash
# Verify production settings
cat .env | grep BSP_DOKU_MODE
# Should be: BSP_DOKU_MODE=production

cat .env | grep BSP_DOKU_MALL_ID
# Should be: production Mall ID (not test)

cat .env | grep BSP_DOKU_SHARED_KEY
# Should be: production shared key
```

**Test 44: SSL Certificate**
```bash
# Verify SSL valid
curl -vI https://greenpay.eywademo.cloud 2>&1 | grep -E "SSL|certificate|issuer"

# Check expiry
echo | openssl s_client -servername greenpay.eywademo.cloud -connect greenpay.eywademo.cloud:443 2>/dev/null | openssl x509 -noout -dates
```

**Test 45: Firewall & Security**
- [ ] Verify only ports 80, 443 open
- [ ] Verify database not accessible from internet
- [ ] Verify backend only accessible via nginx proxy

### 9.2 Backup & Recovery

**Test 46: Database Backup**
```bash
# Create backup
pg_dump -h localhost -U greenpay_user greenpay_db > backup.sql

# Test restore
psql -h localhost -U greenpay_user greenpay_test < backup.sql

# Verify data integrity
```

**Test 47: Disaster Recovery**
- [ ] Document recovery procedure
- [ ] Test backend restart
- [ ] Test database restore
- [ ] Test from cold start

### 9.3 Rate Limiting

**Test 48: Webhook Rate Limiting**
- [ ] Send 150 requests/minute to webhook
- [ ] Verify rate limit kicks in at 100
- [ ] Verify proper 429 response

---

## Phase 10: User Acceptance Testing (UAT)

### 10.1 Internal Testing

**Test 49: Counter Agent Workflow**
- [ ] Counter agent makes payment for customer
- [ ] Prints voucher
- [ ] Customer receives email
- [ ] Complete workflow < 5 minutes

**Test 50: Finance Manager Review**
- [ ] Finance manager reviews transactions
- [ ] Checks payment_gateway_transactions table
- [ ] Verifies amounts match
- [ ] Reconciles with BSP statements

### 10.2 BSP Coordination

**Test 51: BSP Test Transactions**
- [ ] Coordinate with BSP for official test
- [ ] BSP monitors their side
- [ ] You monitor your side
- [ ] Both parties confirm success

**Test 52: BSP Settlement**
- [ ] Verify BSP settlement report format
- [ ] Verify amounts reconcile
- [ ] Verify transaction IDs match

---

## Critical Production Checks

### Before Go-Live Checklist

**Environment:**
- [ ] `BSP_DOKU_MODE=production` in .env
- [ ] Production Mall ID configured
- [ ] Production Shared Key configured
- [ ] SSL certificate valid (> 30 days remaining)
- [ ] Webhook URLs pointing to production

**Database:**
- [ ] All tables exist
- [ ] All indexes created
- [ ] Backup configured (daily)
- [ ] Connection pool sized correctly (max: 20)

**Security:**
- [ ] IP whitelist configured (BSP production IPs)
- [ ] Rate limiting active
- [ ] Webhook signature verification enabled
- [ ] SQL injection protection verified
- [ ] XSS protection verified

**Monitoring:**
- [ ] PM2 configured for auto-restart
- [ ] Log rotation configured
- [ ] Disk space monitoring
- [ ] Email alerts configured

**Documentation:**
- [ ] Support contact information
- [ ] BSP support contact saved
- [ ] Runbook for common issues
- [ ] Escalation procedure documented

---

## Post-Launch Monitoring (First Week)

### Day 1:
- [ ] Monitor every transaction
- [ ] Check logs hourly
- [ ] Verify all vouchers created
- [ ] Customer feedback

### Day 2-3:
- [ ] Check logs every 4 hours
- [ ] Review error rate
- [ ] Check database growth
- [ ] Server resource usage

### Day 4-7:
- [ ] Daily log review
- [ ] Weekly reconciliation with BSP
- [ ] Performance metrics
- [ ] Customer satisfaction

---

## Success Criteria

### Technical Metrics:
- **Uptime**: > 99.5%
- **Webhook processing**: < 2 seconds average
- **Voucher creation success rate**: > 99%
- **Email delivery rate**: > 95%
- **Error rate**: < 1%

### Business Metrics:
- **Customer satisfaction**: Positive feedback
- **Transaction volume**: Meeting targets
- **Payment success rate**: > 95%
- **Support tickets**: Minimal

### Security Metrics:
- **Security incidents**: 0
- **Unauthorized access attempts**: All blocked
- **Data breaches**: 0

---

## Testing Timeline

| Phase | Duration | Owner |
|-------|----------|-------|
| Phase 1-4 (Functional/Security/Performance/Reliability) | 2-3 days | Your team |
| Phase 5 (PNG-specific) | 1 day | Your team + PNG testers |
| Phase 6 (UX) | 1 day | End users |
| Phase 7 (Integration) | 1 day | Your team + BSP |
| Phase 8 (Monitoring) | Ongoing | Your team |
| Phase 9 (Prod Readiness) | 1 day | Your team |
| Phase 10 (UAT) | 2-3 days | Stakeholders + BSP |
| **Total** | **7-10 days** | |

---

## Emergency Contacts

**BSP Support:**
- Email: servicebsp@bsp.com.pg
- Phone: +675 3201212
- Hours: Business hours PNG time

**Your Team:**
- Technical Lead: [Name, Phone, Email]
- System Admin: [Name, Phone, Email]
- Business Owner: [Name, Phone, Email]

---

## Rollback Plan

If critical issues found:

1. **Immediate:**
   - Switch BSP_DOKU_MODE back to 'test'
   - Notify customers of maintenance
   - Investigate issue

2. **Within 1 hour:**
   - Identify root cause
   - Determine fix timeline
   - Communicate to stakeholders

3. **Within 4 hours:**
   - Deploy fix OR
   - Rollback to previous version
   - Resume service

---

## Sign-Off

Before production launch, get approval from:

- [ ] Technical Lead
- [ ] Finance Manager
- [ ] Business Owner
- [ ] BSP Bank (confirmation webhook configured)
- [ ] Security Officer (if applicable)

**Approved by:** _________________ **Date:** _________

---

**Good luck with production launch!** 🚀🇵🇬
