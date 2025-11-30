# PNG Green Fees - Testing Plan for Laravel Template Features

**Date:** 2025-11-30
**Version:** 1.0
**Status:** Ready for Testing

---

## Overview

This testing plan covers the new features implemented based on the Laravel template analysis:
1. Barcode generation on vouchers
2. Enhanced invoice templates
3. Passport voucher receipts
4. Enhanced quotation PDFs

---

## Prerequisites

### System Requirements
- ✅ Node.js installed
- ✅ npm packages installed
- ✅ Development server running on http://localhost:3001
- ✅ jsbarcode library installed

### Test User Accounts
```
Flex Admin:
  Email: admin@greenpay.com
  Password: test123

Finance Manager:
  Email: finance@greenpay.com
  Password: test123

Counter Agent:
  Email: agent@greenpay.com
  Password: test123
```

### Test Data Needed
- Sample passport data
- Sample voucher data
- Sample quotation data
- Sample invoice data

---

## Testing Environment Setup

### Step 1: Start Development Server

```bash
cd /Users/nikolay/github/greenpay
npm run dev
```

**Expected Output:**
```
VITE v4.5.14  ready in 359 ms

➜  Local:   http://localhost:3001/
➜  Network: http://192.168.8.129:3001/
```

### Step 2: Open Browser
Navigate to: **http://localhost:3001**

### Step 3: Login
Use any of the test accounts listed above

---

## Test Suite 1: Barcode Generation on Vouchers

### Test 1.1: Individual Voucher with Barcode

**Objective:** Verify barcode appears on individual voucher printouts

**Steps:**
1. Login as **Counter Agent** (agent@greenpay.com)
2. Navigate to **Individual Purchase** page
3. Create a new voucher:
   - Passport Number: `N1234567`
   - Given Name: `John`
   - Surname: `Doe`
   - Nationality: `Australia`
   - Date of Birth: `1990-01-15`
   - Sex: `M`
   - Date of Expiry: `2028-12-31`
   - Amount: `100.00 PGK`
   - Payment Method: `CASH`
4. Submit the form
5. Click **"Print Voucher"** button
6. **Verify:**
   - ✅ QR code displays at top
   - ✅ **Barcode displays below QR code**
   - ✅ Barcode is readable (CODE-128 format)
   - ✅ Voucher code appears in human-readable text
   - ✅ All voucher details are correct

**Expected Result:**
- Voucher print dialog shows both QR code and barcode
- Barcode encodes the voucher code
- Print preview shows barcode correctly

**Screenshot:** Take screenshot of voucher with barcode

---

### Test 1.2: Barcode in Print Preview

**Objective:** Verify barcode appears in actual print output

**Steps:**
1. From previous test, click **"Print Voucher"** button
2. In print dialog, review the preview
3. **Verify:**
   - ✅ Barcode visible in print preview
   - ✅ Barcode quality is good (not pixelated)
   - ✅ Barcode positioned correctly
4. (Optional) Print to PDF and verify barcode

**Expected Result:**
- Barcode renders correctly in print preview
- Barcode is scannable (test with barcode scanner if available)

---

### Test 1.3: Multiple Vouchers

**Objective:** Verify barcodes generate uniquely for different vouchers

**Steps:**
1. Create 3 different vouchers with different codes
2. Print each voucher
3. **Verify:**
   - ✅ Each barcode is different
   - ✅ Each barcode matches its voucher code
   - ✅ All barcodes display correctly

**Expected Result:**
- Each voucher has unique barcode
- Barcodes are distinct and correct

---

## Test Suite 2: Enhanced Invoice Template

### Test 2.1: Invoice with Payment Details

**Objective:** Verify new payment details section appears on invoices

**Test Data:**
```javascript
{
  invoice_number: "INV-202511-0001",
  client_name: "Test Company Ltd",
  total_amount: 5000.00,
  payment_mode: "card",
  card_number: "4532123456789012", // Should show as ****9012
  card_holder: "JOHN DOE",
  collected_amount: 5000.00,
  returned_amount: 0
}
```

**Steps:**
1. Login as **Finance Manager**
2. Navigate to **Invoices** page
3. Create or view an existing invoice
4. Generate PDF
5. **Verify PDF Contains:**
   - ✅ **PAYMENT DETAILS** section
   - ✅ Payment Mode: CARD
   - ✅ Card Number: ****9012 (last 4 digits)
   - ✅ Card Holder: JOHN DOE
   - ✅ Amount Collected: K 5,000.00
   - ✅ Change Given: K 0.00 (or hidden if 0)

**Expected Result:**
- Payment details section displays correctly
- Card number is masked properly
- All financial details are accurate

**Screenshot:** Take PDF screenshot of payment details section

---

### Test 2.2: Invoice with Bank Details

**Objective:** Verify bank payment information section

**Steps:**
1. Generate same invoice from Test 2.1
2. Scroll to bank details section
3. **Verify:**
   - ✅ **PAYMENT INFORMATION** heading
   - ✅ Bank: Bank of Papua New Guinea
   - ✅ Account Name: Climate Change & Development Authority (CCDA)
   - ✅ Account Number: 1234567890
   - ✅ Swift Code: BPNGPGPM

**Expected Result:**
- Bank details section is clearly visible
- All information is formatted correctly

---

### Test 2.3: Invoice with PO Reference

**Objective:** Verify Purchase Order reference field

**Test Data:**
```javascript
{
  purchase_order_reference: "PO-2025-001"
}
```

**Steps:**
1. Create invoice with PO reference
2. Generate PDF
3. **Verify:**
   - ✅ PO Reference field appears in header section
   - ✅ Shows: "PO Reference: PO-2025-001"

**Expected Result:**
- PO reference displays in invoice header
- Field is optional (doesn't break if missing)

---

### Test 2.4: Invoice with Terms & Conditions

**Objective:** Verify T&C section appears at bottom

**Steps:**
1. Generate any invoice PDF
2. Scroll to bottom of invoice
3. **Verify T&C Section Contains:**
   - ✅ **TERMS & CONDITIONS** heading
   - ✅ Payment due within 30 days
   - ✅ Vouchers valid for specified period
   - ✅ Non-refundable policy
   - ✅ Contact information
   - ✅ Bank transfer instructions

**Expected Result:**
- T&C section displays with all 5 points
- Text is readable and properly formatted

**Screenshot:** Take screenshot of T&C section

---

### Test 2.5: Cash Payment Invoice

**Objective:** Verify cash payments show correctly

**Test Data:**
```javascript
{
  payment_mode: "cash",
  collected_amount: 5500.00,
  returned_amount: 500.00 // Change given
}
```

**Steps:**
1. Create invoice with cash payment
2. Generate PDF
3. **Verify:**
   - ✅ Payment Mode: CASH
   - ✅ Amount Collected: K 5,500.00
   - ✅ Change Given: K 500.00
   - ✅ No card details shown

**Expected Result:**
- Cash-specific fields display correctly
- Change calculation is accurate

---

## Test Suite 3: Passport Voucher Receipt Component

### Test 3.1: Create Passport Voucher Receipt

**Objective:** Test new PassportVoucherReceipt component

**Note:** This component needs to be integrated into a page. For testing, we'll need to:

**Steps:**
1. Create a test page or add to existing passport page
2. Import PassportVoucherReceipt component
3. Pass test data:

```javascript
const testVoucher = {
  voucher_code: "ABCD1234567890",
  amount: 100.00,
  valid_until: "2025-12-31",
  created_at: new Date()
};

const testPassport = {
  passport_number: "N1234567",
  given_name: "JOHN",
  surname: "DOE",
  nationality: "AUSTRALIA",
  dob: "1990-01-15"
};
```

4. Click to open receipt
5. **Verify Display:**
   - ✅ **"🌿 GREEN CARD"** header (green #2c5530)
   - ✅ Subtitle: "Foreign Passport Holder"
   - ✅ Travel Document Number field
   - ✅ Full Name field
   - ✅ Nationality field
   - ✅ Date of Birth field
   - ✅ **Barcode** displays
   - ✅ Voucher code: "Coupon: ABCD1234567890"
   - ✅ **QR Code** displays
   - ✅ "Scan to Register" text

**Expected Result:**
- Receipt displays with GREEN CARD branding
- Both barcode and QR code visible
- All passport data populated correctly

**Screenshot:** Take screenshot of GREEN CARD receipt

---

### Test 3.2: Print Passport Receipt

**Objective:** Verify receipt prints correctly

**Steps:**
1. From Test 3.1, click **"Print Receipt"** button
2. Review print preview
3. **Verify:**
   - ✅ GREEN CARD branding maintained
   - ✅ Barcode prints clearly
   - ✅ QR code prints clearly
   - ✅ All text is readable
   - ✅ Border and styling preserved

**Expected Result:**
- Receipt prints with proper formatting
- Codes are scannable in print

---

## Test Suite 4: Enhanced Quotation PDF

### Test 4.1: Generate Quotation PDF

**Objective:** Test new QuotationPDF component

**Test Data:**
```javascript
const testQuotation = {
  quotation_number: "QT-000001",
  client_name: "ABC Company Ltd",
  client_email: "contact@abc.com",
  client_phone: "+675 123 4567",
  subject: "Government Exit Pass Vouchers",
  total_vouchers: 100,
  voucher_value: 50.00,
  total_amount: 5000.00,
  discount_percentage: 10,
  discount_amount: 500.00,
  amount_after_discount: 4500.00,
  validity_date: "2025-12-31",
  created_at: new Date(),
  creator_name: "John Smith"
};
```

**Steps:**
1. Navigate to Quotations page
2. View or create quotation with above data
3. Click **"Download PDF"** button
4. **Verify PDF Contains:**

   **Header:**
   - ✅ "QUOTATION" title centered
   - ✅ Green border around page
   - ✅ Quotation #: QT-000001
   - ✅ Subject displayed
   - ✅ Date displayed

   **From/To Sections (Two Columns):**
   - ✅ Left: "QUOTATION FROM"
     - Climate Change & Development Authority
     - Email: info@ccda.gov.pg
     - Phone: +675 323 0111
     - Port Moresby, PNG
   - ✅ Right: "QUOTATION TO"
     - Client name: ABC Company Ltd
     - Email: contact@abc.com
     - Quotation Date
     - Valid Until date

   **Services Table:**
   - ✅ Green header row
   - ✅ Columns: SERVICE DESCRIPTION | UNIT PRICE | QUANTITY | TOTAL
   - ✅ Row: "Government Exit Pass Vouchers"
   - ✅ Description: "Official exit pass vouchers..."
   - ✅ Unit Price: K 50.00
   - ✅ Quantity: 100
   - ✅ Total: K 5,000.00

   **Totals:**
   - ✅ Subtotal: K 5,000.00
   - ✅ Discount (10%): -K 500.00
   - ✅ **TOTAL:** K 4,500.00 (highlighted)

   **Footer:**
   - ✅ "Thank you for your business!"
   - ✅ Signature box with creator name
   - ✅ CCDA organization name

**Expected Result:**
- PDF downloads successfully
- All sections display correctly
- Colors match (#66b958, #2c5530)
- Layout is professional

**Screenshot:** Take PDF screenshot

---

### Test 4.2: Quotation with Terms & Conditions

**Objective:** Verify optional T&C section

**Test Data:**
```javascript
{
  ...testQuotation,
  terms_conditions: "Payment due within 30 days. Vouchers are valid for the specified period. All sales are final."
}
```

**Steps:**
1. Create quotation with T&C
2. Generate PDF
3. **Verify:**
   - ✅ **TERMS & CONDITIONS** section appears
   - ✅ Light gray background
   - ✅ Green left border
   - ✅ Text content matches input

**Expected Result:**
- T&C section displays when provided
- Formatted with background and border

---

### Test 4.3: Quotation with Notes

**Objective:** Verify optional notes section

**Test Data:**
```javascript
{
  ...testQuotation,
  notes: "This is a bulk order for corporate account. Contact John Smith for delivery arrangements."
}
```

**Steps:**
1. Create quotation with notes
2. Generate PDF
3. **Verify:**
   - ✅ **ADDITIONAL NOTES** section appears
   - ✅ Light gray background
   - ✅ Green left border
   - ✅ Notes content displays

**Expected Result:**
- Notes section displays when provided
- Same styling as T&C section

---

### Test 4.4: Email Quotation Button

**Objective:** Test email functionality (if implemented)

**Steps:**
1. From quotation view, click **"Email Quotation"** button
2. **Verify:**
   - ✅ Email dialog opens
   - ✅ PDF attached to email
   - ✅ Email sent successfully

**Expected Result:**
- Email dialog functional
- PDF attached correctly
- (Optional) Verify recipient receives email

---

## Test Suite 5: Integration Tests

### Test 5.1: Complete Workflow Test

**Objective:** Test entire workflow from quotation to invoice

**Steps:**
1. **Create Quotation:**
   - Login as Finance Manager
   - Create quotation with 50 vouchers @ K 100.00 each
   - Save quotation

2. **Generate Quotation PDF:**
   - Click "Download PDF"
   - Verify enhanced quotation template
   - Verify CCDA branding

3. **Create Invoice (Manual or via conversion):**
   - Create invoice linked to quotation
   - Payment: Card
   - PO Reference: PO-2025-TEST

4. **Generate Invoice PDF:**
   - Verify enhanced invoice template
   - Verify payment details section
   - Verify bank details section
   - Verify T&C section

5. **Create Vouchers:**
   - Generate vouchers for the order
   - Print one voucher
   - Verify QR code + barcode

**Expected Result:**
- Complete workflow functions smoothly
- All new features work together
- PDFs generate correctly at each step

---

### Test 5.2: Cross-Browser Testing

**Objective:** Verify features work in different browsers

**Browsers to Test:**
- ✅ Chrome
- ✅ Firefox
- ✅ Safari (if on Mac)
- ✅ Edge

**For Each Browser:**
1. Generate voucher with barcode
2. Generate invoice PDF
3. Generate quotation PDF
4. **Verify:**
   - ✅ Barcodes display correctly
   - ✅ PDFs download correctly
   - ✅ Print functions work
   - ✅ Styling is consistent

**Expected Result:**
- Features work across all browsers
- No browser-specific issues

---

## Test Suite 6: Error Handling

### Test 6.1: Missing Data Handling

**Objective:** Verify graceful handling of missing fields

**Steps:**
1. Create voucher without all fields
2. Generate PDF
3. **Verify:**
   - ✅ Barcode still generates if code exists
   - ✅ Missing fields show "N/A" or are hidden
   - ✅ No JavaScript errors in console

**Expected Result:**
- System handles missing data gracefully
- No crashes or errors

---

### Test 6.2: Invalid Barcode Data

**Objective:** Test barcode generation with invalid data

**Steps:**
1. Try to generate barcode with:
   - Empty string
   - Special characters
   - Very long string
2. **Verify:**
   - ✅ Error handling prevents crash
   - ✅ User sees friendly error message
   - ✅ Or: Invalid codes are filtered out

**Expected Result:**
- System validates barcode data
- Handles errors gracefully

---

## Test Suite 7: Performance Tests

### Test 7.1: PDF Generation Speed

**Objective:** Verify PDFs generate quickly

**Steps:**
1. Generate quotation PDF - note time
2. Generate invoice PDF - note time
3. Generate voucher PDF - note time
4. **Verify:**
   - ✅ Each PDF generates in < 2 seconds
   - ✅ No browser lag or freeze
   - ✅ UI remains responsive

**Expected Result:**
- PDFs generate quickly
- Good user experience

---

### Test 7.2: Multiple Barcodes Performance

**Objective:** Test barcode generation with many vouchers

**Steps:**
1. Create batch of 10 vouchers
2. Print each voucher
3. Monitor performance
4. **Verify:**
   - ✅ Barcodes generate quickly
   - ✅ No memory issues
   - ✅ Browser remains responsive

**Expected Result:**
- System handles multiple barcodes efficiently

---

## Test Results Template

For each test, record results using this template:

```
Test ID: [e.g., 1.1]
Test Name: [e.g., Individual Voucher with Barcode]
Date Tested: [YYYY-MM-DD]
Tester: [Your Name]
Browser: [Chrome/Firefox/etc.]
Result: [PASS/FAIL]
Issues Found: [List any issues]
Screenshots: [Attach or reference]
Notes: [Additional observations]
```

---

## Bug Report Template

If you find bugs, use this template:

```
Bug ID: BUG-001
Severity: [Critical/High/Medium/Low]
Component: [Barcode/Invoice/Quotation/Receipt]
Description: [What happened]
Steps to Reproduce:
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]
Expected: [What should happen]
Actual: [What actually happened]
Screenshot: [Attach if applicable]
Console Errors: [Copy any errors]
Browser: [Chrome 120.0]
Date Found: [YYYY-MM-DD]
```

---

## Post-Testing Checklist

After completing all tests:

- [ ] All test cases executed
- [ ] Results documented
- [ ] Screenshots collected
- [ ] Bugs reported
- [ ] Performance acceptable
- [ ] Cross-browser tested
- [ ] User acceptance obtained
- [ ] Documentation updated
- [ ] Ready for production

---

## Quick Test Summary

**Estimated Testing Time:** 2-3 hours

**Priority Tests (Must Pass):**
1. Test 1.1 - Barcode on vouchers
2. Test 2.1 - Invoice payment details
3. Test 2.4 - Invoice T&C
4. Test 4.1 - Enhanced quotation PDF

**Optional Tests (Nice to Have):**
- Cross-browser testing
- Performance tests
- Error handling tests

---

## Contact for Issues

If you encounter any issues during testing:

1. Check browser console for errors
2. Take screenshots
3. Note exact steps to reproduce
4. Document using bug report template above

---

## Success Criteria

Testing is successful when:
- ✅ All barcodes generate and display correctly
- ✅ Enhanced invoice template shows all new sections
- ✅ Passport receipts display GREEN CARD branding
- ✅ Enhanced quotations show CCDA branding
- ✅ All PDFs download and print correctly
- ✅ No critical bugs found
- ✅ Performance is acceptable
- ✅ User acceptance obtained

---

**End of Testing Plan**
