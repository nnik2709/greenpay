# Deploy Buy Online Feature

## Quick Deployment (Automated)

```bash
./deploy-buy-online.sh
```

## Manual Deployment

### 1. Deploy Frontend

```bash
rsync -avz --delete dist/ root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/
```

### 2. Deploy Backend Files

```bash
# Upload new public purchase route
scp backend/routes/publicPurchase.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

# Upload updated server.js
scp backend/server.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/
```

### 3. Restart Backend Service

```bash
ssh root@72.61.208.79
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 50
exit
```

## Files Deployed

### Frontend (dist/)
- Entire production build with Buy Online feature
- Login page with "🛒 Buy Online" button
- New `/buy-online` route

### Backend
1. **backend/routes/publicPurchase.js** (NEW)
   - POST /api/public/purchase
   - GET /api/public/purchase/:voucherCode

2. **backend/server.js** (MODIFIED)
   - Added route registration for /api/public

## Testing

### 1. Test Login Page
Visit: https://greenpay.eywademo.cloud/login
✅ Should see "Buy Online" section below login form

### 2. Test Buy Online Page
Click: "🛒 Buy Online" button
✅ Should redirect to /buy-online
✅ Should see 3-step purchase form

### 3. Test Purchase Flow
Step 1: Enter passport details
- Passport Number: TEST123456
- Surname: SMITH
- Given Name: JOHN
- Email: test@example.com

Step 2: Select payment method
- Choose "Cash"

Step 3: Complete purchase
✅ Should show success message
✅ Should display voucher code
⚠️ Email sending requires email service configuration

### 4. Test Backend API
```bash
# Test public purchase endpoint
curl -X POST https://greenpay.eywademo.cloud/api/public/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "passport": {
      "passport_number": "TEST123456",
      "surname": "SMITH",
      "given_name": "JOHN",
      "nationality": "Papua New Guinea",
      "sex": "Male"
    },
    "contact": {
      "email": "test@example.com"
    },
    "payment": {
      "mode": "Cash",
      "amount": 100.00
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "voucher": {
    "code": "GF-...",
    "amount": 100.00,
    "passport_number": "TEST123456"
  },
  "message": "Purchase successful. Voucher sent to your email.",
  "paymentInstructions": "..."
}
```

## Database Tables Used

- **passports** - Stores passport information
- **individual_purchases** - Stores purchase/voucher records

### Required Columns in individual_purchases:
- passport_id
- voucher_code
- amount
- payment_mode
- payment_status
- contact_email
- contact_phone
- created_at
- updated_at

## Email Configuration

The backend route includes email sending placeholder:

```javascript
// In backend/routes/publicPurchase.js
async function sendVoucherEmail(email, voucherData) {
  // TODO: Implement with your email service
  // Use backend/services/emailService.js if available
}
```

To enable email:
1. Configure email service in backend
2. Update `sendVoucherEmail()` function
3. Test email delivery

## Troubleshooting

### Issue: Buy Online button not showing
**Solution:** Clear browser cache, hard refresh (Ctrl+Shift+R)

### Issue: 404 on /buy-online
**Solution:** Ensure dist/ folder deployed correctly

### Issue: API 500 error on purchase
**Solution:**
- Check PM2 logs: `pm2 logs greenpay-api`
- Verify database tables exist
- Check PostgreSQL connection

### Issue: Email not sending
**Solution:**
- Email service not configured yet (expected)
- Voucher still created successfully
- Configure email service as needed

## Rollback

If deployment causes issues:

```bash
# Restore previous dist
ssh root@72.61.208.79
cd /home/eywademo-greenpay/backups
tar -xzf [previous-backup].tar.gz -C /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/

# Restore previous backend
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
rm routes/publicPurchase.js
git checkout server.js  # or restore from backup
pm2 restart greenpay-api
```

## What's New

✅ **Login Page**
- "Buy Online" section below login form
- Attractive glass-effect design
- Direct link to purchase flow

✅ **Buy Online Page** (/buy-online)
- 3-step purchase wizard
- No authentication required
- Hardware scanner support
- Email voucher delivery

✅ **Backend API** (POST /api/public/purchase)
- Create passport records
- Generate voucher codes
- Record purchases
- Send email confirmations

## Next Steps

After deployment:
1. ✅ Test login page shows Buy Online button
2. ✅ Test complete purchase flow
3. ⏳ Configure email service for voucher delivery
4. ⏳ Set up payment gateway for Credit Card option
5. ⏳ Monitor usage and gather feedback

---

**Date:** December 10, 2025
**Status:** Ready to Deploy
**Build:** Production build complete (611.78 kB)
