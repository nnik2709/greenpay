# Passport-Voucher Integration Flow

## Current Implementation Status

The system **already implements** passport-linked vouchers! Here's how it works:

## ✅ Flow 1: Buy Online with Passport Data (`/buy-online`)

**Route:** `https://greenpay.eywademo.cloud/buy-online`

**Process:**
1. Customer enters passport details on `/buy-online` page
2. Frontend calls `POST /api/buy-online/prepare-payment` with passport data
3. Backend stores passport data in `purchase_sessions.passport_data` (JSONB)
4. Customer redirected to payment gateway
5. **Webhook handler (`POST /api/public-purchases/webhook`)** checks for `passport_data`:
   - If passport_data exists → Calls `completePurchaseWithPassport()`
   - Creates/updates `Passport` record atomically
   - Creates `individual_purchases` voucher linked to passport via `passport_number`
   - **Transaction is ATOMIC** (all-or-nothing)
6. Voucher is **ready to scan** - no registration needed!

**Status:** ✅ **FULLY IMPLEMENTED** in `backend/routes/buy-online.js`

### Code Flow:
```javascript
// buy-online.js:645
async function completePurchaseWithPassport(sessionId, paymentData) {
  // BEGIN TRANSACTION
  // 1. Get session with passport_data
  // 2. Create/update Passport record
  // 3. Create voucher linked to passport_number
  // 4. Update session as completed
  // COMMIT (or ROLLBACK if any step fails)
}
```

---

## ⚠️ Flow 2: Buy Voucher WITHOUT Passport (`/buy-voucher`)

**Route:** `https://greenpay.eywademo.cloud/buy-voucher`

**Current Process:**
1. Customer enters only email/phone (NO passport details)
2. Frontend calls `POST /api/public-purchases/create-payment-session`
3. Backend creates session **WITHOUT** `passport_data`
4. Customer completes payment
5. **Webhook handler** creates voucher with `passport_number = 'PENDING'`
6. **Customer MUST register passport later** via `/register/:voucherCode`

**Problem:** The frontend form (`PublicVoucherPurchase.jsx`) does NOT collect passport data!

**Status:** ⚠️ **PARTIALLY IMPLEMENTED** - needs frontend update

---

## 🎯 Recommended Solution

### Option A: Update `/buy-voucher` to match `/buy-online` (Recommended)

**Change `PublicVoucherPurchase.jsx` to:**
1. Add optional passport fields (same as BuyOnline.jsx)
2. If passport provided → Store in `passport_data`
3. Webhook creates voucher with passport atomically
4. If NO passport → Legacy flow (PENDING registration)

**Benefits:**
- ✅ Consistent user experience
- ✅ Single payment flow (less code to maintain)
- ✅ Uses existing atomic transaction logic
- ✅ Backward compatible (still supports vouchers without passport)

---

### Option B: Keep two separate flows (Current approach)

**Keep as-is:**
- `/buy-online` → Passport required, instant voucher
- `/buy-voucher` → No passport, must register later

**Benefits:**
- ✅ Already implemented
- ✅ Clear separation of concerns
- ✅ Simpler frontend (fewer fields)

**Drawbacks:**
- ❌ Two different user experiences
- ❌ Confusing for users (which page to use?)
- ❌ Requires passport registration step

---

## 📋 Current Database Schema

### `purchase_sessions` table:
```sql
CREATE TABLE purchase_sessions (
  id TEXT PRIMARY KEY,
  customer_email TEXT,
  customer_phone TEXT,
  quantity INTEGER,
  amount NUMERIC,
  currency TEXT,
  delivery_method TEXT,
  payment_status TEXT, -- 'pending', 'completed', 'failed'
  passport_data JSONB, -- 🔑 KEY FIELD for passport-linked vouchers
  passport_created BOOLEAN DEFAULT FALSE,
  session_data JSONB,
  payment_gateway_ref TEXT,
  stripe_session_id TEXT,
  expires_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### `passport_data` structure:
```json
{
  "passportNumber": "AB123456",
  "surname": "DOE",
  "givenName": "JOHN",
  "nationality": "Papua New Guinea",
  "dateOfBirth": "1990-01-15",
  "sex": "Male",
  "email": "john@example.com"
}
```

### `individual_purchases` (vouchers):
```sql
CREATE TABLE individual_purchases (
  id SERIAL PRIMARY KEY,
  voucher_code TEXT UNIQUE NOT NULL,
  passport_number TEXT, -- Links to Passport.passportNo
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  amount NUMERIC,
  payment_method TEXT,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  used_at TIMESTAMP,
  purchase_session_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔍 Voucher Validation Logic

### `GET /api/vouchers/validate/:code`

**Current validation checks:**
```javascript
// 1. Look up voucher by code
// 2. Check status:
//    - 'used' → Already scanned
//    - 'expired' → Past valid_until date
//    - 'active' → Has passport_number AND not used AND not expired
//    - 'pending_passport' → Corporate voucher without passport (needs registration)
// 3. If active with passport → Allow scan
// 4. If PENDING → Reject (must register first)
```

**Key logic:**
```javascript
// individual_purchases validation
const status =
  used_at !== null ? 'used' :
  valid_until < NOW() ? 'expired' :
  passport_number === 'PENDING' ? 'pending_passport' :
  'active';
```

---

## 🚀 Implementation Steps (Option A)

### Step 1: Update Frontend (`PublicVoucherPurchase.jsx`)

**Add passport fields:**
```jsx
// Add to formData state
const [formData, setFormData] = useState({
  email: '',
  phone: '',
  quantity: 1,
  preferSMS: true,
  // NEW: Optional passport fields
  includePassport: false,
  passportNumber: '',
  surname: '',
  givenName: '',
  dateOfBirth: '',
  nationality: 'Papua New Guinea',
  sex: 'Male'
});

// Add toggle checkbox
<Checkbox
  checked={formData.includePassport}
  onCheckedChange={(checked) =>
    handleFieldChange('includePassport', checked)
  }
/>
<Label>
  Include passport details now (skip registration step)
</Label>

// Conditionally show passport fields
{formData.includePassport && (
  <>
    <Input name="passportNumber" placeholder="Passport Number" />
    <Input name="surname" placeholder="Surname" />
    <Input name="givenName" placeholder="Given Name(s)" />
    // ... other fields
  </>
)}
```

### Step 2: Update Backend (`public-purchases.js`)

**Modify `POST /api/public-purchases/create-payment-session`:**
```javascript
router.post('/create-payment-session', async (req, res) => {
  const {
    customerEmail,
    customerPhone,
    quantity,
    amount,
    passportData, // 🆕 NEW: Optional passport data
    // ... other fields
  } = req.body;

  // Store passport_data if provided
  const values = [
    sessionId,
    customerEmail,
    customerPhone,
    quantity,
    amount,
    currency,
    deliveryMethod,
    'pending',
    passportData ? JSON.stringify(passportData) : null, // 🆕
    null, // session_data
    expiresAt
  ];

  // ... rest of code
});
```

**Webhook handler already checks for passport_data:**
```javascript
// public-purchases.js:805-820 (ALREADY IMPLEMENTED)
if (sessionCheck.rows[0].passport_data) {
  // Has passport → Atomic creation
  const { completePurchaseWithPassport } = require('./buy-online');
  await completePurchaseWithPassport(sessionId, data);
} else {
  // No passport → Legacy flow (PENDING registration)
  await completeVoucherPurchase(sessionId, data);
}
```

### Step 3: Update Voucher Display

**Show passport details on voucher:**
```javascript
// frontend: PaymentSuccess.jsx or PublicPurchaseCallback.jsx
<Card>
  <CardHeader>
    <CardTitle>✅ Voucher Ready!</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Voucher Code: {voucher.code}</p>
    <img src={voucher.qrCode} alt="Scan this" />

    {voucher.passportNumber !== 'PENDING' ? (
      <Alert>
        <AlertTitle>✓ Passport Registered</AlertTitle>
        <p>Passport: {voucher.passportNumber}</p>
        <p>Name: {voucher.customerName}</p>
        <p><strong>This voucher is ready to scan at the airport!</strong></p>
      </Alert>
    ) : (
      <Alert variant="warning">
        <AlertTitle>⚠️ Registration Required</AlertTitle>
        <p>Please register your passport details:</p>
        <Button onClick={() => navigate(`/register/${voucher.code}`)}>
          Register Passport Now
        </Button>
      </Alert>
    )}
  </CardContent>
</Card>
```

---

## 🧪 Testing Checklist

### Scenario 1: Online purchase WITH passport
- [ ] Go to `/buy-online`
- [ ] Enter passport details
- [ ] Complete payment
- [ ] Verify voucher has passport_number (not PENDING)
- [ ] Scan voucher at `/app/scan` → Should validate successfully

### Scenario 2: Online purchase WITHOUT passport (Legacy)
- [ ] Go to `/buy-voucher`
- [ ] Enter email/phone only
- [ ] Complete payment
- [ ] Verify voucher has passport_number = 'PENDING'
- [ ] Scan voucher → Should show "Registration required"
- [ ] Register passport at `/register/:code`
- [ ] Scan again → Should validate successfully

### Scenario 3: Corporate vouchers
- [ ] Admin creates corporate voucher batch
- [ ] Vouchers have status = 'pending_passport'
- [ ] Customer registers passport via `/register/:code`
- [ ] Scan voucher → Should validate successfully

---

## 📝 Key Files

### Backend:
- `backend/routes/buy-online.js` - Passport-linked voucher creation ✅
- `backend/routes/public-purchases.js` - Generic voucher purchase (needs update)
- `backend/routes/vouchers.js` - Voucher validation logic ✅
- `backend/routes/corporate-voucher-registration.js` - Passport registration

### Frontend:
- `src/pages/BuyOnline.jsx` - Buy with passport ✅
- `src/pages/PublicVoucherPurchase.jsx` - Buy without passport (needs update)
- `src/pages/PublicRegistration.jsx` - Passport registration for PENDING vouchers
- `src/pages/ScanAndValidate.jsx` - Voucher scanning

### Database:
- `backend/migrations/add-passport-data-to-sessions.sql` - Schema migration ✅
- `backend/migrations/create-purchase-sessions-table.sql` - Base schema

---

## 🎯 Recommendation

**Implement Option A** to provide a unified experience:

1. **Update `PublicVoucherPurchase.jsx`** to add optional passport fields
2. **Modify `POST /api/public-purchases/create-payment-session`** to accept `passportData`
3. **Webhook already handles both flows** - no changes needed
4. **Backward compatible** - still supports vouchers without passport

**Result:**
- ✅ Users can provide passport upfront → Skip registration
- ✅ Users without passport → Register later (existing flow)
- ✅ Single codebase, consistent UX
- ✅ Atomic transactions ensure data integrity

---

## 📞 Questions?

**What about bulk corporate vouchers?**
- Corporate vouchers intentionally require separate registration
- Company purchases vouchers → Distributes to employees
- Each employee registers their own passport via `/register/:code`

**What if passport scanner is used?**
- Both pages (`BuyOnline.jsx` and `PublicVoucherPurchase.jsx`) support scanner
- USB keyboard wedge scanners work automatically
- Mobile camera scanning via `SimpleCameraScanner` component

**Database consistency?**
- All voucher creation uses database transactions
- `completePurchaseWithPassport()` is ATOMIC (rollback on any failure)
- No partial states (either everything succeeds or nothing does)

---

**Last Updated:** December 15, 2024
**Status:** Documentation Complete, Implementation Option A Recommended
