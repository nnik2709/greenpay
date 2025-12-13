# Kina Bank Payment Gateway Integration Guide

## Overview

This guide provides complete instructions for integrating Kina Bank Internet Payment Gateway (IPG) with the PNG Green Fees System. The integration allows customers to pay for green fees online using Visa or Mastercard through Kina Bank's secure payment platform.

---

## Prerequisites

### Business Requirements

1. **Kina Bank Business Account**
   - You must be an existing or new Kina Bank SME, Business, or Corporate customer
   - Complete business KYC documentation

2. **Merchant Application**
   - Visit any Kina Bank branch
   - Complete the Payment Portal application form
   - Phone: +675 308 3800 or toll-free 180 1525
   - Email: kina@kinabank.com.pg

3. **Required Documentation**
   - Business registration documents
   - Tax identification
   - Government authorization (for government services)

### Technical Requirements

- Active Supabase project
- PNG Green Fees System deployed and running
- HTTPS-enabled domain (required for payment processing)
- Admin access to the system

---

## Step 1: Database Setup

### Run Migration

Execute the migration script to create payment gateway tables:

```bash
# Navigate to your project directory
cd /path/to/greenpay

# Apply migration via Supabase CLI (if available)
supabase db push

# OR manually run the SQL migration in Supabase SQL Editor
```

The migration file is located at: `supabase/migrations/019_kina_bank_payment_gateway.sql`

### Tables Created

1. **payment_gateway_config** - Stores gateway configuration
2. **payment_gateway_transactions** - Records all payment transactions
3. **payment_gateway_webhooks** - Logs webhook callbacks from Kina Bank

### Verify Setup

Run this SQL in Supabase SQL Editor to verify:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'payment_gateway%';

-- Check default config
SELECT * FROM payment_gateway_config WHERE gateway_name = 'KINA_BANK';

-- Verify payment modes
SELECT * FROM payment_modes WHERE name LIKE '%IPG';
```

Expected results:
- 3 tables created
- 1 KINA_BANK config record (inactive by default)
- 2 payment modes (KINA BANK IPG, BSP IPG)

---

## Step 2: Obtain Kina Bank Credentials

### Contact Kina Bank

After your merchant account is approved, request the following:

1. **Merchant ID** - Your unique merchant identifier
2. **API Credentials** - API key or authentication token
3. **API Documentation** - Complete API specification
4. **Sandbox Credentials** - Test environment access
5. **Endpoint URLs**:
   - Production API endpoint
   - Sandbox/test API endpoint

### Information to Provide to Kina Bank

When setting up your merchant account, provide these callback URLs:

**Return URL** (where customers are redirected after payment):
```
https://your-domain.com/payment-callback
```

**Webhook URL** (for real-time payment notifications):
```
https://your-domain.com/api/payment-webhook
```

**Cancel URL** (if customer cancels):
```
https://your-domain.com/individual-purchase
```

Replace `your-domain.com` with your actual domain.

---

## Step 3: Configure Payment Gateway

### Access Admin Settings

1. Log in to PNG Green Fees System as **Flex_Admin**
2. Navigate to: **Admin → Payment Gateway Settings**
3. Select the **Kina Bank IPG** tab

### Configuration Fields

Fill in the following information:

| Field | Description | Example |
|-------|-------------|---------|
| **Enable Kina Bank IPG** | Toggle to activate gateway | ☑ Enabled |
| **Sandbox Mode** | Use test environment | ☑ Enabled (for testing) |
| **Merchant ID** | From Kina Bank | `KB123456` |
| **API Endpoint URL** | From Kina Bank | `https://api.kinabank.com.pg/payment` |
| **API Key** | From Kina Bank (encrypted) | `sk_live_xxxxx` |

### Important Notes

- Start with **Sandbox Mode enabled** for testing
- The API key is encrypted before storage
- All fields must be filled before activation
- Save configuration before enabling

---

## Step 4: Testing (Sandbox Mode)

### Enable Test Mode

1. Ensure **Sandbox Mode** is toggled ON
2. Use sandbox API endpoint provided by Kina Bank
3. Use test merchant ID and API key

### Test Transaction Flow

1. **Navigate to Individual Purchase**:
   - Menu → Passports → Individual Purchase

2. **Enter Passport Details**:
   ```
   Passport Number: TEST001
   Nationality: Australian
   Surname: Smith
   Given Name: John
   DOB: 1990-01-01
   Sex: Male
   Expiry: 2025-12-31
   ```

3. **Select Payment Method**:
   - Choose "KINA BANK IPG"
   - Enter amount: PGK 50.00
   - Click "Process Payment"

4. **Redirect to Kina Bank**:
   - You'll be redirected to Kina Bank payment page
   - Use test card numbers provided by Kina Bank
   - Complete payment

5. **Return and Verify**:
   - System redirects back to payment callback
   - Transaction status is verified
   - Voucher is generated if successful

### Test Card Numbers

Request test card numbers from Kina Bank. Common test scenarios:

- **Successful payment**: `4111 1111 1111 1111`
- **Declined card**: `4000 0000 0000 0002`
- **Insufficient funds**: `4000 0000 0000 0009`
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)

### Verify Transactions

Check transaction records:

1. Navigate to: **Admin → Payment Gateway Settings**
2. View transaction statistics at the top
3. Check Supabase database:

```sql
SELECT * FROM payment_gateway_transactions
ORDER BY created_at DESC
LIMIT 10;
```

Expected columns:
- `merchant_reference`: e.g., `PGKB-20250115-123456`
- `status`: `success`, `failed`, or `pending`
- `amount`: Transaction amount
- `gateway_name`: `KINA_BANK`

---

## Step 5: Production Deployment

### Pre-Production Checklist

- [ ] Completed at least 5 successful test transactions
- [ ] Verified all transaction statuses correctly update
- [ ] Tested failed payment scenarios
- [ ] Confirmed webhook callbacks are received
- [ ] Reviewed transaction logs for errors
- [ ] Obtained production API credentials from Kina Bank

### Switch to Production

1. **Update Gateway Settings**:
   - Navigate to: **Admin → Payment Gateway Settings**
   - Toggle **Sandbox Mode** to OFF
   - Update **API Endpoint URL** to production URL
   - Update **Merchant ID** to production ID
   - Update **API Key** to production key
   - Save configuration

2. **Security Verification**:
   - Ensure HTTPS is enabled on your domain
   - Verify SSL certificate is valid
   - Test callback URLs are accessible
   - Check firewall allows Kina Bank IPs (if applicable)

3. **Enable Gateway**:
   - Toggle **Enable Kina Bank IPG** to ON
   - Save configuration
   - Test with a small real transaction

### First Production Transaction

1. Process a small transaction (e.g., PGK 50)
2. Use a real card
3. Verify payment completes successfully
4. Check transaction appears in:
   - Kina Bank merchant portal
   - PNG Green Fees transaction log
   - Supabase database

---

## Step 6: Monitoring and Maintenance

### Transaction Monitoring

Monitor gateway transactions regularly:

**View Statistics**:
- Admin → Payment Gateway Settings
- Dashboard shows: Total, Success, Pending, Failed

**Database Queries**:

```sql
-- Daily transaction summary
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_transactions,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as total_amount
FROM payment_gateway_transactions
WHERE gateway_name = 'KINA_BANK'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Failed transactions (last 7 days)
SELECT * FROM payment_gateway_transactions
WHERE status = 'failed'
AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### Webhook Logs

Check webhook delivery:

```sql
SELECT * FROM payment_gateway_webhooks
WHERE processed = false
ORDER BY created_at DESC;
```

### Reconciliation

Perform daily reconciliation:

1. Export transactions from Kina Bank merchant portal
2. Compare with PNG Green Fees transaction log
3. Investigate any discrepancies
4. Contact Kina Bank support if needed

---

## Troubleshooting

### Issue: "Gateway Not Available"

**Symptoms**: Error message when selecting Kina Bank IPG

**Solutions**:
1. Check if gateway is enabled in admin settings
2. Verify merchant ID and API key are correct
3. Check sandbox mode matches environment
4. Review browser console for errors

### Issue: Payment Redirect Fails

**Symptoms**: User not redirected to Kina Bank

**Solutions**:
1. Check API endpoint URL is correct
2. Verify API key is valid
3. Check network connectivity
4. Review transaction logs in Supabase
5. Check browser console for JavaScript errors

### Issue: Callback Not Received

**Symptoms**: Payment completes but voucher not generated

**Solutions**:
1. Verify callback URL with Kina Bank
2. Check webhook logs in Supabase
3. Ensure HTTPS is enabled
4. Check firewall rules
5. Test callback URL accessibility:
   ```bash
   curl https://your-domain.com/payment-callback?ref=TEST
   ```

### Issue: Transaction Stuck in "Pending"

**Symptoms**: Status never updates to success/failed

**Solutions**:
1. Manually verify with Kina Bank merchant portal
2. Update transaction status manually:
   ```sql
   UPDATE payment_gateway_transactions
   SET status = 'success',
       payment_date = NOW()
   WHERE merchant_reference = 'PGKB-YYYYMMDD-XXXXXX';
   ```
3. Contact Kina Bank support
4. Check webhook delivery

---

## API Reference (To Be Updated)

**Note**: This section will be updated once Kina Bank provides their official API documentation.

### Expected API Endpoints

**Initiate Payment**:
```
POST https://api.kinabank.com.pg/payment/initiate
```

**Verify Payment**:
```
GET https://api.kinabank.com.pg/payment/verify/{transaction_id}
```

**Webhook Callback**:
```
POST https://your-domain.com/api/payment-webhook
```

### Request/Response Format

To be documented based on Kina Bank API specs.

---

## Security Best Practices

### API Key Management

- Never commit API keys to version control
- Store keys encrypted in database
- Rotate keys periodically
- Use different keys for sandbox/production

### Data Protection

- All payment data transmitted over HTTPS
- Card details never stored in database
- Only last 4 digits stored for reference
- Full PCI-DSS compliance via Kina Bank

### Access Control

- Only Flex_Admin can configure gateway
- Transaction logs restricted by role
- Webhook endpoints validate source
- Rate limiting on payment endpoints

---

## Transaction Fees

- **Kina Bank Fee**: PGK 0.50 per transaction
- **Additional Fees**: Check with Kina Bank for card processing fees
- Fees are deducted by Kina Bank before settlement

---

## Support Contacts

### Kina Bank Support

- **Phone**: +675 308 3800
- **Toll-Free**: 180 1525
- **Email**: kina@kinabank.com.pg
- **Website**: https://www.kinabank.com.pg

### System Administrator

For technical issues with PNG Green Fees integration, contact your system administrator.

---

## Appendix: File Reference

### New Files Created

1. **Database Migration**:
   - `supabase/migrations/019_kina_bank_payment_gateway.sql`

2. **Service Layer**:
   - `src/lib/paymentGatewayService.js`

3. **Pages**:
   - `src/pages/PaymentCallback.jsx`
   - `src/pages/admin/PaymentGatewaySettings.jsx`

4. **Updated Files**:
   - `src/pages/IndividualPurchase.jsx` (payment flow)
   - `src/App.jsx` (routes)
   - `.env.example` (configuration template)

### Database Tables

- `payment_gateway_config`
- `payment_gateway_transactions`
- `payment_gateway_webhooks`
- `payment_modes` (updated)

---

## Future Enhancements

### Planned Features

1. **BSP Integration**: Bank South Pacific payment gateway
2. **Refund Processing**: Automated refund workflow
3. **Installment Payments**: Split payments over time
4. **Payment Links**: Email payment links to customers
5. **Recurring Payments**: Subscription-based fees

### Integration Roadmap

- **Phase 1** (Current): Kina Bank IPG for individual purchases ✓
- **Phase 2**: Extend to corporate purchases
- **Phase 3**: BSP integration
- **Phase 4**: Additional PNG payment providers

---

## Version History

- **v1.0** (2025-01-15): Initial Kina Bank integration
  - Database schema
  - Service layer implementation
  - Admin configuration UI
  - Payment callback handling
  - Documentation

---

## License & Disclaimer

This integration is provided as-is. PNG Green Fees System is not responsible for Kina Bank service availability or transaction processing. All payment disputes should be directed to Kina Bank customer support.
