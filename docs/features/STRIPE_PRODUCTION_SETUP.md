# Stripe Payment System - Production Setup Guide

## ✅ What's Working Now (Test Mode)

- ✅ Stripe Checkout integration
- ✅ Webhook signature verification
- ✅ Automatic voucher generation
- ✅ Payment callback page with voucher display
- ✅ Passport registration flow
- ✅ SMS/Email notification service (mock mode)

## 🚀 Production Deployment Steps

### 1. Deploy Backend Code

Upload the updated files to your production server:

```bash
./deploy-payment-system.sh
```

Or manually upload:
- `backend/server.js`
- `backend/routes/public-purchases.js`
- `backend/services/notificationService.js`

Then restart PM2:
```bash
ssh root@72.61.208.79 "pm2 restart greenpay-api"
```

### 2. Switch to Live Stripe Keys

**On Stripe Dashboard:**
1. Go to: https://dashboard.stripe.com/apikeys
2. Click "View test data" toggle (top right) → Switch to "Live mode"
3. Copy your **Live** API keys

**On Server (.env file):**
```bash
# Replace test keys with live keys
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET

# Keep test mode during staging
# STRIPE_SECRET_KEY=sk_test_...  # Comment out test key
```

**Update Webhook URL:**
1. Go to: https://dashboard.stripe.com/webhooks
2. Create new webhook endpoint for **Live mode**
3. URL: `https://greenpay.eywademo.cloud/api/public-purchases/webhook?gateway=stripe`
4. Events to select:
   - ✅ `checkout.session.completed`
   - ✅ `checkout.session.expired`
   - ✅ `payment_intent.payment_failed`
5. Copy the new **Live webhook secret** → Update `.env`

### 3. Configure SMS Delivery (PNG)

**Option A: Digicel PNG SMS Gateway**
```bash
# Add to .env
DIGICEL_API_KEY=your_digicel_api_key
DIGICEL_SENDER_ID=GreenFees
```

Update `backend/services/notificationService.js` (line 18-31):
```javascript
const response = await fetch('https://sms.digicel.com.pg/api/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.DIGICEL_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: phoneNumber,
    message: message,
    sender_id: process.env.DIGICEL_SENDER_ID || 'GreenFees'
  })
});
```

**Option B: Bmobile PNG**
Contact Bmobile PNG for API access and update accordingly.

**Option C: Twilio (International Fallback)**
```bash
# Add to .env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

Install Twilio SDK:
```bash
npm install twilio
```

Update notification service to use Twilio.

### 4. Configure Email Delivery

**Option A: Government SMTP Server (Recommended)**
```bash
# Add to .env
SMTP_HOST=mail.gov.pg
SMTP_PORT=587
SMTP_USER=noreply@greenpay.gov.pg
SMTP_PASS=your_smtp_password
SMTP_FROM="PNG Green Fees <noreply@greenpay.gov.pg>"
```

**Option B: AWS SES (Asia Pacific Region)**
```bash
SMTP_HOST=email-smtp.ap-southeast-2.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_ses_smtp_username
SMTP_PASS=your_ses_smtp_password
```

**Option C: SendGrid**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

**Install nodemailer:**
```bash
npm install nodemailer
```

**Update notification service** (uncomment lines 47-64 in `notificationService.js`).

### 5. Update Frontend Environment

**Update `.env.local`:**
```bash
VITE_API_URL=https://greenpay.eywademo.cloud/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
VITE_PUBLIC_URL=https://greenpay.eywademo.cloud
```

**Rebuild and deploy frontend:**
```bash
npm run build
./deploy.sh
```

### 6. Test in Production

**Test Purchase Flow:**
1. Visit: `https://greenpay.eywademo.cloud/buy-voucher`
2. Use **REAL card** (live mode doesn't accept test cards)
3. Complete payment
4. Verify:
   - ✅ Webhook received in Stripe Dashboard
   - ✅ Voucher generated in database
   - ✅ SMS received (if configured)
   - ✅ Email received (if configured)
   - ✅ Callback page shows voucher code

**Monitor Webhooks:**
1. Go to: https://dashboard.stripe.com/webhooks
2. Click on your live webhook
3. View "Attempts" tab for delivery status

**Check Server Logs:**
```bash
ssh root@72.61.208.79 "pm2 logs greenpay-api --lines 100"
```

Look for:
- `✅ [STRIPE] Payment session created`
- `📥 Webhook received for gateway: stripe`
- `✅ Purchase completed`
- `📤 Sending voucher notifications...`
- `✅ Notifications sent`

## 🔒 Security Checklist

- [ ] Live Stripe keys stored in `.env` (not in code)
- [ ] Webhook signature verification enabled
- [ ] HTTPS enforced for all payment endpoints
- [ ] Database credentials secured
- [ ] SMS/Email API keys protected
- [ ] Rate limiting configured on payment endpoints
- [ ] Regular webhook delivery monitoring

## 📊 Monitoring

**Key Metrics to Track:**
1. Payment success rate
2. Webhook delivery success rate
3. Voucher generation time
4. SMS/Email delivery rate
5. Registration completion rate

**Stripe Dashboard:**
- Monitor: https://dashboard.stripe.com/payments
- Check: Payment success/failure rates
- Review: Disputed charges

**Server Monitoring:**
```bash
# Check PM2 status
pm2 status

# Monitor logs in real-time
pm2 logs greenpay-api --lines 50 --follow

# Check webhook delivery
pm2 logs greenpay-api | grep "webhook"
```

## 🆘 Troubleshooting

**Webhook Not Firing:**
1. Check webhook URL is accessible: `curl https://greenpay.eywademo.cloud/api/public-purchases/webhook?gateway=stripe`
2. Verify webhook secret matches `.env`
3. Check Stripe Dashboard → Webhooks → Attempts tab

**SMS Not Sending:**
1. Check phone number format: `+675XXXXXXXX`
2. Verify API credentials in `.env`
3. Check server logs for SMS errors

**Email Not Sending:**
1. Test SMTP connection: `telnet SMTP_HOST SMTP_PORT`
2. Verify credentials and authentication
3. Check spam folder

**Vouchers Not Generated:**
1. Check webhook signature verification passes
2. Verify session exists in database
3. Check server logs for errors in `completeVoucherPurchase()`

## 📞 Support Contacts

- Stripe Support: https://support.stripe.com
- Digicel PNG: +675 XXXX XXXX
- Bmobile PNG: +675 XXXX XXXX
- Technical Support: dev@greenpay.gov.pg

## 🔄 Rollback Plan

If issues occur in production:

```bash
# Revert to test mode
ssh root@72.61.208.79
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
nano .env

# Change:
PAYMENT_GATEWAY=stripe
STRIPE_SECRET_KEY=sk_test_...  # Use test key
STRIPE_WEBHOOK_SECRET=whsec_... # Use test webhook secret

# Restart
pm2 restart greenpay-api
```

## 📝 Next Steps

After successful production deployment:

1. ✅ Monitor first 10 transactions closely
2. ✅ Collect user feedback on payment flow
3. ✅ Optimize SMS/Email delivery based on metrics
4. ✅ Set up automated monitoring/alerts
5. ✅ Document internal processes for support team
6. ✅ Consider adding BSP/Kina Bank gateway (PNG local)
