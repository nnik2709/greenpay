# Cloudflare Webhook Security Fix

## Problem

After implementing Cloudflare (Turnstile or other security features), the DOKU webhook endpoint is being blocked:

```
URL: https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify
Error: "This link may be unsafe. For your security, we'd like to analyze it further for potential threats."
```

This prevents DOKU from sending payment notifications to your server, breaking the payment flow.

## Root Cause

Cloudflare's security features (WAF, Bot Protection, or Threat Detection) are flagging the webhook POST endpoint as suspicious because:
- It accepts POST requests from external servers
- It has "webhook" in the URL path
- It processes payment data

## Solution: Add WAF Exception Rule

### Step 1: Log into Cloudflare Dashboard

1. Go to https://dash.cloudflare.com/
2. Select your account
3. Click on the domain: `eywademo.cloud`

### Step 2: Create WAF Exception Rule

Navigate to: **Security** → **WAF** → **Custom Rules**

Click **Create Rule** and configure:

**Rule Name:** `Allow DOKU Payment Webhooks`

**Field Configurations:**

```
When incoming requests match...

URI Path contains "/api/payment/webhook/doku"

OR

IP Source Address is in {
  103.10.130.75
  147.139.130.145
  103.10.130.35
  147.139.129.160
}
```

**Then:**
- Action: **Skip**
- Select: **All remaining custom rules**

**Deploy the rule**

### Step 3: Alternative - Disable Bot Fight Mode for API Path

If you have "Bot Fight Mode" enabled:

1. Go to **Security** → **Bots**
2. Click **Configure Bot Fight Mode**
3. Add exception for path: `/api/payment/webhook/*`

### Step 4: Check Security Level

Go to **Security** → **Settings**

If Security Level is set to "High" or "I'm Under Attack", webhooks will be blocked.

**Recommended:** Set to "Medium" and use WAF rules for specific protection.

### Step 5: Verify Fix

Test the webhook endpoint:

```bash
# From your local machine
curl -X POST https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "test=1"
```

Expected response:
- **Before fix:** HTML page with "link may be unsafe" message
- **After fix:** `STOP` or `CONTINUE` response from your backend

## DOKU Allowed IPs

Add these IPs to your WAF rule to whitelist DOKU servers:

**Staging/Test:**
- 103.10.130.75
- 147.139.130.145

**Production:**
- 103.10.130.35
- 147.139.129.160

Source: `backend/routes/payment-webhook-doku.js:57-65`

## Alternative: Disable Cloudflare for API Subdomain

If you want to bypass Cloudflare entirely for API endpoints:

1. Go to **DNS** in Cloudflare dashboard
2. Find the DNS record for your API endpoint
3. Click the orange cloud icon to turn it gray (DNS only)
4. This will bypass all Cloudflare security features for that subdomain

**WARNING:** This removes all Cloudflare protection from your API.

## Verification Checklist

After implementing the fix:

- [ ] WAF exception rule created for `/api/payment/webhook/doku`
- [ ] DOKU IPs whitelisted (optional but recommended)
- [ ] Security level set to Medium or lower
- [ ] Bot Fight Mode disabled for webhook paths
- [ ] Test webhook endpoint with curl (receives backend response, not Cloudflare block page)
- [ ] Monitor PM2 logs during real DOKU webhook: `pm2 logs greenpay-api`
- [ ] Verify DOKU can successfully send notifications

## Troubleshooting

### Issue: Still blocked after adding rule

**Check:**
1. Rule is enabled (toggle switch is ON)
2. Rule is deployed (not in draft mode)
3. URI path match is correct: `/api/payment/webhook/doku` (no trailing slash)
4. Rule order: Exception rules should be at the TOP of the list

### Issue: Other API endpoints also blocked

**Solution:**
Expand the WAF rule to cover all API endpoints:

```
URI Path starts with "/api"
```

### Issue: Cloudflare cache serving old responses

**Solution:**
1. Go to **Caching** → **Configuration**
2. Click **Purge Everything**
3. Wait 30 seconds and test again

## Testing After Fix

1. **Manual webhook test:**
   ```bash
   curl -X POST https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "TRANSIDMERCHANT=TEST123&STATUSCODE=0000"
   ```

2. **Real payment test:**
   - Visit https://greenpay.eywademo.cloud/buy-online
   - Complete passport form
   - Process payment with test card
   - Monitor backend logs: `ssh root@165.22.52.100 "pm2 logs greenpay-api"`
   - Check for `[DOKU NOTIFY] Webhook received` messages

3. **Check webhook in Cloudflare Analytics:**
   - Go to **Analytics & Logs** → **Security**
   - Filter by: Path contains `/webhook`
   - Verify requests are allowed (not blocked)

## Important Notes

- **Do NOT disable Cloudflare entirely** - you need it for DDoS protection and CDN
- **Do NOT disable security for entire domain** - only create exceptions for webhook paths
- **Do keep IP whitelisting** - DOKU IPs are static and documented
- **Do monitor logs** - Check PM2 logs to verify webhooks are reaching your backend
- **Do test thoroughly** - Complete end-to-end payment flow after implementing fix

## Support

If issues persist:
1. Check Cloudflare Firewall Events: **Security** → **Events**
2. Look for blocked requests to `/api/payment/webhook/doku/notify`
3. Note the Rule ID that blocked the request
4. Adjust or disable that specific rule
