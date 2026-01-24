# Individual Purchase Flow - Complete Redesign

**Date:** 2026-01-20
**Status:** DESIGN PROPOSAL
**Priority:** HIGH - Replaces fragile batch implementation

---

## Problems with Current Batch Implementation

1. **Error-prone passport collection** - Complex state management with scanner/manual hybrid
2. **Database schema mismatches** - Assumed columns that don't exist
3. **Tight coupling** - Payment and passport collection mixed together
4. **No flexibility** - Cannot add passports after voucher creation
5. **Poor user experience** - Counter agents must enter all passports before payment

---

## New Design: Follow Public Online Purchase Flow

### Core Principle
**Separate voucher creation from passport assignment**

Just like Public Online Purchase:
1. **Generate vouchers first** (with quantity + payment)
2. **Assign passports later** (via MRZ scanner check-in)
3. **Print or email** vouchers with passport details

---

## New Individual Purchase Flow

### Step 1: Voucher Creation (Simplified)
**Screen:** Individual Purchase Landing

```
┌─────────────────────────────────────────┐
│  Create Vouchers                         │
├─────────────────────────────────────────┤
│                                          │
│  Quantity: [1] [2] [3] [4] [5]          │
│           (Quick select buttons)          │
│                                          │
│  Payment Method:                         │
│    ○ Cash                                │
│    ○ POS/Card                            │
│                                          │
│  Amount per voucher: PGK 50.00          │
│  Total Amount: PGK 150.00               │
│                                          │
│  Customer Email (optional):              │
│  [email@example.com]                     │
│                                          │
│  [Generate 3 Vouchers →]                │
└─────────────────────────────────────────┘
```

**What happens:**
- Creates 3 vouchers with unique codes (e.g., `IND001`, `IND002`, `IND003`)
- Vouchers are **VALID but UNASSIGNED** (no passport yet)
- Stores payment info
- Records agent who created them

### Step 2: Voucher List & Assignment
**Screen:** After generation, show voucher list

```
┌─────────────────────────────────────────────────────────────┐
│  3 Vouchers Created Successfully                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Voucher: IND001          Status: UNASSIGNED          │  │
│  │ Valid: 180 days          Created: Just now           │  │
│  │                                                       │  │
│  │ [Scan Passport] [Manual Entry] [Skip for now]       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Voucher: IND002          Status: UNASSIGNED          │  │
│  │ Valid: 180 days          Created: Just now           │  │
│  │                                                       │  │
│  │ [Scan Passport] [Manual Entry] [Skip for now]       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Voucher: IND003          Status: UNASSIGNED          │  │
│  │ Valid: 180 days          Created: Just now           │  │
│  │                                                       │  │
│  │ [Scan Passport] [Manual Entry] [Skip for now]       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Print/Email Options:                               │    │
│  │  • Print All (with passport details)                │    │
│  │  • Email to: customer@example.com                   │    │
│  │  • Mark Complete & Continue                         │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  [← Back to Purchase]  [Print All →]  [Email →]  [Done ✓]  │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: Passport Assignment (Per Voucher)
**When "Scan Passport" or "Manual Entry" clicked:**

```
┌─────────────────────────────────────────┐
│  Assign Passport to IND001              │
├─────────────────────────────────────────┤
│                                          │
│  [Scanner Ready 📷]  [Manual Entry ✍️]   │
│                                          │
│  ─── OR ───                             │
│                                          │
│  Passport Number: [__________]          │
│  Nationality: [Papua New Guinea ▼]      │
│  Surname: [__________]                  │
│  Given Name: [__________]               │
│  Date of Birth: [__________]            │
│                                          │
│  [Cancel]  [Assign to IND001 →]        │
└─────────────────────────────────────────┘
```

**MRZ Scanner Behavior:**
- Scans passport → Auto-fills form
- Shows preview: "John DOE (ABC123456)"
- Click "Assign" → Links passport to voucher
- Returns to voucher list
- Next voucher auto-selected for quick entry

---

## Database Changes

### Current Schema (Keep existing)
```sql
-- individual_purchases table (existing)
CREATE TABLE individual_purchases (
  id SERIAL PRIMARY KEY,
  voucher_code VARCHAR(20) UNIQUE NOT NULL,
  passport_number VARCHAR(50),  -- NOW NULLABLE
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  batch_id VARCHAR(50),  -- Already exists
  created_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  used_at TIMESTAMP,
  refunded_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active'  -- 'unassigned', 'assigned', 'used', 'expired', 'refunded'
);

-- passports table (existing - NO CHANGES NEEDED!)
CREATE TABLE passports (
  id SERIAL PRIMARY KEY,
  passport_number VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  nationality VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  passport_expiry DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Key Changes:
1. **`passport_number` now nullable** - Vouchers can exist without passports
2. **Add `status` enum** - Track: `unassigned`, `assigned`, `used`, `expired`, `refunded`
3. **`batch_id` remains** - Group vouchers created together

---

## Backend API Changes

### 1. Create Vouchers Endpoint (SIMPLIFIED)
```javascript
POST /api/individual-purchases/batch

Request:
{
  "quantity": 3,
  "paymentMethod": "CASH",
  "collectedAmount": 150,
  "customerEmail": "customer@example.com",  // optional
  "agentId": 123
}

Response:
{
  "batchId": "BATCH-20260120-001",
  "vouchers": [
    {
      "id": 456,
      "voucherCode": "IND001",
      "amount": 50,
      "status": "unassigned",
      "validUntil": "2026-07-19",
      "passportNumber": null
    },
    {
      "id": 457,
      "voucherCode": "IND002",
      "amount": 50,
      "status": "unassigned",
      "validUntil": "2026-07-19",
      "passportNumber": null
    },
    {
      "id": 458,
      "voucherCode": "IND003",
      "amount": 50,
      "status": "unassigned",
      "validUntil": "2026-07-19",
      "passportNumber": null
    }
  ]
}
```

**Backend Logic:**
```javascript
// 1. Create batch_id
const batchId = `BATCH-${Date.now()}`;

// 2. Create vouchers in loop (NO PASSPORT REQUIRED)
for (let i = 0; i < quantity; i++) {
  const voucherCode = generateVoucherCode('IND');

  await db.query(`
    INSERT INTO individual_purchases (
      voucher_code, amount, payment_method,
      customer_email, batch_id, created_by,
      status, valid_from, valid_until
    ) VALUES ($1, $2, $3, $4, $5, $6, 'unassigned', NOW(), NOW() + INTERVAL '180 days')
  `, [voucherCode, 50, paymentMethod, customerEmail, batchId, agentId]);
}

// 3. Return voucher list (NO COMPLEX PASSPORT LOGIC)
```

### 2. Assign Passport to Voucher Endpoint (NEW)
```javascript
POST /api/individual-purchases/:voucherId/assign-passport

Request:
{
  "passportNumber": "ABC123456",
  "fullName": "John DOE",
  "nationality": "Papua New Guinea",
  "dateOfBirth": "1990-05-15",  // optional
  "passportExpiry": "2028-12-31"  // optional
}

Response:
{
  "success": true,
  "voucher": {
    "voucherCode": "IND001",
    "passportNumber": "ABC123456",
    "status": "assigned",
    "assignedAt": "2026-01-20T10:30:00Z"
  }
}
```

**Backend Logic:**
```javascript
// 1. Create or find passport (SIMPLE - no complex validation)
let passport = await db.query(`
  SELECT * FROM passports WHERE passport_number = $1
`, [passportNumber]);

if (!passport.rows[0]) {
  passport = await db.query(`
    INSERT INTO passports (passport_number, full_name, nationality, date_of_birth, passport_expiry)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [passportNumber, fullName, nationality, dateOfBirth, passportExpiry]);
}

// 2. Link voucher to passport
await db.query(`
  UPDATE individual_purchases
  SET passport_number = $1, status = 'assigned'
  WHERE id = $2
`, [passportNumber, voucherId]);
```

### 3. Get Batch Vouchers Endpoint (NEW)
```javascript
GET /api/individual-purchases/batch/:batchId

Response:
{
  "batchId": "BATCH-20260120-001",
  "createdAt": "2026-01-20T10:00:00Z",
  "quantity": 3,
  "assigned": 2,
  "unassigned": 1,
  "vouchers": [
    {
      "id": 456,
      "voucherCode": "IND001",
      "passportNumber": "ABC123",
      "passportName": "John DOE",
      "status": "assigned"
    },
    {
      "id": 457,
      "voucherCode": "IND002",
      "passportNumber": "XYZ789",
      "passportName": "Jane SMITH",
      "status": "assigned"
    },
    {
      "id": 458,
      "voucherCode": "IND003",
      "passportNumber": null,
      "passportName": null,
      "status": "unassigned"
    }
  ]
}
```

---

## Frontend Components

### 1. New Component: `VoucherCreationForm.jsx`
**Purpose:** Simple form to create vouchers (no passport logic)

**Props:**
- `onSuccess(batchId)` - Called after vouchers created

**Features:**
- Quantity selector (1-5)
- Payment method (Cash/POS)
- Customer email (optional)
- Total amount calculator
- Creates vouchers via API
- Navigates to assignment screen

### 2. New Component: `VoucherAssignmentList.jsx`
**Purpose:** Show batch vouchers and allow passport assignment

**Props:**
- `batchId` - Batch to manage
- `allowSkip` - Can skip passport assignment

**Features:**
- Lists all vouchers in batch
- Status indicators (unassigned/assigned)
- Per-voucher actions: Scan / Manual Entry / Skip
- Progress indicator (2/5 assigned)
- Print/Email batch when ready

### 3. New Component: `PassportAssignmentDialog.jsx`
**Purpose:** Assign passport to specific voucher

**Props:**
- `voucherId` - Voucher to assign to
- `voucherCode` - Display code (e.g., "IND001")
- `onAssigned()` - Callback after success
- `onCancel()` - Close dialog

**Features:**
- MRZ scanner integration
- Manual entry form
- Shows which voucher being assigned
- Calls assignment API
- Returns to voucher list on success

### 4. Updated Component: `IndividualPurchase.jsx`
**Purpose:** Main landing page - MUCH SIMPLER

**Structure:**
```jsx
function IndividualPurchase() {
  const [step, setStep] = useState('create'); // 'create' | 'assign'
  const [batchId, setBatchId] = useState(null);

  return (
    <div>
      {step === 'create' && (
        <VoucherCreationForm
          onSuccess={(batchId) => {
            setBatchId(batchId);
            setStep('assign');
          }}
        />
      )}

      {step === 'assign' && (
        <VoucherAssignmentList
          batchId={batchId}
          allowSkip={true}
        />
      )}
    </div>
  );
}
```

---

## Benefits of New Design

### 1. Simplicity
- **Voucher creation**: No passport validation
- **Passport assignment**: Separate, optional step
- **No complex state management**: Each component focused

### 2. Flexibility
- Can assign passports immediately OR later
- Can leave vouchers unassigned (for walk-ins)
- Can re-assign passport if mistake made

### 3. Real-world workflow
- Matches counter agent behavior:
  1. "I need 3 vouchers" → Create + payment
  2. "Let me scan your passport" → Assign
  3. "Here's your voucher" → Print/email

### 4. Error recovery
- Payment fails? No vouchers created
- Scanner fails? Use manual entry
- Wrong passport? Unassign and re-scan

### 5. Database compatibility
- Works with existing schema
- No complex INSERT with passports
- Simple UPDATE to link voucher

---

## Migration Strategy

### Phase 1: Database Migration (5 minutes)
```sql
-- Add status column
ALTER TABLE individual_purchases
ADD COLUMN status VARCHAR(20) DEFAULT 'active';

-- Make passport_number nullable (if not already)
ALTER TABLE individual_purchases
ALTER COLUMN passport_number DROP NOT NULL;

-- Update existing vouchers
UPDATE individual_purchases
SET status = CASE
  WHEN passport_number IS NOT NULL THEN 'assigned'
  ELSE 'unassigned'
END;
```

### Phase 2: Backend Updates (30 minutes)
1. Simplify `POST /batch` endpoint (remove passport logic)
2. Add `POST /:id/assign-passport` endpoint
3. Add `GET /batch/:batchId` endpoint
4. Test all 3 endpoints with Postman

### Phase 3: Frontend Rebuild (1 hour)
1. Create `VoucherCreationForm.jsx` (20 min)
2. Create `VoucherAssignmentList.jsx` (20 min)
3. Create `PassportAssignmentDialog.jsx` (15 min)
4. Update `IndividualPurchase.jsx` to use new flow (5 min)

### Phase 4: Testing (30 minutes)
1. Create 3 vouchers
2. Assign passports (scan + manual)
3. Print batch
4. Email batch
5. Test skip/later workflow

### Phase 5: Deploy (15 minutes)
1. Run database migration
2. Upload backend
3. Upload frontend
4. Restart services
5. Smoke test

**Total Time:** ~2.5 hours

---

## Quotation List Filter (Bonus Request)

### Current Invoices Filter (to copy from)
```jsx
// From Invoices.jsx
<div className="filters">
  <Input
    placeholder="Search by invoice number..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />

  <Select value={statusFilter} onValueChange={setStatusFilter}>
    <SelectTrigger>
      <SelectValue placeholder="Filter by status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Invoices</SelectItem>
      <SelectItem value="unpaid">Unpaid</SelectItem>
      <SelectItem value="paid">Paid</SelectItem>
      <SelectItem value="overdue">Overdue</SelectItem>
    </SelectContent>
  </Select>

  <Select value={dateFilter} onValueChange={setDateFilter}>
    <SelectTrigger>
      <SelectValue placeholder="Filter by date" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Time</SelectItem>
      <SelectItem value="today">Today</SelectItem>
      <SelectItem value="week">This Week</SelectItem>
      <SelectItem value="month">This Month</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Add to Quotations.jsx (Line ~56, after `loadQuotations()`)
```jsx
// Add filter state
const [searchTerm, setSearchTerm] = useState('');
const [statusFilter, setStatusFilter] = useState('all');
const [dateFilter, setDateFilter] = useState('all');

// Add filtered quotations
const filteredQuotations = quotations.filter(q => {
  // Search filter
  if (searchTerm && !q.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !q.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) {
    return false;
  }

  // Status filter
  if (statusFilter !== 'all') {
    if (statusFilter === 'sent' && !q.sent_at) return false;
    if (statusFilter === 'unsent' && q.sent_at) return false;
    if (statusFilter === 'converted' && !q.converted_to_invoice) return false;
    if (statusFilter === 'pending' && q.converted_to_invoice) return false;
  }

  // Date filter
  if (dateFilter !== 'all') {
    const createdDate = new Date(q.created_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === 'today' && createdDate < today) return false;
    if (dateFilter === 'week' && createdDate < new Date(today - 7 * 24 * 60 * 60 * 1000)) return false;
    if (dateFilter === 'month' && createdDate < new Date(today - 30 * 24 * 60 * 60 * 1000)) return false;
  }

  return true;
});

// Add filter UI (before quotations table)
<div className="filters-container mb-6 flex gap-4">
  <Input
    placeholder="Search by quotation number or customer..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="max-w-sm"
  />

  <Select value={statusFilter} onValueChange={setStatusFilter}>
    <SelectTrigger className="w-[200px]">
      <SelectValue placeholder="Filter by status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Quotations</SelectItem>
      <SelectItem value="sent">Sent</SelectItem>
      <SelectItem value="unsent">Not Sent</SelectItem>
      <SelectItem value="converted">Converted to Invoice</SelectItem>
      <SelectItem value="pending">Pending</SelectItem>
    </SelectContent>
  </Select>

  <Select value={dateFilter} onValueChange={setDateFilter}>
    <SelectTrigger className="w-[200px]">
      <SelectValue placeholder="Filter by date" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Time</SelectItem>
      <SelectItem value="today">Today</SelectItem>
      <SelectItem value="week">This Week</SelectItem>
      <SelectItem value="month">This Month</SelectItem>
    </SelectContent>
  </Select>
</div>

// Use filteredQuotations instead of quotations in the map
{filteredQuotations.map(quotation => (
  // ... existing quotation rendering
))}
```

---

## Summary

### What we're replacing:
- ❌ Complex batch logic with passport collection
- ❌ Error-prone state management
- ❌ Database schema assumptions

### What we're building:
- ✅ Simple voucher creation (like Online Purchase)
- ✅ Flexible passport assignment
- ✅ MRZ scanner check-in workflow
- ✅ Clean separation of concerns

### Time to implement:
- **2.5 hours total**
- Much faster than debugging current implementation
- Proven pattern (Online Purchase works!)

---

**Ready to proceed with this redesign?** It will be much more robust and maintainable than the current batch implementation.
