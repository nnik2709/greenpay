# Deployment Files - Finance Manager Corporate Voucher Generation

## Backend Files to Deploy:

1. **backend/routes/vouchers.js**
   - Updated `/api/vouchers/bulk-corporate` endpoint
   - Creates invoice after voucher generation for Finance_Manager and Flex_Admin roles
   - Handles discount, collected amount, payment method
   - Creates payment records

2. **backend/routes/invoices-gst.js**
   - Fixed payment method lookup in voucher generation from invoice
   - Gets payment method from invoice_payments table

## Frontend Files to Deploy:

3. **src/lib/corporateVouchersService.js**
   - Updated to pass discount and collectedAmount to backend API

4. **src/pages/CorporateExitPass.jsx**
   - Updated to include discount and collectedAmount in API request

## Frontend Build (Production):

5. **dist/** folder (entire contents)
   - Built production-ready frontend
   - Deploy all files in the dist/ folder

---

## Summary of Changes:

### Scenario 1: Ad Hoc Generation (Payment → Vouchers → Invoice)
- Finance_Manager and Flex_Admin can generate vouchers directly
- Invoice is automatically created after vouchers are generated
- Invoice is marked as paid (since payment was received upfront)
- Payment record is created in invoice_payments table

### Scenario 2: Pre-paid Workflow (Already Exists)
- Quotation → Invoice → Payment → Vouchers
- No changes needed, already working

### Scenario 3: Direct Voucher Generation
- Select existing paid invoice → Generate vouchers
- Prevents duplicate generation (already implemented)

