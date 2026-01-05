# BSP IPG Sandbox Integration Guide

## Current Status ✅

Your GreenPay system **already has a payment gateway architecture in place** with:
- ✅ Payment Gateway Factory pattern
- ✅ BSPGateway class (placeholder ready for implementation)
- ✅ Frontend payment gateway settings UI
- ✅ Stripe integration (for testing)
- ✅ Database schema for gateway transactions

## What You Need from BSP 📋

To integrate BSP IPG Sandbox, you need the following from BSP:

### 1. Sandbox Credentials
- **Merchant ID** - Your unique merchant identifier
- **API Key / Secret Key** - Authentication credentials
- **Webhook Secret** - For verifying webhook signatures

### 2. Sandbox API Endpoints
- **Base URL** - Sandbox API endpoint (e.g., `https://sandbox.bsp.com.pg/ipg/api`)
- **Payment Initiation Endpoint** - To create payment sessions
- **Payment Status/Verification Endpoint** - To check payment status
- **Refund Endpoint** - To process refunds
- **Webhook URL** - Where BSP will send payment notifications

### 3. API Documentation
You need documentation for:
- **Authentication method** (API Key, Bearer Token, HMAC, etc.)
- **Request/Response formats** (JSON, XML, etc.)
- **Required headers** (Content-Type, Authorization, etc.)
- **Payment initiation parameters**:
  - Amount (format: decimal, integer in toea?)
  - Currency code
  - Customer details (email, phone)
  - Return/callback URLs
  - Merchant reference ID
- **Payment status codes** and their meanings
- **Webhook payload format** and signature verification
- **Error codes** and handling
- **Supported payment methods** (cards, mobile money, etc.)

### 4. Test Cards/Accounts
- Test credit/debit card numbers for successful payments
- Test card numbers for failed payments
- Test scenarios (insufficient funds, expired card, etc.)

## Environment Variables to Add

Add these to your `.env` file once you receive BSP credentials:

```bash
# BSP IPG Sandbox Configuration
BSP_MERCHANT_ID=your_merchant_id_here
BSP_API_KEY=your_api_key_here
BSP_WEBHOOK_SECRET=your_webhook_secret_here
BSP_SANDBOX_URL=https://sandbox.bsp.com.pg/ipg/api
BSP_MODE=sandbox

# Optional: Specify which gateway to use (stripe for testing, bsp for BSP)
PAYMENT_GATEWAY=stripe  # Change to 'bsp' when ready to test BSP
```

## Implementation Steps

Once you have the BSP documentation and credentials:

### Step 1: Update BSPGateway.js
File: `backend/services/payment-gateways/BSPGateway.js`

Replace the TODO sections with actual BSP API calls:

```javascript
async createPaymentSession(params) {
  // Replace lines 37-89 with actual BSP API integration
  const response = await fetch(`${this.getEndpoint()}/payment/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      // Add any other required headers from BSP documentation
    },
    body: JSON.stringify({
      // Map our params to BSP's expected format
      merchant_id: this.config.merchantId,
      amount: params.amountPGK,
      currency: params.currency,
      // ... other required fields from BSP docs
    })
  });

  const data = await response.json();

  return {
    paymentUrl: data.payment_url,  // BSP's payment page URL
    sessionId: data.session_id,    // BSP's session ID
    expiresAt: new Date(data.expires_at),
    metadata: data
  };
}
```

### Step 2: Configure Webhook Endpoint
Your webhook endpoint is ready at: `https://greenpay.eywademo.cloud/api/payment/webhook`

You need to:
1. Register this URL with BSP in their merchant portal
2. Implement signature verification in `BSPGateway.verifyWebhookSignature()` (line 125)
3. Map BSP webhook events to our status codes in `processWebhookEvent()` (line 146)

### Step 3: Test with Both Gateways

The system supports multiple gateways simultaneously:

**Option A: Frontend Gateway Selection**
Add a gateway selector in the buy-online page:
```jsx
<select onChange={(e) => setSelectedGateway(e.target.value)}>
  <option value="stripe">Stripe (Testing)</option>
  <option value="bsp">BSP Bank (Sandbox)</option>
</select>
```

**Option B: Admin Setting (Current)**
Use the Payment Gateway Settings page (`/app/admin/payment-gateway-settings`) to activate BSP and configure credentials.

**Option C: Environment Variable**
Set `PAYMENT_GATEWAY=bsp` in `.env` to make BSP the default.

### Step 4: Database Schema

The system already has the required tables:
- `payment_gateway_transactions` - Stores all payment transactions
- `payment_gateway_configs` - Stores gateway configurations

No database changes needed!

### Step 5: Testing Flow

1. **Configure BSP credentials** in Payment Gateway Settings UI
2. **Activate BSP gateway** (toggle switch in admin)
3. **Test buy-online flow**:
   - Go to https://greenpay.eywademo.cloud/buy-online
   - Select quantity and enter customer details
   - Click "Proceed to Payment"
   - Should redirect to BSP sandbox payment page
   - Complete payment with test card
   - Should redirect back to success page
   - Verify voucher was created

4. **Test webhooks**:
   - BSP should send webhook to your endpoint
   - Check backend logs for webhook processing
   - Verify transaction status updated in database

## Files You'll Need to Modify

1. **backend/services/payment-gateways/BSPGateway.js** (Main implementation)
   - `createPaymentSession()` - Lines 24-90
   - `verifyPaymentSession()` - Lines 92-123
   - `verifyWebhookSignature()` - Lines 125-144
   - `processWebhookEvent()` - Lines 146-171
   - `processRefund()` - Lines 173-211

2. **backend/routes/buy-online.js** (No changes needed - already uses factory pattern)

3. **.env** (Add BSP credentials)

4. **src/pages/PublicVoucherPurchase.jsx** (Optional - add gateway selection UI)

## Questions to Ask BSP

When contacting BSP for sandbox access, ask:

1. **Sandbox Environment Setup**
   - What is the sandbox base URL?
   - How do we obtain sandbox merchant credentials?
   - Is there a test merchant portal?

2. **API Integration**
   - What authentication method do you use? (API Key, OAuth, etc.)
   - Do you have a Postman collection or API specification?
   - What are the required HTTP headers?
   - What is the payment initiation request/response format?

3. **Testing**
   - What test card numbers can we use?
   - Are there specific test scenarios (declined, insufficient funds)?
   - Can we test refunds in sandbox?

4. **Webhooks**
   - What is the webhook payload format?
   - How do we verify webhook signatures?
   - What webhook events do you send?
   - Can we test webhooks in sandbox?

5. **Go-Live Process**
   - What is the process to move from sandbox to production?
   - What compliance/security requirements must we meet?
   - Is there a UAT/staging environment?

## Next Steps

1. **Contact BSP** - Email servicebsp@bsp.com.pg or call +675 3201212
2. **Request sandbox access** and documentation
3. **Receive credentials** and API documentation
4. **Implement BSPGateway** using the documentation
5. **Test in sandbox** with test cards
6. **Deploy to production** after UAT
7. **Switch to production** credentials and endpoints

## Support

Your architecture is ready! Once you have BSP documentation and credentials, implementation should take 2-4 hours.

**Files ready for BSP integration:**
- ✅ `backend/services/payment-gateways/BSPGateway.js`
- ✅ `backend/services/payment-gateways/PaymentGatewayFactory.js`
- ✅ `backend/routes/buy-online.js`
- ✅ `src/pages/admin/PaymentGatewaySettings.jsx`
- ✅ Database schema

**Contact:**
- BSP Email: servicebsp@bsp.com.pg
- BSP Phone: +675 3201212
