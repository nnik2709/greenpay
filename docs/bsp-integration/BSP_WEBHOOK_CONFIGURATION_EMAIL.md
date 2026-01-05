# Email to BSP for Webhook Configuration

---

**To:** servicebsp@bsp.com.pg
**Subject:** GreenPay - BSP DOKU Webhook URLs Configuration Request
**Priority:** Normal

---

Dear BSP Team,

Thank you for enabling the webhook functionality for our GreenPay integration.

We are ready to begin testing and would like to request that you configure the following webhook URLs in your DOKU payment gateway system for our merchant account.

## Merchant Details

**Merchant Name:** GreenPay
**Business:** Papua New Guinea Green Fees Payment System
**Mall ID:** `[Your BSP_DOKU_MALL_ID from .env file]`
**Environment:** Staging/Test (will switch to Production after successful testing)

## Webhook URLs to Configure

### 1. Notify URL (Server-to-Server Callback)

**URL:** `https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify`
**Method:** POST
**Content-Type:** application/json
**Expected Response:** Text "CONTINUE"
**Purpose:** Real-time payment status notification

This endpoint will:
- Receive payment status updates in real-time
- Validate the WORDS signature for security
- Update our transaction database
- Respond with "CONTINUE" to complete the transaction

### 2. Redirect URL (Customer Browser Redirect)

**URL:** `https://greenpay.eywademo.cloud/api/payment/webhook/doku/redirect`
**Method:** POST
**Content-Type:** application/json
**Expected Response:** HTTP 302 Redirect
**Purpose:** Customer redirect after payment completion

This endpoint will:
- Redirect successful payments to: `/payment/success?session=xxx`
- Redirect failed payments to: `/payment/failure?error=xxx`
- Provide feedback to customers about their payment status

## Technical Implementation Details

Our webhook endpoints include the following security features:

✅ **IP Whitelisting**: Only accepts requests from BSP DOKU IP addresses
✅ **Signature Verification**: Validates WORDS signature using SHA1 hash
✅ **HTTPS/SSL**: All communication encrypted via SSL certificate
✅ **Rate Limiting**: Protection against abuse (100 requests/minute per IP)
✅ **Request Validation**: Checks all required parameters are present
✅ **Logging**: Comprehensive logging for debugging and audit trail

## Testing Readiness

We have:
- ✅ Deployed webhook endpoints to production server
- ✅ Verified endpoints are accessible and responding correctly
- ✅ Configured database to store transaction records
- ✅ Implemented proper error handling and logging
- ✅ Set up monitoring and alerting
- ✅ Prepared test scenarios

## Request

Please:

1. **Configure the webhook URLs** in your DOKU system for our merchant account
2. **Confirm configuration** via email when complete
3. **Provide test transaction guidance** so we can verify the integration works correctly
4. **Share expected webhook payload examples** if not already in the documentation

## Timeline

We are ready to test immediately upon confirmation that webhooks are configured.

Estimated testing time: 1-2 hours to complete full payment flow testing.

## Support Contact

**Technical Contact:**
Name: [Your Name]
Email: [Your Email]
Phone: [Your Phone]

**Business Contact:**
Name: [Business Contact Name]
Email: [Business Contact Email]
Phone: [Business Contact Phone]

## Next Steps

Once you confirm webhook configuration:

1. We will make a small test payment (e.g., PGK 1.00)
2. Monitor webhook notifications in real-time
3. Verify transaction status updates correctly in our database
4. Confirm customer redirect works as expected
5. Report results back to you

If successful, we will proceed with:
- Additional test payments with various scenarios
- Production deployment planning
- Go-live coordination

## Questions

Do you need any additional information from us?
- Server IP addresses for whitelist?
- Specific testing schedule?
- Additional technical documentation?

Please let us know if you need any clarification or additional details.

We appreciate your support and look forward to completing this integration successfully.

---

Best regards,

**[Your Name]**
[Your Title]
GreenPay - PNG Green Fees System

Email: [Your Email]
Phone: [Your Phone]
Website: https://greenpay.eywademo.cloud

---

## Attachments

- BSP_WEBHOOK_TESTING_GUIDE.md (Testing procedures and expected behavior)
- Technical documentation (if needed)

---

**Note:** This email contains webhook URLs that are live and tested. We have verified they are accessible and functioning correctly with proper security measures in place.
