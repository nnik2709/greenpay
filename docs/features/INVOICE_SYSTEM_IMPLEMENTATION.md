# PNG Invoice System Implementation Plan

## Overview
Implement a complete GST-compliant invoice and green pass system following PNG tax regulations, integrating with the existing GreenPay quotations system.

## System Workflow

```
QUOTATION → INVOICE → GREEN PASS
(Draft)      (Pending)   (Active)
```

### Workflow Steps:
1. **Quotation Phase**: Create quotation → Send to customer → Accept/Reject
2. **Invoice Phase**: Convert to invoice → Record payments → Track payment status
3. **Green Pass Phase**: Full payment → Generate green pass → Valid for 1 year

## Database Schema Changes

###

 1. Add Fields to `quotations` Table

```sql
ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS customer_tin VARCHAR(50),
ADD COLUMN IF NOT EXISTS customer_address TEXT,
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS payment_terms TEXT,
ADD COLUMN IF NOT EXISTS converted_to_invoice BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS invoice_id INTEGER REFERENCES invoices(id);

COMMENT ON COLUMN quotations.customer_tin IS 'Customer Tax Identification Number (PNG IRC)';
COMMENT ON COLUMN quotations.gst_amount IS 'GST amount calculated at 10%';
COMMENT ON COLUMN quotations.subtotal IS 'Amount before GST';
```

### 2. Create `invoices` Table

```sql
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  quotation_id INTEGER REFERENCES quotations(id),
  quotation_ref VARCHAR(50),

  -- Customer Information
  customer_name VARCHAR(255) NOT NULL,
  customer_address TEXT NOT NULL,
  customer_tin VARCHAR(50),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),

  -- Invoice Details
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',

  -- Line Items (JSON array)
  items JSONB NOT NULL,

  -- Financial Details
  subtotal DECIMAL(10,2) NOT NULL,
  gst_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  gst_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0.00,
  amount_due DECIMAL(10,2),

  -- Additional Fields
  notes TEXT,
  payment_terms TEXT,
  green_pass_generated BOOLEAN DEFAULT FALSE,
  green_pass_id INTEGER REFERENCES green_passes(id),

  -- Audit Fields
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT status_check CHECK (status IN ('pending', 'partial', 'paid', 'cancelled'))
);

CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_quotation ON invoices(quotation_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_customer ON invoices(customer_name);

COMMENT ON TABLE invoices IS 'GST-compliant tax invoices generated from quotations';
COMMENT ON COLUMN invoices.invoice_number IS 'Format: INV-YYYYMM-XXXX';
COMMENT ON COLUMN invoices.gst_rate IS 'PNG GST rate (currently 10%)';
```

### 3. Create `invoice_payments` Table

```sql
CREATE TABLE IF NOT EXISTS invoice_payments (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  reference_number VARCHAR(100),
  notes TEXT,

  -- Audit Fields
  recorded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT positive_amount CHECK (amount > 0)
);

CREATE INDEX idx_payments_invoice ON invoice_payments(invoice_id);
CREATE INDEX idx_payments_date ON invoice_payments(payment_date);

COMMENT ON TABLE invoice_payments IS 'Payment records for invoices (partial/full)';
```

### 4. Create `green_passes` Table

```sql
CREATE TABLE IF NOT EXISTS green_passes (
  id SERIAL PRIMARY KEY,
  pass_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id),
  quotation_id INTEGER REFERENCES quotations(id),

  -- Customer Information
  customer_name VARCHAR(255) NOT NULL,
  customer_address TEXT,
  customer_tin VARCHAR(50),

  -- Pass Details
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',

  -- Items Authorized (JSON array)
  items JSONB NOT NULL,
  total_value DECIMAL(10,2) NOT NULL,

  -- Audit Fields
  generated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP,
  revoked_by INTEGER REFERENCES users(id),
  revocation_reason TEXT,

  CONSTRAINT status_check CHECK (status IN ('active', 'expired', 'revoked'))
);

CREATE INDEX idx_green_passes_number ON green_passes(pass_number);
CREATE INDEX idx_green_passes_invoice ON green_passes(invoice_id);
CREATE INDEX idx_green_passes_status ON green_passes(status);
CREATE INDEX idx_green_passes_valid_until ON green_passes(valid_until);

COMMENT ON TABLE green_passes IS 'Green passes issued after full invoice payment';
COMMENT ON COLUMN green_passes.pass_number IS 'Format: GP-YYYYMM-XXXX';
COMMENT ON COLUMN green_passes.valid_until IS 'Valid for 1 year from issue date';
```

## Document Numbering System

### Format:
- **Quotations**: `QTN-YYYYMM-XXXX` (e.g., QTN-202511-0001)
- **Invoices**: `INV-YYYYMM-XXXX` (e.g., INV-202511-0001)
- **Green Passes**: `GP-YYYYMM-XXXX` (e.g., GP-202511-0001)

### Implementation:

```javascript
// utils/documentNumbering.js
export const generateDocNumber = async (type, supabase) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = {
    'quotation': 'QTN',
    'invoice': 'INV',
    'greenpass': 'GP'
  }[type];

  const yearMonth = `${year}${month}`;

  // Get the highest number for this month
  const tableName = type === 'quotation' ? 'quotations' :
                    type === 'invoice' ? 'invoices' : 'green_passes';
  const columnName = type === 'quotation' ? 'quotation_number' :
                     type === 'invoice' ? 'invoice_number' : 'pass_number';

  const { data } = await supabase
    .from(tableName)
    .select(columnName)
    .like(columnName, `${prefix}-${yearMonth}-%`)
    .order(columnName, { ascending: false })
    .limit(1);

  let nextNumber = 1;
  if (data && data.length > 0) {
    const lastNumber = data[0][columnName].split('-')[2];
    nextNumber = parseInt(lastNumber) + 1;
  }

  const paddedNumber = String(nextNumber).padStart(4, '0');
  return `${prefix}-${yearMonth}-${paddedNumber}`;
};
```

## GST Calculation (10%)

### PNG GST Compliance:
- **Rate**: 10% (PNG standard rate)
- **Display**: Must show GST as separate line item
- **Formula**:
  - Subtotal = Sum of all items (ex GST)
  - GST = Subtotal × 0.10
  - Total = Subtotal + GST

### Implementation:

```javascript
// utils/gstCalculations.js
const GST_RATE = 0.10; // 10%

export const calculateGST = (subtotal) => {
  return parseFloat((subtotal * GST_RATE).toFixed(2));
};

export const calculateTotals = (items) => {
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice;
    return sum + (item.gstApplicable ? itemTotal : 0);
  }, 0);

  const gst = calculateGST(subtotal);
  const total = subtotal + gst;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    gst: parseFloat(gst.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
};

export const formatCurrency = (amount) => {
  return `K ${parseFloat(amount).toLocaleString('en-PG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};
```

## Frontend Components to Create

### 1. Invoices Page (`src/pages/Invoices.jsx`)
- List all invoices with filters
- Status badges (Pending, Partial, Paid)
- Actions: View, Record Payment, Generate Green Pass

### 2. Create/View Invoice Modal
- Display invoice details
- Show payment history
- Record new payment button

### 3. Payment Recording Modal
- Amount input
- Payment method selector (CASH, CARD, BANK TRANSFER)
- Reference number
- Auto-update invoice status

### 4. Green Passes Page (`src/pages/GreenPasses.jsx`)
- List all green passes
- Status: Active, Expired, Revoked
- View/Print/Export functionality

### 5. Update Quotations Page
- Add "Convert to Invoice" button (for approved quotations)
- Show GST breakdown
- Add TIN field to customer info

## Backend API Endpoints

### Invoices Routes (`backend/routes/invoices.js`)

```javascript
// GET /api/invoices - Get all invoices
// GET /api/invoices/:id - Get single invoice
// POST /api/invoices - Create invoice from quotation
// PUT /api/invoices/:id - Update invoice
// POST /api/invoices/:id/payments - Record payment
// GET /api/invoices/:id/payments - Get payment history
// POST /api/invoices/:id/generate-green-pass - Generate green pass
```

### Green Passes Routes (`backend/routes/green-passes.js`)

```javascript
// GET /api/green-passes - Get all green passes
// GET /api/green-passes/:id - Get single green pass
// POST /api/green-passes - Create green pass (from paid invoice)
// PUT /api/green-passes/:id/revoke - Revoke green pass
```

## Integration Steps

### Phase 1: Database Setup
1. Run SQL migrations to create tables
2. Update quotations table with new fields
3. Set up indexes and constraints

### Phase 2: Backend Development
1. Create invoice service layer
2. Create green pass service layer
3. Implement document numbering
4. Add GST calculations
5. Create API endpoints

### Phase 3: Frontend Development
1. Update quotations page with "Convert to Invoice" button
2. Create Invoices management page
3. Create payment recording modal
4. Create Green Passes page
5. Add invoice preview/PDF generation

### Phase 4: PDF Generation
1. Set up ReportLab (Python) or jsPDF (JavaScript)
2. Create PNG GST-compliant invoice template
3. Include all required fields (TIN, GST breakdown, etc.)
4. Create green pass template

### Phase 5: Testing
1. Test quotation → invoice conversion
2. Test payment recording (partial/full)
3. Test green pass generation
4. Test PDF generation
5. Verify GST calculations

## Required Fields for PNG Tax Compliance

### Tax Invoice Must Include:
- ✓ Supplier Name
- ✓ Supplier Address
- ✓ Supplier TIN (Tax Identification Number)
- ✓ Invoice Number (sequential)
- ✓ Invoice Date
- ✓ Customer Name
- ✓ Customer Address
- ✓ Customer TIN (recommended if GST registered)
- ✓ Item Description
- ✓ Quantity
- ✓ Unit Price (excl. GST)
- ✓ GST Amount (at 10%)
- ✓ Total Amount (Subtotal + GST)

## Status Flow

### Quotation Statuses:
- `draft` - Being created
- `sent` - Sent to customer
- `approved` - Approved by customer
- `rejected` - Rejected by customer
- `converted` - Converted to invoice

### Invoice Statuses:
- `pending` - No payment received
- `partial` - Partial payment received
- `paid` - Fully paid
- `cancelled` - Cancelled invoice

### Green Pass Statuses:
- `active` - Currently valid
- `expired` - Past valid_until date
- `revoked` - Manually revoked

## Next Steps

1. Create database migration SQL files
2. Implement backend routes for invoices and green passes
3. Update quotations UI to show GST breakdown
4. Create invoices management page
5. Implement payment recording
6. Create green pass generation
7. Set up PDF generation with GST compliance

## Notes

- All amounts in PNG Kina (PGK/K)
- GST rate is 10% (can be configured)
- Sequential numbering required for tax compliance
- Keep records for 5 years (PNG requirement)
- Green passes valid for 1 year from issue date
