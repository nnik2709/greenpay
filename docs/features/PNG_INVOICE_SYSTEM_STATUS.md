# PNG Invoice System - Implementation Status

## What We're Building

A complete PNG GST-compliant invoice system that integrates with your existing GreenPay quotations and vouchers system:

**Workflow**: Quotation → Invoice → Payments → Green Pass (Vouchers with QR codes)

## ✅ Completed

### 1. Database Schema Design
Created 4 migration files ready to deploy:

- **01-update-quotations-for-invoices.sql**
  - Adds PNG tax compliance fields (TIN, GST)
  - Links quotations to invoices
  - Auto-calculates GST for existing records

- **02-create-invoices-table.sql**
  - Full PNG GST-compliant structure
  - Invoice numbering: INV-YYYYMM-XXXX
  - Statuses: pending, partial, paid, cancelled, overdue
  - Auto-update triggers

- **03-create-invoice-payments-table.sql**
  - Tracks partial/full payments
  - Auto-updates invoice status
  - Validates payment methods

- **04-update-vouchers-for-invoices.sql**
  - Links corporate_vouchers (Green Passes) to invoices
  - Green Pass = Voucher with QR code

### 2. Backend API Routes
Created `backend/routes/invoices-gst.js` with:

**Endpoints**:
- `GET /api/invoices` - List all invoices (with filters)
- `GET /api/invoices/:id` - Get invoice details + payments
- `POST /api/invoices/from-quotation` - Convert quotation to invoice
- `POST /api/invoices/:id/payments` - Record payment
- `GET /api/invoices/:id/payments` - Get payment history
- `POST /api/invoices/:id/generate-vouchers` - Generate Green Passes after full payment
- `GET /api/invoices/stats` - Get statistics dashboard

**Features**:
- ✓ PNG GST calculation (10%)
- ✓ Sequential invoice numbering (INV-202511-0001)
- ✓ Payment tracking (partial/full)
- ✓ Auto-status updates
- ✓ Voucher (Green Pass) generation
- ✓ Overpayment validation

### 3. Documentation
- `INVOICE_SYSTEM_IMPLEMENTATION.md` - Complete implementation guide
- `PNG_INVOICE_SYSTEM_STATUS.md` - This file
- `deploy-invoice-system.sh` - Database deployment script

### 4. UI Cleanup
- Removed colorful circles from Quotations page
- Professional clean stat cards

## 📋 Next Steps

### Phase 1: Deploy Database (Do This First)
```bash
./deploy-invoice-system.sh
```

This will:
1. Add GST fields to quotations table
2. Create invoices table
3. Create invoice_payments table
4. Link vouchers to invoices

### Phase 2: Backend Integration
1. Register invoice routes in server.js
2. Test endpoints with Postman/curl
3. Deploy backend to production server

### Phase 3: Frontend Development

#### A. Create GST Utilities (`src/lib/gstUtils.js`)
```javascript
// GST calculation utilities
export const GST_RATE = 10.00;

export const calculateGST = (subtotal) => {
  return parseFloat((subtotal * (GST_RATE / 100)).toFixed(2));
};

export const calculateTotals = (items) => {
  const subtotal = items.reduce((sum, item) =>
    sum + (item.gstApplicable ? item.quantity * item.unitPrice : 0), 0
  );

  const gst = calculateGST(subtotal);
  const total = subtotal + gst;

  return { subtotal, gst, total };
};

export const formatPGK = (amount) => {
  return `K ${parseFloat(amount).toLocaleString('en-PG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};
```

#### B. Update Quotations Page
Add to `src/pages/Quotations.jsx`:
- "Convert to Invoice" button (for approved quotations)
- Show GST breakdown in quotation details
- Add TIN field to customer info
- Disable conversion if already converted

#### C. Create Invoices Page (`src/pages/Invoices.jsx`)
Features:
- List all invoices with filters
- Status badges (Pending, Partial, Paid)
- View invoice details
- Record payment button
- Generate vouchers button (when paid)

#### D. Create Payment Recording Modal
- Amount input
- Payment method dropdown
- Reference number
- Notes
- Auto-calculate balance

#### E. Create Invoice View/Preview Component
- Display full invoice details
- Show payment history
- GST breakdown
- Print/PDF button

### Phase 4: PDF Generation
Create PNG GST-compliant invoice PDF with:
- Supplier name, address, TIN
- Customer name, address, TIN
- Invoice number, date, due date
- Line items with GST
- Subtotal, GST (10%), Total
- Payment terms

Options:
1. **jsPDF** (JavaScript) - Generate in browser
2. **ReportLab** (Python) - Generate on backend

### Phase 5: Testing
1. Create quotation
2. Convert to invoice
3. Record partial payment → status = 'partial'
4. Record full payment → status = 'paid'
5. Generate vouchers (Green Passes)
6. Verify QR codes on vouchers
7. Test PDF generation

## Key Features

### PNG GST Compliance
✓ **10% GST** - Standard PNG rate
✓ **Supplier TIN** - Tax Identification Number
✓ **Customer TIN** - Optional but recommended
✓ **Sequential Numbering** - INV-YYYYMM-XXXX
✓ **GST Breakdown** - Separate line item
✓ **Record Keeping** - 5-year compliance

### Payment Tracking
✓ **Partial Payments** - Track multiple payments
✓ **Payment Methods** - CASH, CARD, BANK TRANSFER, EFTPOS, CHEQUE
✓ **Auto-Status** - Updates based on payment
✓ **Payment History** - Full audit trail

### Green Pass Integration
✓ **Auto-Generation** - After full payment
✓ **QR Codes** - Links to existing voucher system
✓ **Valid 1 Year** - From issue date
✓ **Batch Tracking** - Links to invoice

## Document Numbering

Format: `PREFIX-YYYYMM-XXXX`

Examples:
- `QTN-202511-0001` - Quotation November 2025 #1
- `INV-202511-0001` - Invoice November 2025 #1
- `GP-202511-0001` - Green Pass November 2025 #1

Sequential within each month, resets monthly.

## Status Flow

```
QUOTATION              INVOICE                GREEN PASS
─────────              ───────                ──────────
draft                  pending                active
  │                      │                      │
  ▼                      ▼                      │
sent                   partial ──┐             │
  │                      │       │             │
  ▼                      ▼       │             │
approved               paid ─────┴───────────> generated
  │                                             │
  ▼                                             ▼
converted                                    (1 year validity)
```

## Database Tables

1. **quotations** (updated)
   - Added: customer_tin, customer_address, subtotal, gst_amount, invoice_id

2. **invoices** (new)
   - Full PNG GST compliance
   - Links to quotations and vouchers

3. **invoice_payments** (new)
   - Payment tracking with auto-triggers

4. **corporate_vouchers** (updated)
   - Added: invoice_id, is_green_pass

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/invoices` | List invoices |
| GET | `/api/invoices/:id` | Get invoice + payments |
| POST | `/api/invoices/from-quotation` | Convert quotation |
| POST | `/api/invoices/:id/payments` | Record payment |
| GET | `/api/invoices/:id/payments` | Payment history |
| POST | `/api/invoices/:id/generate-vouchers` | Create Green Passes |
| GET | `/api/invoices/stats` | Statistics |

## Access Control

**Invoices**: Flex_Admin, Finance_Manager, IT_Support
**Payments**: Flex_Admin, Finance_Manager, Counter_Agent
**Voucher Generation**: Flex_Admin, Finance_Manager

## Immediate Next Step

Run the database deployment:

```bash
chmod +x deploy-invoice-system.sh
./deploy-invoice-system.sh
```

Then register the routes in `backend/server.js`:

```javascript
const invoicesRouter = require('./routes/invoices-gst');
app.use('/api/invoices', invoicesRouter);
```

---

**Last Updated**: November 27, 2025
**Status**: Database schema ready, backend routes created, frontend pending
