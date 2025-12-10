# Deploy Instructions - Passport Schema Fix V2

## Issue Fixed
The webhook was failing with two schema mismatches:
1. ✅ `Passport` table column names (passportNo, givenName, dob, dateOfExpiry)
2. ✅ `individual_purchases` table - removed non-existent `passport_id` column

## File to Deploy

**Backend file:** `backend/routes/buy-online.js`

**Copy to:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js`

## Changes Made

### Passport Table (FIXED):
- `passports` → `"Passport"`
- `passport_number` → `"passportNo"`
- `given_name` → `"givenName"`
- `date_of_birth` → `dob`
- Added required `"dateOfExpiry"` with 10-year default

### Individual Purchases Table (FIXED):
Removed columns that don't exist:
- ❌ `passport_id` (doesn't exist - table uses `passport_number` only)
- ❌ `customer_phone` (not in schema)
- ❌ `payment_mode` (not used)
- ❌ `purchase_session_id` (not in schema)
- ❌ `payment_gateway_ref` (not in schema)
- ❌ `status` (not in schema)

Using actual schema columns:
- ✅ `voucher_code`
- ✅ `passport_number`
- ✅ `amount`
- ✅ `payment_method`
- ✅ `discount`
- ✅ `collected_amount`
- ✅ `returned_amount`
- ✅ `valid_until`
- ✅ `valid_from`
- ✅ `customer_name`
- ✅ `customer_email`

## Manual Deployment Steps

```bash
# 1. Copy the file
scp backend/routes/buy-online.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

# 2. SSH and restart
ssh root@72.61.208.79
pm2 restart greenpay-backend
pm2 logs greenpay-backend --lines 50
```

## Testing After Deployment

1. Go to https://greenpay.eywademo.cloud/buy-online
2. Fill in passport details
3. Complete test payment with Stripe test card: `4242 4242 4242 4242`
4. After payment, should redirect to success page with voucher details
5. Check backend logs - should see:
   ```
   ✓ Created new passport: [passport_number] (ID: [id])
   ✓ Created voucher: VCH-... for passport [passport_number]
   ✅ Purchase completed for session: PGKO-...
   ```

## What This Fixes

- ✅ Passport will be created in database
- ✅ Voucher will be created and linked via passport_number
- ✅ User will see voucher on success page
- ✅ Passport appears in admin Passports list
- ✅ Voucher appears in Individual Purchases list
- ✅ Payment recorded with method "Card"
