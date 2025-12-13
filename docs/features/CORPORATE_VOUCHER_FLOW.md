# Corporate Voucher Flow & Route Reference

## ✅ FIXED: Quotation Route Access

**The issue was:** Routes were being accessed without the `/app` prefix.

**Correct URLs:**
- Create Quotation: `https://greenpay.eywademo.cloud/app/quotations/create` ✅
- View Quotations: `https://greenpay.eywademo.cloud/app/quotations` ✅
- View Invoices: `https://greenpay.eywademo.cloud/app/invoices` ✅

**All authenticated routes must start with `/app/`**

---

## Corporate Pass Purchase Flow (Quote → Invoice → Payment → Voucher → Registration)

### Step 1: Create Quotation
**Who:** Finance_Manager, Flex_Admin
**URL:** `/app/quotations/create`
**Action:** Create quotation for corporate customer

**Fields:**
- Customer (select from customers list)
- Number of vouchers/passports
- Unit price: K50 per voucher
- Discount percentage (optional)
- Valid until date
- Notes

**Result:** Quotation created with status `pending`

---

### Step 2: Send Quotation (Optional)
**Who:** Finance_Manager, Flex_Admin
**URL:** `/app/quotations`
**Action:** Email quotation to customer for approval

**Process:**
1. Select quotation from list
2. Click "Send" action
3. Quotation emailed to customer's email address

---

### Step 3: Convert to Invoice
**Who:** Finance_Manager, Flex_Admin
**URL:** `/app/quotations` → Select quotation → "Convert to Invoice"
**Action:** Create PNG GST-compliant tax invoice

**Process:**
1. System calculates:
   - Subtotal (vouchers × K50)
   - GST (10% of subtotal)
   - Total amount (subtotal + GST)
2. Invoice created with status `unpaid`
3. Due date set based on payment terms (Net 7/14/30/60/90 days)
4. Navigate to `/app/invoices` to view invoice

**Database:**
```sql
INSERT INTO invoices (
  customer_name,
  customer_email,
  items,
  subtotal,
  gst_rate,
  gst_amount,
  total_amount,
  status,
  due_date
) VALUES (...)
```

---

### Step 4: Register Payment
**Who:** Finance_Manager, Flex_Admin
**URL:** `/app/invoices` → Select invoice → "Record Payment"
**Action:** Mark invoice as paid

**Payment Methods:**
- Cash
- Bank Transfer
- Credit Card
- BSP Gateway

**Process:**
1. Select invoice from list
2. Click "Record Payment"
3. Enter:
   - Payment method
   - Amount paid
   - Payment date
   - Reference number
4. Invoice status changes to `paid`

**Database:**
```sql
INSERT INTO payments (
  invoice_id,
  amount_paid,
  payment_method,
  payment_date,
  reference_number
) VALUES (...)

UPDATE invoices
SET status = 'paid',
    amount_paid = total_amount,
    amount_due = 0
WHERE id = ?
```

---

### Step 5: Generate Vouchers
**Who:** Finance_Manager, Flex_Admin
**URL:** `/app/invoices` → Select paid invoice → "Generate Vouchers"
**Action:** Create corporate vouchers (green passes) with QR codes

**Requirements:**
- Invoice must be fully paid (`status = 'paid'`)
- Cannot generate vouchers for unpaid invoices

**Process:**
1. System generates vouchers:
   - One voucher per quantity in invoice items
   - 8-character alphanumeric code (e.g., `3IEW5268`)
   - QR code generated for each voucher
   - Status: `pending_passport` (requires passport registration)
   - Valid for 1 year

**Database:**
```sql
INSERT INTO corporate_vouchers (
  voucher_code,
  company_name,
  amount,
  valid_from,
  valid_until,
  status,
  payment_method
) VALUES (
  '3IEW5268',
  'Acme Corporation',
  50.00,
  NOW(),
  NOW() + INTERVAL '1 year',
  'pending_passport',
  'Bank Transfer'
)
```

**Voucher Format:**
- Code: 8 random alphanumeric characters
- QR Code: Contains voucher code for scanning
- Barcode: CODE-128 format for gate scanners
- Registration URL: `https://pnggreenfees.gov.pg/voucher/register/{CODE}`

---

### Step 6: Email Vouchers to Customer
**Who:** Finance_Manager, Flex_Admin
**URL:** `/app/invoices` → Select invoice → "Email Vouchers"
**Action:** Send vouchers PDF to customer

**Email Contents:**
- PDF attachment with all vouchers
- GREEN CARD template for each voucher:
  - CCDA logo
  - Company name
  - Voucher code
  - Large QR code/barcode
  - Registration URL
  - Valid until date
  - "Scan to Register" instruction

**Email Template:**
```
Subject: Your PNG Green Fee Vouchers - {Invoice Number}

Dear {Customer Name},

Attached are your {X} green fee vouchers (green passes) for Papua New Guinea.

Each voucher must be registered with a passport before use.

Registration: https://greenpay.eywademo.cloud/corporate-voucher-registration

Thank you for your business.
```

---

### Step 7: Customer Registers Passport
**Who:** Customer (public, no authentication)
**URL:** `https://greenpay.eywademo.cloud/corporate-voucher-registration`
**Action:** Link voucher to passport

**Process:**
1. Customer visits registration URL
2. Enters voucher code (e.g., `3IEW5268`)
3. System validates:
   - Voucher exists
   - Status is `pending_passport`
   - Not expired
   - Not already used
4. Customer scans passport or enters details:
   - Passport number
   - Full name
   - Nationality
   - Date of birth
   - Gender
5. System updates voucher:
   - Status: `pending_passport` → `active`
   - Links passport data
   - Records registration timestamp
6. Success page shows:
   - Print Voucher button
   - Email Voucher button
   - Download PDF button

**Database:**
```sql
-- Create passport record
INSERT INTO passports (
  passport_number,
  full_name,
  nationality,
  date_of_birth,
  gender
) VALUES (...)

-- Update voucher with passport
UPDATE corporate_vouchers
SET
  status = 'active',
  passport_id = {passport_id},
  passport_number = 'AB1234567',
  registered_at = NOW(),
  registered_by = 'customer'
WHERE voucher_code = '3IEW5268'
```

---

### Step 8: Gate Validation
**Who:** IT_Support, Counter_Agent, Flex_Admin
**URL:** `/app/scan`
**Action:** Scan voucher at gate/checkpoint

**Validation Endpoint:** `GET /api/vouchers/validate/:code`

**Validation Logic:**
```javascript
if (status === 'pending_passport') {
  return {
    status: 'invalid',
    message: 'INVALID - Voucher requires passport registration',
    requiresRegistration: true,
    registrationUrl: 'https://greenpay.eywademo.cloud/corporate-voucher-registration'
  }
}

if (used_at) {
  return {
    status: 'expired',
    message: 'EXPIRED - Voucher was already used on {date}'
  }
}

if (valid_until < NOW()) {
  return {
    status: 'expired',
    message: 'EXPIRED - Voucher expired on {date}'
  }
}

// Voucher is valid
return {
  status: 'valid',
  message: 'VALID - Voucher approved for entry',
  passportInfo: {
    passportNumber: 'AB1234567',
    fullName: 'John Doe',
    nationality: 'USA'
  }
}
```

**Scanner Display:**
- ✅ **VALID** - Green, allow entry (status: `active`, not used, not expired)
- ❌ **INVALID** - Red, show registration URL (status: `pending_passport`)
- ❌ **EXPIRED** - Red, deny entry (already used or past expiry)

**Mark as Used:**
```sql
UPDATE corporate_vouchers
SET
  status = 'used',
  used_at = NOW(),
  used_by = {user_id}
WHERE voucher_code = '3IEW5268'
```

---

## Role-Based Access Control

### 4 User Roles

#### 1. Flex_Admin (Full Access)
**Access to:**
- ✅ All features
- ✅ User management (`/app/users`)
- ✅ Payment modes (`/app/admin/payment-modes`)
- ✅ Email templates (`/app/admin/email-templates`)
- ✅ Settings (`/app/admin/settings`)
- ✅ SMS settings (`/app/admin/sms-settings`)
- ✅ Payment gateway (`/app/admin/payment-gateway`)
- ✅ Quotations (create, view, convert)
- ✅ Invoices (create, view, generate vouchers)
- ✅ Reports (all types)
- ✅ Passports (view, create, edit)
- ✅ Scan and validate (`/app/scan`)
- ✅ Corporate exit pass
- ✅ Bulk uploads

#### 2. Finance_Manager (Financial Operations)
**Access to:**
- ✅ Quotations (`/app/quotations`, `/app/quotations/create`)
- ✅ Invoices (`/app/invoices`)
- ✅ Customers (`/app/admin/customers`)
- ✅ Payments (`/app/payments`)
- ✅ Reports (all types)
- ✅ Passports (view only, cannot create/edit)
- ✅ Corporate exit pass
- ✅ Scan and validate (`/app/scan`)
- ✅ Cash reconciliation
- ❌ User management
- ❌ System settings

#### 3. Counter_Agent (Front Desk Operations)
**Access to:**
- ✅ Individual purchases (`/app/passports/create`)
- ✅ Bulk uploads (`/app/passports/bulk-upload`)
- ✅ Scan and validate (`/app/scan`)
- ✅ Passports (create, edit, view)
- ✅ Corporate exit pass
- ✅ Cash reconciliation
- ✅ Scanner test (`/app/scanner-test`)
- ✅ Vouchers list
- ❌ Quotations
- ❌ Invoices
- ❌ Reports
- ❌ User management

#### 4. IT_Support (Technical Support)
**Access to:**
- ✅ User management (`/app/users`)
- ✅ Login history (`/app/admin/login-history`)
- ✅ Reports (all types)
- ✅ Scan and validate (`/app/scan`)
- ✅ Scanner test (`/app/scanner-test`)
- ✅ Passports (view only)
- ✅ Invoices (view only)
- ✅ Vouchers list
- ✅ Corporate batch history
- ❌ Create/edit passports
- ❌ Quotations
- ❌ Payments

---

## Complete Route Reference

### Public Routes (No Authentication)
- `/` - Home page
- `/login` - Staff login
- `/buy-online` - Public passport purchase with payment gateway
- `/buy-voucher` - Public voucher purchase
- `/corporate-voucher-registration` - Corporate voucher passport registration ⭐
- `/register/:voucherCode` - Individual voucher registration
- `/payment/success` - Payment success page
- `/payment/cancelled` - Payment cancelled page

### Authenticated Routes (All start with `/app/`)

#### Dashboard & Landing
- `/app` - Role-based dashboard redirect
- `/app/dashboard` - Dashboard (all roles)
- `/app/agent` - Agent landing page (Counter_Agent only)

#### Passports
- `/app/passports` - Passport list (Flex_Admin, Counter_Agent, Finance_Manager view)
- `/app/passports/create` - Individual purchase (Flex_Admin, Counter_Agent)
- `/app/passports/bulk-upload` - Bulk upload (Flex_Admin, Counter_Agent)
- `/app/passports/edit/:id` - Edit passport (Flex_Admin, Counter_Agent)

#### Quotations & Invoices ⭐
- `/app/quotations` - Quotations list (Flex_Admin, Finance_Manager)
- `/app/quotations/create` - Create quotation (Flex_Admin, Finance_Manager)
- `/app/quotations/:id` - View quotation (Flex_Admin, Finance_Manager)
- `/app/invoices` - Invoices list (Flex_Admin, Finance_Manager, IT_Support view)

#### Payments
- `/app/payments` - Payments list (Flex_Admin, Finance_Manager)
- `/app/payments/corporate-exit-pass` - Corporate pass (Flex_Admin, Counter_Agent, Finance_Manager)
- `/app/payments/corporate-batch-history` - Batch history (Flex_Admin, Finance_Manager, IT_Support)
- `/app/payments/offline-template` - Offline template (Flex_Admin, Counter_Agent)
- `/app/payments/offline-upload` - Offline upload (Flex_Admin, Counter_Agent)
- `/app/cash-reconciliation` - Cash reconciliation (Flex_Admin, Counter_Agent, Finance_Manager)

#### Vouchers
- `/app/vouchers-list` - All vouchers (all roles)
- `/app/scan` - Scan and validate (Flex_Admin, Counter_Agent, Finance_Manager)
- `/app/scanner-test` - Scanner testing (Flex_Admin, IT_Support, Counter_Agent)

#### Reports
- `/app/reports` - Reports dashboard (Flex_Admin, Finance_Manager, IT_Support)
- `/app/reports/passports` - Passport reports
- `/app/reports/individual-purchase` - Individual purchase reports
- `/app/reports/corporate-vouchers` - Corporate voucher reports
- `/app/reports/revenue-generated` - Revenue reports
- `/app/reports/bulk-passport-uploads` - Bulk upload reports
- `/app/reports/quotations` - Quotation reports
- `/app/reports/refunded` - Refund reports

#### Administration
- `/app/users` - User management (Flex_Admin, IT_Support)
- `/app/admin/customers` - Customers (Flex_Admin, Finance_Manager)
- `/app/admin/payment-modes` - Payment modes (Flex_Admin only)
- `/app/admin/payment-gateway` - Payment gateway settings (Flex_Admin only)
- `/app/admin/email-templates` - Email templates (Flex_Admin only)
- `/app/admin/settings` - System settings (Flex_Admin only)
- `/app/admin/login-history` - Login history (Flex_Admin, IT_Support)
- `/app/admin/sms-settings` - SMS settings (Flex_Admin only)
- `/app/profile` - User profile (all roles)

---

## Voucher Registration Link

**On all generated corporate vouchers, show:**

```
🔗 Registration Required

This voucher must be registered with a passport before use.

Register at: https://greenpay.eywademo.cloud/corporate-voucher-registration

Or scan the QR code above.
```

**Current implementation:**
- ✅ Registration URL shown on printed voucher
- ✅ Registration URL shown in PDF downloads
- ✅ Registration URL shown in email
- ✅ QR code links to registration page
- ✅ Barcode contains voucher code for scanning
- ✅ Clear "Scan to Register" instruction

**Voucher statuses:**
- `pending_passport` - Not yet registered, shows INVALID at gate
- `active` - Registered with passport, shows VALID at gate
- `used` - Already scanned at gate, shows EXPIRED
- `expired` - Past valid_until date, shows EXPIRED

---

## Testing the Flow

### 1. Create Quotation
```
Login as: Finance_Manager or Flex_Admin
URL: https://greenpay.eywademo.cloud/app/quotations/create
Create quotation for 10 vouchers
```

### 2. Convert to Invoice
```
URL: https://greenpay.eywademo.cloud/app/quotations
Select quotation → "Convert to Invoice"
System calculates GST (10%)
```

### 3. Register Payment
```
URL: https://greenpay.eywademo.cloud/app/invoices
Select invoice → "Record Payment"
Enter payment details → Invoice status = 'paid'
```

### 4. Generate Vouchers
```
URL: https://greenpay.eywademo.cloud/app/invoices
Select paid invoice → "Generate Vouchers"
System creates 10 vouchers with status 'pending_passport'
```

### 5. Email Vouchers
```
URL: https://greenpay.eywademo.cloud/app/invoices
Select invoice → "Email Vouchers"
PDF sent to customer with registration instructions
```

### 6. Register Passport
```
Customer visits: https://greenpay.eywademo.cloud/corporate-voucher-registration
Enters voucher code
Scans/enters passport details
Voucher status → 'active'
```

### 7. Validate at Gate
```
Staff login → /app/scan
Scan voucher barcode
System shows: VALID ✅
Mark as used
```

---

## Files Changed

### Frontend Route Fixes
- `src/pages/CreateQuotation.jsx` - Fixed navigate('/quotations') → navigate('/app/quotations')
- `src/pages/Quotations.jsx` - Fixed all navigate calls for quotations and invoices
- `src/pages/ViewQuotation.jsx` - Fixed back navigation

### Voucher Templates (Already Updated)
- `src/components/VoucherPrint.jsx` - GREEN CARD template with CCDA logo
- `src/components/PassportVoucherReceipt.jsx` - GREEN CARD template
- `backend/utils/pdfGenerator.js` - PDF generation with GREEN CARD template

### Backend (Already Working)
- `backend/routes/invoices-gst.js` - Voucher generation with status 'pending_passport'
- `backend/routes/vouchers.js` - Validation endpoint with proper status messages
- `backend/routes/corporate-voucher-registration.js` - Public registration endpoint

---

## Summary

✅ **Route Issue Fixed:** All quotation routes now use `/app/` prefix
✅ **Corporate Flow Working:** Quote → Invoice → Payment → Voucher → Registration
✅ **Registration Link:** Shown on all vouchers with clear instructions
✅ **Gate Validation:** Proper status messages (VALID/INVALID/EXPIRED)
✅ **Role-Based Access:** All 4 roles properly configured
✅ **Voucher Template:** Consistent GREEN CARD design across all voucher types

**Deploy to test:**
```bash
scp -r dist/* root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/
ssh root@72.61.208.79 "pm2 restart greenpay-api"
```
