# Laravel Quotation to Invoice Workflow - Complete Documentation

**Date:** 2025-11-30
**Source:** pnggreenfees.gov.pg Laravel Application
**Purpose:** Document complete quotation-to-invoice workflow for React implementation

---

## Executive Summary

The Laravel application implements a comprehensive quotation-to-invoice workflow that:
1. Creates quotations for customers
2. Sends quotation PDFs via email
3. Approves quotations
4. Converts approved quotations to:
   - Voucher batches (bulk voucher generation)
   - Invoices (financial records)
5. Emails invoices with PDF attachments
6. Manages all data in transactional workflows

---

## Workflow Overview

```
CREATE QUOTATION → SEND EMAIL → APPROVE → CONVERT TO ORDER
     ↓               ↓             ↓              ↓
  (draft)         (sent)      (approved)    (converted)
                                                  ├─→ Create VoucherBatch
                                                  ├─→ Generate Vouchers (bulk)
                                                  ├─→ Create Invoice
                                                  └─→ Send Invoice Email
```

---

## 1. Database Schema

### Quotations Table

```sql
quotations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  quotation_number VARCHAR(50) UNIQUE,           -- QT-000001
  client_name VARCHAR(255),
  client_email VARCHAR(255),
  subject VARCHAR(500),
  total_vouchers INTEGER,
  voucher_value DECIMAL(10,2),
  total_amount DECIMAL(10,2),                    -- total_vouchers × voucher_value
  discount_percentage DECIMAL(5,2),
  discount_amount DECIMAL(10,2),
  amount_after_discount DECIMAL(10,2),           -- total_amount - discount_amount
  validity_date DATE,                             -- Quotation expiry
  due_date DATE NULL,                             -- Internal due date
  status ENUM('draft', 'sent', 'approved', 'converted', 'expired'),
  terms_conditions TEXT NULL,
  notes TEXT NULL,
  created_by BIGINT FK→users,
  approved_by BIGINT FK→users NULL,
  approved_at TIMESTAMP NULL,
  converted_at TIMESTAMP NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,

  INDEX(quotation_number),
  INDEX(status),
  INDEX(validity_date)
)
```

### Invoices Table

```sql
invoices (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  invoice_number VARCHAR(255) UNIQUE,            -- INV-202509-0001
  invoice_date DATE,
  due_date DATE,
  quotation_id BIGINT FK→quotations NULL,
  voucher_batch_id BIGINT FK→voucher_batches NULL,
  client_name VARCHAR(255),
  client_email VARCHAR(255),
  client_phone VARCHAR(255) NULL,
  client_address TEXT NULL,
  total_vouchers INTEGER,
  voucher_value DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  discount DECIMAL(10,2) DEFAULT 0,
  amount_after_discount DECIMAL(10,2),
  collected_amount DECIMAL(10,2),
  returned_amount DECIMAL(10,2) DEFAULT 0,
  payment_mode ENUM('cash', 'card'),
  purchase_order_reference VARCHAR(255) NULL,
  card_number VARCHAR(255) NULL,
  card_holder VARCHAR(255) NULL,
  cvv VARCHAR(255) NULL,
  expiry_date VARCHAR(255) NULL,
  valid_from DATE,
  valid_until DATE,
  status ENUM('draft', 'sent', 'paid', 'overdue') DEFAULT 'draft',
  created_by BIGINT FK→users,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### VoucherBatches Table

```sql
voucher_batches (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  created_by BIGINT FK→users NULL,
  quotation_id BIGINT FK→quotations NULL,
  total_vouchers INTEGER UNSIGNED,
  voucher_value DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  discount DECIMAL(10,2) DEFAULT 0,
  amount_after_discount DECIMAL(10,2),
  collected_amount DECIMAL(10,2),
  returned_amount DECIMAL(10,2) DEFAULT 0,
  payment_mode VARCHAR(255),
  purchase_order_reference VARCHAR(255) NULL,
  card_number VARCHAR(255) NULL,
  card_holder VARCHAR(255) NULL,
  cvv VARCHAR(255) NULL,
  expiry_date VARCHAR(255) NULL,
  valid_from DATE,
  valid_until DATE,
  share_with_email VARCHAR(255) NULL,
  share_with_number VARCHAR(255) NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

---

## 2. Step-by-Step Workflow

### Step 1: Create Quotation

**Endpoint:** `POST /quotations`

**Controller:** `QuotationController::store()`

**Input Fields:**
- client_name (required, max 255)
- client_email (required, email)
- subject (required, max 500)
- total_vouchers (required, integer, min 1)
- voucher_value (required, numeric, min 0)
- discount_percentage (optional, numeric, 0-100)
- validity_date (required, date, after today)
- due_date (optional, date, after_or_equal today)
- terms_conditions (optional, text)
- notes (optional, text)

**Process:**
```javascript
// Validation
const validation = {
  client_name: 'required|string|max:255',
  client_email: 'required|email',
  subject: 'required|string|max:500',
  total_vouchers: 'required|integer|min:1',
  voucher_value: 'required|numeric|min:0',
  discount_percentage: 'nullable|numeric|min:0|max:100',
  validity_date: 'required|date|after:today',
  terms_conditions: 'nullable|string',
  notes: 'nullable|string'
};

// Calculation
total_amount = total_vouchers × voucher_value;
discount_amount = total_amount × (discount_percentage / 100);
amount_after_discount = total_amount - discount_amount;

// Database Insert
quotation = {
  quotation_number: auto-generated, // QT-{id}
  ...inputFields,
  total_amount,
  discount_amount,
  amount_after_discount,
  status: 'draft',
  created_by: currentUser.id
};
```

**Output:**
- Quotation created with status 'draft'
- Quotation number: QT-000001, QT-000002, etc.

---

### Step 2: Send Quotation Email (Optional)

**Endpoint:** `POST /quotations/{id}/send-email`

**Controller:** `QuotationController::sendEmail()`

**Input:**
- email (required, email address)

**Process:**
```javascript
1. Load quotation by ID
2. Generate PDF from quotation template
3. Save PDF temporarily: storage/app/temp/quotation_{id}.pdf
4. Send email with PDF attachment:
   - To: provided email
   - Subject: "Quotation #{quotation_number} - CCDA"
   - Body: quotation-email.blade.php template
   - Attachment: PDF file
5. Delete temporary PDF file
6. Update quotation status to 'sent'
7. Return success message
```

**Email Template Content:**
- Greeting
- Quotation details (number, subject, total)
- Service description (vouchers, quantity, price)
- Validity date
- Notes (if any)
- PDF attachment with full details

---

### Step 3: Approve Quotation

**Endpoint:** `PATCH /quotations/{id}/approve`

**Controller:** `QuotationController::approve()`

**Process:**
```javascript
1. Verify quotation status === 'sent'
2. Update quotation:
   - status = 'approved'
   - approved_by = current_user.id
   - approved_at = now()
3. Return success message
```

**Authorization:**
- Only Finance Managers and Admins can approve

---

### Step 4: Convert Quotation to Order (CRITICAL WORKFLOW)

**Endpoint:** `POST /quotations/{id}/convert`

**Controller:** `QuotationController::convert()`

**Input:**
- payment_mode (required, must exist in payment_modes table)
- purchase_order_reference (optional, max 255)
- collected_amount (required, numeric, >= amount_after_discount)
- returned_amount (optional, numeric, >= 0)
- share_with_email (optional, email for invoice delivery)

**Complete Process (All in Transaction):**

```javascript
// Validation
1. Check quotation.status === 'approved'
2. Check quotation not expired (validity_date >= today)
3. Validate collected_amount >= amount_after_discount

// Transaction Start
BEGIN TRANSACTION

  // Step A: Create VoucherBatch
  voucherBatch = create({
    total_vouchers: quotation.total_vouchers,
    voucher_value: quotation.voucher_value,
    total_amount: quotation.total_amount,
    discount: quotation.discount_amount,
    amount_after_discount: quotation.amount_after_discount,
    collected_amount: input.collected_amount,
    returned_amount: input.returned_amount || 0,
    payment_mode: input.payment_mode,
    purchase_order_reference: input.purchase_order_reference,
    valid_from: today(),
    valid_until: quotation.validity_date,
    share_with_email: input.share_with_email || quotation.client_email,
    created_by: currentUser.id
  });

  // Step B: Generate Vouchers (Bulk, optimized for performance)
  vouchers = [];
  for (i = 0; i < total_vouchers; i++) {
    code = generateCode(); // Random 4 chars + batch_id + sequence
    vouchers.push({
      voucher_code: code,
      voucher_batch_id: voucherBatch.id,
      amount: quotation.voucher_value,
      valid_from: today(),
      valid_until: quotation.validity_date,
      status: 'unused',
      created_at: now()
    });

    // Insert in chunks of 1000 to prevent memory overflow
    if (vouchers.length >= 1000) {
      bulkInsert(vouchers);
      vouchers = [];
    }
  }

  // Insert remaining vouchers
  if (vouchers.length > 0) {
    bulkInsert(vouchers);
  }

  // Step C: Mark Quotation as Converted
  quotation.update({
    status: 'converted',
    converted_at: now()
  });

  // Step D: Link VoucherBatch to Quotation
  voucherBatch.update({
    quotation_id: quotation.id
  });

  // Step E: Create Invoice
  invoice = create({
    invoice_number: generateInvoiceNumber(), // INV-YYYYMM-XXXX
    invoice_date: today(),
    due_date: today().addDays(30),
    quotation_id: quotation.id,
    voucher_batch_id: voucherBatch.id,
    client_name: quotation.client_name,
    client_email: quotation.client_email,
    client_phone: quotation.client_phone,
    client_address: quotation.client_address,
    total_vouchers: quotation.total_vouchers,
    voucher_value: quotation.voucher_value,
    total_amount: quotation.total_amount,
    discount: quotation.discount_amount,
    amount_after_discount: quotation.amount_after_discount,
    collected_amount: input.collected_amount,
    returned_amount: input.returned_amount || 0,
    payment_mode: input.payment_mode,
    purchase_order_reference: input.purchase_order_reference,
    valid_from: today(),
    valid_until: quotation.validity_date,
    status: 'sent',
    created_by: currentUser.id
  });

COMMIT TRANSACTION

// Step F: Send Invoice Email (Outside transaction - don't rollback if fails)
try {
  recipientEmail = input.share_with_email || quotation.client_email;
  sendInvoiceEmail(invoice, recipientEmail);
} catch (error) {
  log.error('Invoice email failed:', error);
  // Continue - don't fail conversion
}

// Redirect to voucher batch view
redirect('/voucher-batches/view/' + voucherBatch.id);
```

**Invoice Number Generation:**
```javascript
function generateInvoiceNumber() {
  const year = currentYear();   // 2025
  const month = currentMonth();  // 09

  // Get last invoice for this month
  const lastInvoice = Invoice
    .whereYear('created_at', year)
    .whereMonth('created_at', month)
    .orderBy('id', 'desc')
    .first();

  let sequence = 1;
  if (lastInvoice) {
    // Extract last 4 digits: INV-202509-0042 → 42
    sequence = parseInt(lastInvoice.invoice_number.slice(-4)) + 1;
  }

  // Pad to 4 digits: 1 → 0001, 42 → 0042
  const paddedSequence = sequence.toString().padStart(4, '0');

  return `INV-${year}${month}-${paddedSequence}`;
}
```

**Example Invoice Numbers:**
- January 2025: INV-202501-0001, INV-202501-0002
- February 2025: INV-202502-0001 (sequence resets)
- September 2025: INV-202509-0127

---

### Step 5: Send Invoice Email

**Called Automatically:** During conversion (Step 4F)

**Process:**
```javascript
function sendInvoiceEmail(invoice, recipientEmail) {
  // 1. Generate PDF
  const pdf = generatePDF('invoices/invoice.blade.php', { invoice });

  // 2. Save temporarily
  const pdfPath = `storage/app/temp/invoice_${invoice.id}.pdf`;
  fs.writeFileSync(pdfPath, pdf);

  // 3. Send email
  Mail.to(recipientEmail).send(InvoiceEmail, {
    invoice: invoice,
    pdfAttachment: pdfPath
  });

  // 4. Delete temporary file
  fs.unlinkSync(pdfPath);

  log.info(`Invoice ${invoice.invoice_number} sent to ${recipientEmail}`);
}
```

**Email Content:**
- Subject: "Invoice {invoice_number} - Climate Change Development Authority"
- Body: Invoice details (number, dates, amounts, PO reference)
- Attachment: PDF file with full invoice

---

## 3. PDF Templates

### Quotation PDF Template

**View:** `resources/views/quotations/pdf.blade.php`

**Structure:**
1. **Header:**
   - CCDA Logo
   - "QUOTATION" title
   - Quotation number, subject, date

2. **From/To Sections (Two Columns):**
   - Left: CCDA details (organization, contact info)
   - Right: Client details (name, email, dates)

3. **Services Table:**
   - Header row (green background)
   - Service: "Government Exit Pass Vouchers"
   - Description, unit price, quantity, total
   - Subtotal and discount rows

4. **Optional Sections:**
   - Terms & Conditions (if provided)
   - Additional Notes (if provided)

5. **Footer:**
   - Thank you message
   - Signature box with creator name

**Colors:**
- Primary green: #66b958
- Dark green: #2c5530
- Light gray: #f8f9fa

### Invoice PDF Template

**View:** `resources/views/invoices/invoice.blade.php`

**Structure:**
1. **Header:**
   - Company name and address (left)
   - Invoice details (right): number, dates, PO reference

2. **Billing Information:**
   - Bill To: Client details
   - Payment Details: Mode, card info, amounts

3. **Services Table:**
   - Green Fee Vouchers
   - Validity dates
   - Quantity and pricing

4. **Summary:**
   - Subtotal
   - Discount (with %)
   - Total Amount (highlighted)

5. **Footer:**
   - Bank details (Bank of PNG, account info)
   - Terms & Conditions (payment terms, refund policy)

---

## 4. Data Flow Diagram

```
┌─────────────┐
│  Quotation  │
│  (draft)    │
└──────┬──────┘
       │ Send Email
       ↓
┌─────────────┐
│  Quotation  │
│   (sent)    │
└──────┬──────┘
       │ Approve
       ↓
┌─────────────┐
│  Quotation  │
│ (approved)  │
└──────┬──────┘
       │ Convert
       ↓
┌─────────────────────────────────────┐
│         CONVERSION PROCESS          │
│  (All in Database Transaction)      │
├─────────────────────────────────────┤
│  1. Create VoucherBatch             │
│  2. Generate Vouchers (bulk)        │
│  3. Update Quotation (converted)    │
│  4. Link Batch to Quotation         │
│  5. Create Invoice                  │
└──────┬──────────────────────────────┘
       │
       ├─→ ┌─────────────┐
       │   │VoucherBatch │
       │   │  + Vouchers │
       │   └─────────────┘
       │
       ├─→ ┌─────────────┐
       │   │   Invoice   │
       │   │   (sent)    │
       │   └─────────────┘
       │
       └─→ ┌─────────────┐
           │ Email Sent  │
           │ (with PDF)  │
           └─────────────┘
```

---

## 5. Key Features for React Implementation

### 1. Quotation Number Generation
```javascript
// Auto-generate on save
quotation_number = `QT-${id.toString().padStart(6, '0')}`;
// Example: QT-000001, QT-000042, QT-001337
```

### 2. Invoice Number Generation
```javascript
// Monthly sequence
const year = new Date().getFullYear();
const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
const sequence = getLastInvoiceSequence(year, month) + 1;
invoice_number = `INV-${year}${month}-${sequence.toString().padStart(4, '0')}`;
// Example: INV-202509-0001
```

### 3. Bulk Voucher Generation
```javascript
// Generate in chunks to prevent memory issues
const CHUNK_SIZE = 1000;
const vouchers = [];

for (let i = 0; i < total_vouchers; i++) {
  vouchers.push({
    voucher_code: generateVoucherCode(batchId, i + 1),
    voucher_batch_id: batchId,
    amount: voucher_value,
    valid_from: today,
    valid_until: validity_date,
    status: 'unused'
  });

  if (vouchers.length >= CHUNK_SIZE) {
    await bulkInsertVouchers(vouchers);
    vouchers.length = 0; // Clear array
  }
}

// Insert remaining
if (vouchers.length > 0) {
  await bulkInsertVouchers(vouchers);
}
```

### 4. Transaction Handling
```javascript
// Ensure atomic operations
const transaction = await db.beginTransaction();

try {
  const batch = await createVoucherBatch(data, transaction);
  await generateVouchers(batch.id, transaction);
  await updateQuotation(quotationId, transaction);
  await createInvoice(data, transaction);

  await transaction.commit();

  // Send email outside transaction (don't rollback if fails)
  try {
    await sendInvoiceEmail(invoice.id, email);
  } catch (emailError) {
    console.error('Email failed:', emailError);
  }

} catch (error) {
  await transaction.rollback();
  throw error;
}
```

### 5. PDF Generation
```javascript
// Use jsPDF for client-side OR
// Backend endpoint for server-side generation

// Option 1: Client-side
import { QuotationPDF } from '@/components/QuotationPDF';
<QuotationPDF quotation={quotation} onEmailClick={handleEmail} />

// Option 2: Server-side
const response = await fetch(`/api/quotations/${id}/pdf`);
const blob = await response.blob();
const url = URL.createObjectURL(blob);
window.open(url);
```

### 6. Email Integration
```javascript
// Backend API endpoint
POST /api/quotations/:id/send-email
{
  "email": "client@example.com"
}

// Response
{
  "success": true,
  "message": "Quotation sent to client@example.com"
}
```

---

## 6. Status Transitions

### Quotation Statuses

```
draft → sent → approved → converted
  ↓
expired (if past validity_date while draft/sent)
```

**Rules:**
- Can edit: draft, sent
- Can send email: draft, sent, approved
- Can approve: sent only
- Can convert: approved only (and not expired)
- Auto-expire: draft or sent past validity_date

### Invoice Statuses

```
draft → sent → paid
  ↓
overdue (if past due_date and not paid)
```

---

## 7. API Endpoints Needed for React

### Quotations
- `GET /api/quotations` - List all
- `GET /api/quotations/:id` - Get one
- `POST /api/quotations` - Create
- `PUT /api/quotations/:id` - Update
- `DELETE /api/quotations/:id` - Delete
- `PATCH /api/quotations/:id/mark-sent` - Mark as sent
- `PATCH /api/quotations/:id/approve` - Approve
- `POST /api/quotations/:id/send-email` - Send email with PDF
- `GET /api/quotations/:id/pdf` - Download PDF
- `POST /api/quotations/:id/convert` - Convert to order

### Invoices
- `GET /api/invoices` - List all
- `GET /api/invoices/:id` - Get one
- `POST /api/invoices/:id/send-email` - Send email
- `GET /api/invoices/:id/pdf` - Download PDF
- `PATCH /api/invoices/:id/mark-paid` - Mark as paid

---

## 8. Testing Checklist

### Quotation Creation
- [ ] Create quotation with all fields
- [ ] Verify quotation number auto-generated
- [ ] Verify calculations (total, discount, final)
- [ ] Verify status = 'draft'

### Quotation Email
- [ ] Send email with PDF attachment
- [ ] Verify PDF contains all data
- [ ] Verify status changes to 'sent'
- [ ] Verify recipient receives email

### Quotation Approval
- [ ] Approve quotation
- [ ] Verify status = 'approved'
- [ ] Verify approved_by and approved_at set

### Conversion to Order
- [ ] Convert approved quotation
- [ ] Verify VoucherBatch created
- [ ] Verify all vouchers generated
- [ ] Verify Invoice created
- [ ] Verify Invoice number format
- [ ] Verify email sent with invoice PDF
- [ ] Verify quotation status = 'converted'

### Error Handling
- [ ] Try to approve non-sent quotation (should fail)
- [ ] Try to convert non-approved quotation (should fail)
- [ ] Try to convert expired quotation (should fail)
- [ ] Verify transaction rollback on error

---

## 9. Performance Considerations

### Bulk Operations
- Insert vouchers in chunks of 1000
- Use database transactions
- Log execution time

### PDF Generation
- Generate on-demand only
- Delete temporary files immediately
- Use optimized PDF settings

### Email Delivery
- Queue emails for async processing
- Don't block conversion on email failure
- Retry failed emails

---

## 10. Implementation Priority

**Phase 1 (High Priority):**
1. Quotation CRUD operations
2. Quotation calculations
3. Quotation status management
4. PDF generation (quotation)

**Phase 2 (Medium Priority):**
5. Email integration
6. Quotation approval workflow
7. Invoice PDF generation

**Phase 3 (Critical):**
8. Conversion workflow (quotation → batch → invoice)
9. Bulk voucher generation
10. Transaction management
11. Invoice email delivery

**Phase 4 (Enhancement):**
12. Search and filtering
13. Statistics dashboard
14. Expiry notifications
15. Overdue tracking

---

## Conclusion

This workflow documentation provides complete visibility into the Laravel quotation-to-invoice process, enabling accurate React implementation with matching functionality, data structures, and business logic.
