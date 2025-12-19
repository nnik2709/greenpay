# BSP DOKU Payment Gateway Integration

## Credentials (TEST Environment)

**Merchant Name:** Climate Change Dev Authority
**Mall ID:** 11170
**Shared Key:** ywSd48uOfypN
**Environment:** TEST

## DOKU Default URLs (Already Set on Their Side)

These are DOKU's default endpoints that they've configured:
- **Notify URL:** https://pay.doku.com/ackpg/continue.html
- **Redirect URL:** https://pay.doku.com/ackpg/continue.html

## IP Whitelisting Required

Add these IPs to your firewall/security rules:

**Staging/Test:**
- 103.10.130.75
- 147.139.130.145

**Production (for later):**
- 103.10.130.35
- 147.139.129.160

## URLs to Provide to BSP/DOKU

You need to provide these to BSP so they can register them in DOKU:

1. **Test Website URL:**
   - https://greenpay.eywademo.cloud/buy-online
   - (For BSP Digital Testing Team to test payments)

2. **Merchant Notify URL (Webhook):**
   - https://greenpay.eywademo.cloud/api/payment/webhook/doku
   - (DOKU will POST payment status updates here)

3. **Merchant Redirect URL (Success/Failure):**
   - Success: https://greenpay.eywademo.cloud/payment/success
   - Failure: https://greenpay.eywademo.cloud/payment/failure
   - (Where DOKU redirects customer after payment)

## Implementation Timeline

### Phase 1: TEST (10 days testing)
- Implement DOKU integration with test credentials
- BSP Digital Testing Team will test payments
- Ensure test payments reach BSP
- Fix any issues found

### Phase 2: PRODUCTION
- Switch to production credentials
- Production Mall ID and Shared Key (will be provided)
- Media release
- Go live

## Environment Variables

Add to `.env`:

```bash
# BSP DOKU Integration (TEST)
BSP_DOKU_MALL_ID=11170
BSP_DOKU_SHARED_KEY=ywSd48uOfypN
BSP_DOKU_MODE=test
BSP_DOKU_BASE_URL=https://pay.doku.com

# For production (when ready):
# BSP_DOKU_MODE=production
# BSP_DOKU_MALL_ID=<production_mall_id>
# BSP_DOKU_SHARED_KEY=<production_shared_key>

# Set BSP as active payment gateway
PAYMENT_GATEWAY=bsp
```

## Integration Architecture

DOKU uses a **hosted payment page** model:

1. **Customer initiates payment** on your site
2. **Your backend creates payment request** with DOKU
3. **Customer is redirected** to DOKU's payment page
4. **Customer completes payment** on DOKU's secure page
5. **DOKU notifies your webhook** with payment status
6. **Customer is redirected back** to your success/failure page

## Required Implementation Files

1. **backend/services/payment-gateways/BSPGateway.js**
   - Implement DOKU API calls
   - Payment request creation
   - Signature generation (WORDS algorithm)
   - Webhook verification

2. **backend/routes/payment-webhook-doku.js** (NEW)
   - Handle DOKU webhook notifications
   - Verify WORDS signature
   - Update transaction status

3. **.env**
   - Add DOKU credentials

4. **backend/server.js**
   - Add DOKU webhook route

## Key DOKU Concepts

### WORDS Signature
DOKU uses a signature called "WORDS" for security:
- Concatenate: `amount + shared_key + transaction_id`
- Hash with SHA1
- Use for request authentication and webhook verification

### Payment Flow
1. Generate WORDS signature
2. Create payment request to DOKU
3. Get payment URL
4. Redirect customer to DOKU page
5. Receive webhook notification
6. Verify WORDS signature in webhook
7. Update payment status

## Implementation Status

1. ✅ Review DOKU API Integration Guide (PDF analyzed)
2. ✅ Implement BSPGateway with DOKU API
3. ✅ Create webhook endpoints (notify & redirect)
4. ⏳ Add environment variables to server
5. ⏳ Mount webhook routes in server.js
6. ⏳ Test locally
7. ⏳ Deploy to test environment
8. ⏳ Provide URLs to BSP
9. ⏳ BSP Digital Testing Team tests (10 days)
10. ⏳ Fix any issues
11. ⏳ Switch to production credentials
12. ⏳ Go live!

## Implementation Complete ✅

The following files have been implemented:

### 1. `backend/services/payment-gateways/BSPGateway.js`
Complete DOKU Hosted Payment Pages integration:
- ✅ WORDS signature generation (SHA1)
- ✅ Payment request creation
- ✅ Check Status API
- ✅ Webhook signature verification
- ✅ Void/Refund API
- ✅ PGK currency support (ISO 598)

### 2. `backend/routes/payment-webhook-doku.js`
DOKU webhook handlers:
- ✅ Notify webhook (server-to-server)
- ✅ Redirect webhook (browser redirect)
- ✅ Database transaction updates
- ✅ Success/failure redirects

## Next Steps for Deployment

1. **Update server.js** to mount webhook routes:
```javascript
const paymentWebhookDoku = require('./routes/payment-webhook-doku');
app.use('/api/payment/webhook/doku', paymentWebhookDoku);
```

2. **Add environment variables** to production server `.env`:
```bash
BSP_DOKU_MALL_ID=11170
BSP_DOKU_SHARED_KEY=ywSd48uOfypN
BSP_DOKU_MODE=test
BSP_DOKU_CHAIN_MERCHANT=NA
```

3. **Test the integration** locally or in staging

4. **Provide these URLs to BSP** for DOKU configuration:
   - Test Website: https://greenpay.eywademo.cloud/buy-online
   - Notify URL: https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify
   - Redirect URL: https://greenpay.eywademo.cloud/api/payment/webhook/doku/redirect

5. **IP Whitelisting**: Configure firewall to allow DOKU test IPs:
   - 103.10.130.75
   - 147.139.130.145

## Important Notes

- ✅ CMS (Vite/React) supports third-party payment plugins
- ✅ Webhook endpoint ready to be implemented
- ✅ Payment gateway architecture ready
- ✅ Database schema ready for transactions
- ⚠️ Need to implement DOKU-specific API calls
- ⚠️ Need to review DOKU API Integration Guide for exact request/response formats

## Contact Information

**BSP Support:**
- Email: servicebsp@bsp.com.pg
- Phone: +675 3201212

**For Technical Issues During Integration:**
- Contact BSP technical team via email
- Reference: Climate Change Dev Authority integration
